const DEFAULT_PORT = 8080;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function isAnalysisConfigured(): boolean {
  return Boolean(cleanEnv(process.env.ANTHROPIC_API_KEY));
}

export function isOpenAiConfigured(): boolean {
  return Boolean(cleanEnv(process.env.OPENAI_API_KEY));
}

export function isTranscriptionConfigured(): boolean {
  return isOpenAiConfigured();
}

export function isSupabaseConfigured(): boolean {
  const url = cleanEnv(process.env.SUPABASE_URL);
  const serviceRoleKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !serviceRoleKey) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isElevenLabsConfigured(): boolean {
  return Boolean(cleanEnv(process.env.ELEVENLABS_API_KEY));
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
