import { z } from "zod";

const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";
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

  const response = await dependencies.fetchImpl(WHISPER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription provider request failed (${response.status})`);
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
