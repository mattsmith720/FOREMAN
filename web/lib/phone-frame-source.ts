import type { Frame, FrameHandler, FrameSource } from "@foreman/shared";
import {
  captureCompressedJpeg,
  captureStampedJpeg,
  type StampMeta,
} from "./compress-frame";
import {
  facingModeForEvidenceType,
  facingModeForShot,
} from "./compliance-evidence-handler";
import type { ComplianceShotId } from "./compliance-pack";
import {
  estimateFrameSharpness,
  SCAN_SHARPNESS_MIN,
} from "./frame-sharpness";
import type { InteractionMode } from "./interaction-mode";
import { SceneChangeGate } from "./scene-change";
import type { SessionSpendCap } from "./session-spend-cap";

/**
 * L6 sampling CONTRACT (integrator: camera-coach.tsx):
 * - Pass `spendCap: new SessionSpendCap()` at job start; wire `onSpendCapWarning` for voice/HUD.
 * - Call `spendCap.recordTranscribe()` after each successful transcribe chunk.
 * - `onFrameSkipped("scene")` when hash unchanged — optional debug counter; loop continues via captureNow.
 * - Scene gating defaults on in watch mode, off in scan (L3 sharpness owns scan).
 */

/** Steady interval while idle; adaptive captureNow() fires sooner after each analyse. */
const SAMPLE_INTERVAL_MS = 6000;
const FIRST_FRAME_DELAY_MS = 500;
const MIN_CAPTURE_GAP_MS = 2800;
/** Retake loop after isGoodEvidence: false — ≤1.5s per R3 DoD. */
const RETAKE_CAPTURE_GAP_MS = 1400;

export type CameraFacingMode = "user" | "environment";

interface PhoneFrameSourceOptions {
  includeAudio?: boolean;
  /** scan = point-and-verdict (no steady tick); watch = continuous coaching. */
  mode?: InteractionMode;
  /** CER geotag + timestamp burned into each JPEG (install compliance pack). */
  stampMeta?: () => StampMeta | null;
  /** Initial or dynamic rear/front policy (selfie shots use user). */
  facingMode?: CameraFacingMode | (() => CameraFacingMode);
  /** Skip emit when frame hash unchanged (default: true except scan mode). */
  sceneChangeGating?: boolean;
  /** Soft spend tally; warning via onSpendCapWarning, never blocks emit. */
  spendCap?: SessionSpendCap;
  onFrameSkipped?: (reason: "scene") => void;
  onSpendCapWarning?: () => void;
}

export class PhoneFrameSource implements FrameSource {
  private stream: MediaStream | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private handlers: FrameHandler[] = [];
  private warmupAttempts = 0;
  private lastCaptureAt = 0;
  private paused = false;
  private activeFacingMode: CameraFacingMode = "environment";
  private readonly sceneGate = new SceneChangeGate();

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

  getFacingMode(): CameraFacingMode {
    return this.activeFacingMode;
  }

  /** Capture as soon as the pipeline is ready (after analyse completes). */
  captureNow(options?: { accelerate?: boolean }): void {
    if (this.paused) {
      return;
    }
    const gap = options?.accelerate ? RETAKE_CAPTURE_GAP_MS : MIN_CAPTURE_GAP_MS;
    if (Date.now() - this.lastCaptureAt < gap) {
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
    this.sceneGate.invalidate();
    if (this.stream && this.intervalId === null) {
      this.intervalId = setInterval(() => this.captureNow(), SAMPLE_INTERVAL_MS);
    }
    this.captureNow();
  }

  async start(): Promise<void> {
    const facingMode = this.resolveFacingMode();
    this.activeFacingMode = facingMode;
    this.stream = await this.openMediaStream(facingMode);

    this.video.srcObject = this.stream;
    await this.video.play();

    setTimeout(() => this.captureFrame(), FIRST_FRAME_DELAY_MS);
    // Watch mode keeps a steady tick; scan mode only fires after each analyse.
    if (this.options.mode !== "scan") {
      this.intervalId = setInterval(() => this.captureNow(), SAMPLE_INTERVAL_MS);
    }
  }

  /** Switch camera for selfie vs environment evidence (keeps audio tracks). */
  async setFacingMode(mode: CameraFacingMode): Promise<void> {
    if (mode === this.activeFacingMode && this.stream?.getVideoTracks().length) {
      return;
    }
    await this.recycleVideoStream(mode);
    this.activeFacingMode = mode;
    if (typeof this.options.facingMode !== "function") {
      this.options.facingMode = mode;
    }
  }

  /** Flip camera when the guided compliance target changes. */
  async setFacingForShot(shotId: ComplianceShotId): Promise<void> {
    await this.setFacingMode(facingModeForShot(shotId));
  }

  /** Flip when model evidenceShot requests a selfie type (setup / testing). */
  async setFacingForEvidenceType(evidenceType: string): Promise<void> {
    await this.setFacingMode(facingModeForEvidenceType(evidenceType));
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

  private resolveFacingMode(): CameraFacingMode {
    const source = this.options.facingMode;
    if (typeof source === "function") {
      return source();
    }
    return source ?? "environment";
  }

  private async openMediaStream(
    facingMode: CameraFacingMode,
  ): Promise<MediaStream> {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640, max: 960 },
        height: { ideal: 480, max: 720 },
      },
      audio: this.options.includeAudio
        ? { echoCancellation: true, noiseSuppression: true }
        : false,
    });
  }

  private async recycleVideoStream(facingMode: CameraFacingMode): Promise<void> {
    const audioTracks = this.stream?.getAudioTracks() ?? [];
    this.stream?.getVideoTracks().forEach((track) => track.stop());

    const videoOnly = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 640, max: 960 },
        height: { ideal: 480, max: 720 },
      },
      audio: false,
    });

    const tracks = [...audioTracks, ...videoOnly.getVideoTracks()];
    this.stream = new MediaStream(tracks);
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  private captureFrame(): void {
    const stamp = this.options.stampMeta?.() ?? null;
    const data = stamp
      ? captureStampedJpeg(this.video, this.canvas, stamp)
      : captureCompressedJpeg(this.video, this.canvas);
    if (!data) {
      if (this.warmupAttempts < 4) {
        this.warmupAttempts += 1;
        setTimeout(() => this.captureFrame(), 400);
      }
      return;
    }

    if (this.options.mode === "scan") {
      const sharpness = estimateFrameSharpness(this.canvas);
      if (sharpness < SCAN_SHARPNESS_MIN) {
        setTimeout(() => this.captureNow(), 900);
        return;
      }
    }

    this.warmupAttempts = 0;
    this.lastCaptureAt = Date.now();

    const sceneGating =
      this.options.sceneChangeGating ?? this.options.mode !== "scan";
    if (sceneGating) {
      const { emit } = this.sceneGate.evaluate(this.canvas);
      if (!emit) {
        this.options.onFrameSkipped?.("scene");
        this.captureNow();
        return;
      }
    }

    if (this.options.spendCap?.consumeWarning()) {
      this.options.onSpendCapWarning?.();
    }
    this.options.spendCap?.recordAnalyse();

    const frame: Frame = {
      data,
      capturedAt: Date.now(),
    };

    for (const handler of this.handlers) {
      handler(frame);
    }
  }
}
