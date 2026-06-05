import type { Frame, FrameHandler, FrameSource } from "@foreman/shared";
import { captureCompressedJpeg } from "./compress-frame";

/** First frame fast; steady interval while Claude catches up. */
const SAMPLE_INTERVAL_MS = 5000;
const FIRST_FRAME_DELAY_MS = 800;

interface PhoneFrameSourceOptions {
  includeAudio?: boolean;
}

export class PhoneFrameSource implements FrameSource {
  private stream: MediaStream | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private handlers: FrameHandler[] = [];

  constructor(
    private readonly video: HTMLVideoElement,
    private readonly canvas: HTMLCanvasElement,
    private readonly options: PhoneFrameSourceOptions = {},
  ) {}

  onFrame(handler: FrameHandler): void {
    this.handlers.push(handler);
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640, max: 1280 },
        height: { ideal: 480, max: 720 },
      },
      audio: this.options.includeAudio
        ? { echoCancellation: true, noiseSuppression: true }
        : false,
    });

    this.video.srcObject = this.stream;
    await this.video.play();

    setTimeout(() => this.captureFrame(), FIRST_FRAME_DELAY_MS);
    this.intervalId = setInterval(() => this.captureFrame(), SAMPLE_INTERVAL_MS);
  }

  async stop(): Promise<void> {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  private captureFrame(): void {
    const data = captureCompressedJpeg(this.video, this.canvas);
    if (!data) {
      return;
    }

    const frame: Frame = {
      data,
      capturedAt: Date.now(),
    };

    for (const handler of this.handlers) {
      handler(frame);
    }
  }
}
