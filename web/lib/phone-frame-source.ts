import type { Frame, FrameHandler, FrameSource } from "@foreman/shared";
import { captureCompressedJpeg } from "./compress-frame";

/** Steady interval while idle; adaptive captureNow() fires sooner after each analyse. */
const SAMPLE_INTERVAL_MS = 6000;
const FIRST_FRAME_DELAY_MS = 500;
const MIN_CAPTURE_GAP_MS = 2800;

interface PhoneFrameSourceOptions {
  includeAudio?: boolean;
}

export class PhoneFrameSource implements FrameSource {
  private stream: MediaStream | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private handlers: FrameHandler[] = [];
  private warmupAttempts = 0;
  private lastCaptureAt = 0;
  private paused = false;

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

  /** Capture as soon as the pipeline is ready (after analyse completes). */
  captureNow(): void {
    if (this.paused) {
      return;
    }
    if (Date.now() - this.lastCaptureAt < MIN_CAPTURE_GAP_MS) {
      return;
    }
    this.captureFrame();
  }

  /**
   * Suspend frame capture without tearing down the camera stream or preview, so
   * a job can be paused and resumed with no getUserMedia / user gesture.
   */
  pause(): void {
    this.paused = true;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Resume capture on the existing live stream. No-op if not paused. */
  resume(): void {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    if (this.stream && this.intervalId === null) {
      this.intervalId = setInterval(() => this.captureNow(), SAMPLE_INTERVAL_MS);
    }
    this.captureNow();
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 640, max: 960 },
        height: { ideal: 480, max: 720 },
      },
      audio: this.options.includeAudio
        ? { echoCancellation: true, noiseSuppression: true }
        : false,
    });

    this.video.srcObject = this.stream;
    await this.video.play();

    setTimeout(() => this.captureFrame(), FIRST_FRAME_DELAY_MS);
    // Watchdog tick via captureNow() so the steady interval honors
    // MIN_CAPTURE_GAP_MS and doesn't race the post-analyse captureNow() into a
    // double capture on a fast link.
    this.intervalId = setInterval(() => this.captureNow(), SAMPLE_INTERVAL_MS);
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
      if (this.warmupAttempts < 4) {
        this.warmupAttempts += 1;
        setTimeout(() => this.captureFrame(), 400);
      }
      return;
    }

    this.warmupAttempts = 0;
    this.lastCaptureAt = Date.now();

    const frame: Frame = {
      data,
      capturedAt: Date.now(),
    };

    for (const handler of this.handlers) {
      handler(frame);
    }
  }
}
