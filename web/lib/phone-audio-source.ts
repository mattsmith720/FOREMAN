const CHUNK_INTERVAL_MS = 4000;

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

  async stop(): Promise<void> {
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
