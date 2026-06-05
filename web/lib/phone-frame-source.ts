import type { Frame, FrameHandler, FrameSource } from "@foreman/shared";

const SAMPLE_INTERVAL_MS = 4000;
const JPEG_QUALITY = 0.8;
/** Keeps payloads small over cellular / Vercel proxy. */
const MAX_CAPTURE_WIDTH = 1024;

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
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: this.options.includeAudio ?? false,
    });

    this.video.srcObject = this.stream;
    await this.video.play();

    this.captureFrame();
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
    if (this.video.videoWidth === 0 || this.video.videoHeight === 0) {
      return;
    }

    let width = this.video.videoWidth;
    let height = this.video.videoHeight;
    if (width > MAX_CAPTURE_WIDTH) {
      height = Math.round((height * MAX_CAPTURE_WIDTH) / width);
      width = MAX_CAPTURE_WIDTH;
    }

    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.drawImage(this.video, 0, 0, width, height);

    const frame: Frame = {
      data: this.canvas.toDataURL("image/jpeg", JPEG_QUALITY),
      capturedAt: Date.now(),
    };

    for (const handler of this.handlers) {
      handler(frame);
    }
  }
}
