const CHUNK_INTERVAL_MS = 4000;

export type AudioChunkHandler = (blob: Blob) => void;

function getSupportedMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm";
}

export class PhoneAudioSource {
  private recorder: MediaRecorder | null = null;
  private handlers: AudioChunkHandler[] = [];

  constructor(private readonly stream: MediaStream) {}

  onChunk(handler: AudioChunkHandler): void {
    this.handlers.push(handler);
  }

  async start(): Promise<void> {
    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error("No microphone track available");
    }

    const mimeType = getSupportedMimeType();
    this.recorder = new MediaRecorder(this.stream, { mimeType });

    this.recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size === 0) {
        return;
      }

      for (const handler of this.handlers) {
        handler(event.data);
      }
    });

    this.recorder.start(CHUNK_INTERVAL_MS);
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
      recorder.stop();
    });

    this.recorder = null;
  }
}
