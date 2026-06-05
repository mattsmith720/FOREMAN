/** Stay under Vercel's ~4.5 MB serverless body limit (JSON + base64 overhead). */
const MAX_DATA_URL_CHARS = 900_000;

/** Fast path for phone — one encode when possible. */
const DEFAULT_MAX_WIDTH = 480;
const DEFAULT_QUALITY = 0.5;

const FALLBACK_WIDTHS = [400, 320] as const;
const FALLBACK_QUALITIES = [0.38, 0.28] as const;

function drawScaled(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxWidth: number,
): boolean {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return false;
  }

  let width = video.videoWidth;
  let height = video.videoHeight;
  if (width > maxWidth) {
    height = Math.round((height * maxWidth) / width);
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return false;
  }

  ctx.drawImage(video, 0, 0, width, height);
  return true;
}

function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): string | null {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (dataUrl.length <= MAX_DATA_URL_CHARS) {
    return dataUrl;
  }
  return null;
}

export function captureCompressedJpeg(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  if (!drawScaled(video, canvas, DEFAULT_MAX_WIDTH)) {
    return null;
  }

  const primary = encodeJpeg(canvas, DEFAULT_QUALITY);
  if (primary) {
    return primary;
  }

  for (const maxWidth of FALLBACK_WIDTHS) {
    if (!drawScaled(video, canvas, maxWidth)) {
      continue;
    }
    for (const quality of FALLBACK_QUALITIES) {
      const dataUrl = encodeJpeg(canvas, quality);
      if (dataUrl) {
        return dataUrl;
      }
    }
  }

  if (!drawScaled(video, canvas, 240)) {
    return null;
  }

  return encodeJpeg(canvas, 0.22);
}
