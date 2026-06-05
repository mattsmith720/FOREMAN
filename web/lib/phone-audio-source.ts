const CHUNK_INTERVAL_MS = 4000;

export type AudioChunkHandler = (blob: Blob) => void;

export function isMediaRecorderAvailable(): boolean {
  return typeof MediaRecorder !== "undefined";
}

function audioOnlyStream(stream: MediaStream): MediaStream {
  return new MediaStream(stream.getAudioTracks());
}

function buildRecorderOptions(): MediaRecorderOptions[] {
  const candidates = [
    "audio/mp4",
    "audio/aac",
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
  private handlers: AudioChunkHandler[] = [];

  constructor(private readonly stream: MediaStream) {}

  onChunk(handler: AudioChunkHandler): void {
    this.handlers.push(handler);
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

    const optionsList = buildRecorderOptions();
    let lastError: Error | null = null;

    for (const options of optionsList) {
      try {
        const recorder = new MediaRecorder(audioStream, options);
        recorder.addEventListener("dataavailable", (event) => {
          if (event.data.size === 0) {
            return;
          }
          for (const handler of this.handlers) {
            handler(event.data);
          }
        });

        recorder.addEventListener("error", () => {
          // iOS sometimes fires error without throwing on start.
        });

        // Some iOS builds fail with a timeslice — try without first.
        try {
          recorder.start(CHUNK_INTERVAL_MS);
        } catch {
          recorder.start();
        }

        this.recorder = recorder;
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error("Could not start MediaRecorder");
  }

  async stop(): Promise<void> {
    if (!this.recorder || this.recorder.state === "inactive") {
      return;
    }

    await new Promise<void>((resolve) => {
      const recorder = this.recorder;
      if (!recorder) {
        resolve();
        return;
      }

      recorder.addEventListener("stop", () => resolve(), { once: true });
      try {
        recorder.stop();
      } catch {
        resolve();
      }
    });

    this.recorder = null;
  }
}
