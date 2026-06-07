const DEFAULT_PORT = 8080;
const DEFAULT_ANALYSE_FRAME_MAX_BYTES = 4 * 1024 * 1024;

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

export function getAnalyseFrameByteCap(): number {
  const raw = process.env.ANALYSE_FRAME_MAX_BYTES?.trim();
  if (!raw) {
    return DEFAULT_ANALYSE_FRAME_MAX_BYTES;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_ANALYSE_FRAME_MAX_BYTES;
  }

  return parsed;
}

// Rough per-call cost estimates for the /ops $-per-session readout. Defaults are
// ballpark for claude-sonnet-4-6 vision (~$0.015/frame) and Whisper (~$0.0004 per
// ~4s chunk); override per-env as pricing/usage shifts. Estimates only.
const DEFAULT_ANALYSE_COST_USD = 0.015;
const DEFAULT_TRANSCRIBE_COST_USD = 0.0004;

function numericEnv(value: string | undefined, fallback: number): number {
  const raw = cleanEnv(value);
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getAnalyseCostUsd(): number {
  return numericEnv(process.env.ANALYSE_COST_USD, DEFAULT_ANALYSE_COST_USD);
}

export function getTranscribeCostUsd(): number {
  return numericEnv(process.env.TRANSCRIBE_COST_USD, DEFAULT_TRANSCRIBE_COST_USD);
}

export function isAllowedImageType(mediaType: string): boolean {
  return ALLOWED_IMAGE_TYPES.has(mediaType);
}

export const ALLOWED_IMAGE_MIME_TYPES = [...ALLOWED_IMAGE_TYPES] as const;
