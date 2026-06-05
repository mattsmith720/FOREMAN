/** Stay under Vercel's ~4.5 MB serverless body limit (JSON + base64 overhead). */
const MAX_DATA_URL_CHARS = 1_800_000;

const WIDTH_STEPS = [720, 560, 420] as const;
const QUALITY_STEPS = [0.62, 0.5, 0.38, 0.28] as const;

function drawScaled(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  maxWidth: number,
): { width: number; height: number } | null {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
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
    return null;
  }

  ctx.drawImage(video, 0, 0, width, height);
  return { width, height };
}

export function captureCompressedJpeg(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): string | null {
  let best = "";

  for (const maxWidth of WIDTH_STEPS) {
    if (!drawScaled(video, canvas, maxWidth)) {
      return null;
    }

    for (const quality of QUALITY_STEPS) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      if (dataUrl.length <= MAX_DATA_URL_CHARS) {
        return dataUrl;
      }
      best = dataUrl;
    }
  }

  return best || null;
}
