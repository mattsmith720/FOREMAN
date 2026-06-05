const DEFAULT_PORT = 8080;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAnalysisConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export function isTranscriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getCorsOrigins(): string[] | true {
  const raw = process.env.CORS_ORIGINS?.trim();
  if (!raw || raw === "*") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CORS_ORIGINS must be set in production");
    }
    return true;
  }
  return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export function isApiKeyRequired(): boolean {
  return Boolean(process.env.FOREMAN_API_KEY?.trim());
}

export function getListenPort(): number {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  if (!Number.isFinite(port) || port <= 0) {
    return DEFAULT_PORT;
  }
  return port;
}

export function isAllowedImageType(mediaType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mediaType);
}

export const ALLOWED_IMAGE_MIME_TYPES = [...ALLOWED_IMAGE_TYPES] as const;
