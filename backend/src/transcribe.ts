import { z } from "zod";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";
const WHISPER_RETRIES = 2;
const WHISPER_BACKOFF_MS = 500;
const transcriptionResponseSchema = z.object({
  text: z.string().optional(),
});

interface TranscribeDependencies {
  fetchImpl: typeof fetch;
}

const defaultTranscribeDependencies: TranscribeDependencies = {
  fetchImpl: fetch,
};

function getApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return apiKey;
}

export function isTranscriptionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableWhisperFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  if (
    error instanceof Error &&
    /Transcription provider request failed \([5-9]\d\d\)/.test(error.message)
  ) {
    return true;
  }
  return false;
}

async function fetchWhisperTranscription(
  fetchImpl: typeof fetch,
  formData: FormData,
): Promise<Response> {
  return fetchImpl(WHISPER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });
}

export async function transcribeAudio(
  audio: Buffer,
  mimeType: string,
  dependencies: TranscribeDependencies = defaultTranscribeDependencies,
): Promise<string> {
  const extension = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4") ||
        mimeType.includes("aac") ||
        mimeType.includes("m4a")
      ? "m4a"
      : mimeType.includes("mpeg")
        ? "mp3"
        : mimeType.includes("ogg")
          ? "ogg"
          : mimeType.includes("wav")
            ? "wav"
            : "webm";

  const formData = new FormData();
  formData.append(
    "file",
    new Blob([audio], { type: mimeType }),
    `audio.${extension}`,
  );
  formData.append("model", WHISPER_MODEL);
  formData.append("language", "en");

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= WHISPER_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await sleep(WHISPER_BACKOFF_MS);
    }

    try {
      const response = await fetchWhisperTranscription(
        dependencies.fetchImpl,
        formData,
      );

      if (!response.ok) {
        const error = new Error(
          `Transcription provider request failed (${response.status})`,
        );
        if (response.status >= 500 && attempt < WHISPER_RETRIES) {
          lastError = error;
          continue;
        }
        throw error;
      }

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return "";
      }

      const parsed = transcriptionResponseSchema.safeParse(body);
      if (!parsed.success) {
        return "";
      }

      return (parsed.data.text ?? "").trim();
    } catch (error) {
      if (attempt < WHISPER_RETRIES && isRetryableWhisperFailure(error)) {
        lastError =
          error instanceof Error ? error : new Error(String(error));
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Transcription provider request failed");
}

export function decodeAudioPayload(audio: string): {
  bytes: Buffer;
  mimeType: string;
} {
  const dataUrlMatch = audio.match(/^data:([^;]+);base64,(.+)$/i);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      bytes: Buffer.from(dataUrlMatch[2], "base64"),
    };
  }

  return {
    mimeType: "audio/webm",
    bytes: Buffer.from(audio, "base64"),
  };
}
