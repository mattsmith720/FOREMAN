const SAMPLE_SIZE = 64;

/** Force analyse on static scenes so time-on-task and hazards still refresh. */
export const HEARTBEAT_INTERVAL_MS = 45_000;

/** FNV-1a over downscaled grayscale luminance bytes. */
export function hashCanvasFrame(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return null;
  }

  const sampleW = Math.min(SAMPLE_SIZE, canvas.width);
  const sampleH = Math.min(SAMPLE_SIZE, canvas.height);
  const image = ctx.getImageData(0, 0, sampleW, sampleH);
  const { data, width, height } = image;

  let hash = 2_166_136_261;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const lum = Math.round(
        data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114,
      );
      hash ^= lum;
      hash = Math.imul(hash, 16_777_619);
    }
  }

  return (hash >>> 0).toString(16);
}

export function shouldAnalyseScene(
  frameHash: string,
  previousHash: string | null,
  msSinceLastAnalyse: number,
  opts?: { heartbeatMs?: number },
): boolean {
  if (previousHash === null) {
    return true;
  }
  if (frameHash !== previousHash) {
    return true;
  }
  const heartbeatMs = opts?.heartbeatMs ?? HEARTBEAT_INTERVAL_MS;
  return msSinceLastAnalyse >= heartbeatMs;
}

/** Tracks frame-hash scene stability; skip analyse when hash unchanged (with heartbeat). */
export class SceneChangeGate {
  private previousHash: string | null = null;
  private lastEmitAt = 0;
  private forceNext = true;

  /** After pause/resume the view may have changed — always emit next sample. */
  invalidate(): void {
    this.forceNext = true;
  }

  evaluate(
    canvas: HTMLCanvasElement,
    opts?: { heartbeatMs?: number },
  ): { emit: boolean; hash: string | null } {
    const hash = hashCanvasFrame(canvas);
    if (!hash) {
      return { emit: true, hash: null };
    }

    if (this.forceNext) {
      this.forceNext = false;
      this.previousHash = hash;
      this.lastEmitAt = Date.now();
      return { emit: true, hash };
    }

    const msSince = this.lastEmitAt ? Date.now() - this.lastEmitAt : Infinity;
    if (shouldAnalyseScene(hash, this.previousHash, msSince, opts)) {
      this.previousHash = hash;
      this.lastEmitAt = Date.now();
      return { emit: true, hash };
    }

    return { emit: false, hash };
  }
}
