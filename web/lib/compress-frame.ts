import { stampEvidenceOverlay } from "./stamp-frame";

/** Stay under Vercel's ~4.5 MB serverless body limit (JSON + base64 overhead). */
export const MAX_DATA_URL_CHARS = 900_000;

export interface StampMeta {
  capturedAt: string;
  lat: number | null;
  lng: number | null;
}

export function dataUrlWithinLimit(dataUrl: string): boolean {
  return dataUrl.length <= MAX_DATA_URL_CHARS;
}

/** Fast path for phone — one encode when possible. */
const DEFAULT_MAX_WIDTH = 384;
const DEFAULT_QUALITY = 0.45;

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
  if (dataUrlWithinLimit(dataUrl)) {
    return dataUrl;
  }
  return null;
}

function captureWithOptionalStamp(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stamp?: StampMeta,
): string | null {
  if (!drawScaled(video, canvas, DEFAULT_MAX_WIDTH)) {
    return null;
  }
  if (stamp) {
    stampEvidenceOverlay(canvas, stamp);
  }

  const primary = encodeJpeg(canvas, DEFAULT_QUALITY);
  if (primary) {
    return primary;
  }

  for (const maxWidth of FALLBACK_WIDTHS) {
    if (!drawScaled(video, canvas, maxWidth)) {
      continue;
    }
    if (stamp) {
      stampEvidenceOverlay(canvas, stamp);
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
  if (stamp) {
    stampEvidenceOverlay(canvas, stamp);
  }

  return encodeJpeg(canvas, 0.22);
}

export function captureCompressedJpeg(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  return captureWithOptionalStamp(video, canvas);
}

export function captureStampedJpeg(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  stamp: StampMeta,
): string | null {
  return captureWithOptionalStamp(video, canvas, stamp);
}
