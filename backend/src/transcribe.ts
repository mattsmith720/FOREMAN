const WHISPER_URL = "https://api.openai.com/v1/audio/transcriptions";
const WHISPER_MODEL = "whisper-1";

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

  const response = await fetch(WHISPER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${detail}`);
  }

  const body = (await response.json()) as { text?: string };
  return (body.text ?? "").trim();
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
