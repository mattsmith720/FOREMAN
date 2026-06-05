import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";

/** Skip chunks that would exceed Vercel's serverless body limit. */
const MAX_AUDIO_BYTES = 1_500_000;

export interface TranscribeResult {
  text: string;
  persisted: boolean;
}

function normalizeAudioBlob(blob: Blob): Blob {
  const type = blob.type.toLowerCase();
  if (!type || type === "audio/aac" || type === "audio/x-m4a") {
    return new Blob([blob], { type: "audio/mp4" });
  }
  return blob;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  const normalized = normalizeAudioBlob(blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(normalized);
  });
}

export async function transcribeAudioChunk(
  blob: Blob,
  sessionId: string,
): Promise<TranscribeResult> {
  if (blob.size > MAX_AUDIO_BYTES) {
    return { text: "", persisted: false };
  }

  const audio = await blobToDataUrl(blob);
  const response = await apiFetch("/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio,
      sessionId,
      speaker: "worker",
    }),
  });

  const body = await parseApiResponse<{
    text?: string;
    persisted?: boolean;
  }>(response);

  return {
    text: body.text?.trim() ?? "",
    persisted: Boolean(body.persisted),
  };
}
