import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";

export async function fetchVoiceSpeak(text: string): Promise<Blob> {
  const response = await apiFetch("/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const message = await parseApiResponse<{ error?: string }>(response).catch(
      () => ({ error: "Voice synthesis failed" }),
    );
    throw new Error(message.error ?? "Voice synthesis failed");
  }

  return response.blob();
}

export async function fetchConvaiSignedUrl(): Promise<string> {
  const response = await apiFetch("/voice/convai-url", {
    method: "GET",
    cache: "no-store",
  });
  const data = await parseApiResponse<{ signedUrl: string }>(response);
  return data.signedUrl;
}

export interface VoiceAdviceResult {
  reply: string;
  audioBase64?: string;
  audioMime?: string;
}

export async function fetchVoiceAdvice(input: {
  question: string;
  jobType?: string;
  recentTranscript?: string[];
}): Promise<VoiceAdviceResult> {
  const response = await apiFetch("/voice/advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, includeAudio: true }),
  });

  return parseApiResponse<VoiceAdviceResult>(response);
}
