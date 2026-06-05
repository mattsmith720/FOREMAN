import { ALLOWED_IMAGE_MIME_TYPES } from "./config.js";

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
]);

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function detectImageMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function validateImageBytes(
  bytes: Buffer,
  declaredType: string,
): { mediaType: (typeof ALLOWED_IMAGE_MIME_TYPES)[number] } {
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("Image payload size is invalid");
  }

  const detected = detectImageMime(bytes);
  const normalized = declaredType.toLowerCase();
  const mediaType = (detected ?? normalized) as (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mediaType)) {
    throw new Error("Unsupported image type");
  }

  if (detected && detected !== normalized.replace(/;.*$/, "")) {
    throw new Error("Image content does not match declared type");
  }

  return { mediaType };
}

export function validateAudioBytes(
  bytes: Buffer,
  declaredType: string,
): { mimeType: string } {
  if (bytes.length === 0 || bytes.length > MAX_AUDIO_BYTES) {
    throw new Error("Audio payload size is invalid");
  }

  let mimeType = declaredType.toLowerCase().replace(/;.*$/, "").trim();
  if (mimeType === "audio/aac" || mimeType === "audio/x-m4a") {
    mimeType = "audio/mp4";
  }

  if (!ALLOWED_AUDIO_MIME_TYPES.has(mimeType) && mimeType !== "audio/mp4") {
    throw new Error("Unsupported audio type");
  }

  return { mimeType };
}
