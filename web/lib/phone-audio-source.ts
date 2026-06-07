const CHUNK_INTERVAL_MS = 4000;

// Voice-activity detection: sample the mic ~5x per chunk and only forward a
// chunk that held enough speech, so on-site silence isn't transcribed (saves
// Whisper cost + noise). Fails OPEN — if the AudioContext can't run, every
// chunk is sent, preserving today's behaviour.
const VAD_SAMPLE_MS = 200;
const VOICE_RMS_THRESHOLD = 0.025;
const MIN_VOICE_SAMPLES = 3;

export type AudioChunkHandler = (blob: Blob) => void;
export type AudioErrorHandler = (message: string) => void;

export function isMediaRecorderAvailable(): boolean {
  return typeof MediaRecorder !== "undefined";
}

function audioOnlyStream(stream: MediaStream): MediaStream {
  return new MediaStream(stream.getAudioTracks());
}

function buildRecorderOptions(): MediaRecorderOptions[] {
  const candidates = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];

  const options: MediaRecorderOptions[] = [{}];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      options.push({ mimeType });
    }
  }

  return options;
}

async function waitForLiveTrack(track: MediaStreamTrack): Promise<void> {
  if (track.readyState === "live") {
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, 350));
}

export class PhoneAudioSource {
  private recorder: MediaRecorder | null = null;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;
  private handlers: AudioChunkHandler[] = [];
  private errorHandler: AudioErrorHandler | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private vadTimer: ReturnType<typeof setInterval> | null = null;
  private vadData: Uint8Array<ArrayBuffer> | null = null;
  private voiceSamples = 0;
  private vadReady = false;

  constructor(private readonly stream: MediaStream) {}

  onChunk(handler: AudioChunkHandler): void {
    this.handlers.push(handler);
  }

  onError(handler: AudioErrorHandler): void {
    this.errorHandler = handler;
  }

  async start(): Promise<void> {
    if (!isMediaRecorderAvailable()) {
      throw new Error("MediaRecorder is not supported on this browser");
    }

    const audioStream = audioOnlyStream(this.stream);
    const [track] = audioStream.getAudioTracks();
    if (!track) {
      throw new Error("No microphone track available");
    }

    await waitForLiveTrack(track).catch(() => undefined);

    if (track.readyState !== "live") {
      throw new Error("Microphone is not active");
    }

    this.setupVad(audioStream);

    const optionsList = buildRecorderOptions();
    let lastError: Error | null = null;

    for (const options of optionsList) {
      try {
        const recorder = new MediaRecorder(audioStream, options);
        let usesTimeslice = true;

        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size === 0) {
            return;
          }
          // VAD gate: only forward a chunk that held enough voice this window.
          // Fails open when VAD isn't running (vadReady false).
          const hadVoice =
            !this.vadReady || this.voiceSamples >= MIN_VOICE_SAMPLES;
          this.voiceSamples = 0;
          if (!hadVoice) {
            return;
          }
          const blob =
            event.data.type === "audio/aac"
              ? new Blob([event.data], { type: "audio/mp4" })
              : event.data;
          for (const handler of this.handlers) {
            handler(blob);
          }
        });

        recorder.addEventListener("error", () => {
          this.errorHandler?.("Microphone recorder error");
        });

        try {
          recorder.start(CHUNK_INTERVAL_MS);
        } catch {
          usesTimeslice = false;
          recorder.start();
        }

        if (!usesTimeslice) {
          this.chunkTimer = setInterval(() => {
            if (recorder.state === "recording") {
              try {
                recorder.requestData();
              } catch {
                // ignore — recorder may have stopped
              }
            }
          }, CHUNK_INTERVAL_MS);
        }

        this.recorder = recorder;
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error("Could not start MediaRecorder");
  }

  private setupVad(audioStream: MediaStream): void {
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) {
        return;
      }
      const ctx = new Ctor();
      void ctx.resume?.();
      const source = ctx.createMediaStreamSource(audioStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      this.audioContext = ctx;
      this.analyser = analyser;
      this.vadData = new Uint8Array(analyser.fftSize);
      this.voiceSamples = 0;
      this.vadReady = true;
      this.vadTimer = setInterval(() => this.sampleVad(), VAD_SAMPLE_MS);
    } catch {
      // Fail open: leave vadReady false so every chunk is transcribed.
      this.vadReady = false;
    }
  }

  private sampleVad(): void {
    const analyser = this.analyser;
    const data = this.vadData;
    if (!analyser || !data) {
      return;
    }
    analyser.getByteTimeDomainData(data);
    let sumSq = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / data.length);
    if (rms > VOICE_RMS_THRESHOLD) {
      this.voiceSamples += 1;
    }
  }

  private teardownVad(): void {
    if (this.vadTimer !== null) {
      clearInterval(this.vadTimer);
      this.vadTimer = null;
    }
    void this.audioContext?.close?.();
    this.audioContext = null;
    this.analyser = null;
    this.vadData = null;
    this.vadReady = false;
    this.voiceSamples = 0;
  }

  async stop(): Promise<void> {
    this.teardownVad();

    if (this.chunkTimer !== null) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }

    const recorder = this.recorder;
    this.recorder = null;
    if (!recorder || recorder.state === "inactive") {
      return;
    }

    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) {
          return;
        }
        done = true;
        resolve();
      };
      // Never let a wedged MediaRecorder hang End job — cap the wait. The mic
      // tracks are released by PhoneFrameSource.stop() right after, so a missed
      // final chunk is the only cost.
      const timer = setTimeout(finish, 2000);
      recorder.addEventListener(
        "stop",
        () => {
          clearTimeout(timer);
          finish();
        },
        { once: true },
      );
      try {
        recorder.requestData();
        recorder.stop();
      } catch {
        clearTimeout(timer);
        finish();
      }
    });
  }
}
