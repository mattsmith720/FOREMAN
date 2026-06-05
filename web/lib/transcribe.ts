import { getApiUrl } from "./api-url";

export interface TranscribeResult {
  text: string;
  persisted: boolean;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function transcribeAudioChunk(
  blob: Blob,
  sessionId: string,
): Promise<TranscribeResult> {
  const audio = await blobToDataUrl(blob);
  const response = await fetch(`${getApiUrl()}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio,
      sessionId,
      speaker: "worker",
    }),
  });

  const body = (await response.json()) as {
    text?: string;
    persisted?: boolean;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Transcription request failed");
  }

  return {
    text: body.text?.trim() ?? "",
    persisted: Boolean(body.persisted),
  };
}
