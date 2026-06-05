/**
 * FrameSource is the single seam between the capture device and the pipeline.
 *
 * Implementations over the life of the project (see CLAUDE.md):
 *   1. Phone web camera (now), via the browser camera API in the web client.
 *   2. Meta smart glasses (later), via the native app and the Meta toolkit.
 *
 * The pipeline downstream is identical regardless of source. Audio support will be added
 * to this seam later; for now it covers frame capture only.
 *
 * This is an interface stub only — no implementation yet.
 */

/** A single captured frame. */
export interface Frame {
  /**
   * Encoded image data for this frame. The exact encoding (data URL vs. raw base64) is
   * fixed when the first FrameSource is implemented.
   */
  readonly data: string;
  /** Capture time, milliseconds since the Unix epoch. */
  readonly capturedAt: number;
}

/** Callback invoked once per sampled frame. */
export type FrameHandler = (frame: Frame) => void;

export interface FrameSource {
  /** Begin capturing. Sampled frames are delivered to handlers registered via onFrame. */
  start(): Promise<void>;
  /** Stop capturing and release the underlying device. */
  stop(): Promise<void>;
  /** Register a handler invoked once per sampled frame. */
  onFrame(handler: FrameHandler): void;
}
