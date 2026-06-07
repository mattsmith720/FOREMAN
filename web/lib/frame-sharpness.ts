/** Laplacian-variance sharpness on a downscaled canvas sample (0 = blurry). */
export function estimateFrameSharpness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return 0;
  }

  const sampleW = Math.min(64, canvas.width);
  const sampleH = Math.min(64, canvas.height);
  const image = ctx.getImageData(0, 0, sampleW, sampleH);
  const { data, width, height } = image;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const gray =
        data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const up = (y - 1) * width + x;
      const down = (y + 1) * width + x;
      const left = y * width + (x - 1);
      const right = y * width + (x + 1);
      const lap =
        -4 * gray +
        (data[up * 4] * 0.299 +
          data[up * 4 + 1] * 0.587 +
          data[up * 4 + 2] * 0.114) +
        (data[down * 4] * 0.299 +
          data[down * 4 + 1] * 0.587 +
          data[down * 4 + 2] * 0.114) +
        (data[left * 4] * 0.299 +
          data[left * 4 + 1] * 0.587 +
          data[left * 4 + 2] * 0.114) +
        (data[right * 4] * 0.299 +
          data[right * 4 + 1] * 0.587 +
          data[right * 4 + 2] * 0.114);
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }

  if (count === 0) {
    return 0;
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return Math.max(0, variance);
}

/** Minimum sharpness before a scan-mode frame is sent for CER verdict. */
export const SCAN_SHARPNESS_MIN = 120;
