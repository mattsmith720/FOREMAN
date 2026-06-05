import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";

export interface VoiceConfig {
  ttsAvailable: boolean;
  liveAvailable: boolean;
  agentConfigured?: boolean;
  voiceId: string;
  voiceLabel: string;
}

let cached: VoiceConfig | null = null;

export async function fetchVoiceConfig(): Promise<VoiceConfig> {
  if (cached) {
    return cached;
  }

  const response = await apiFetch("/voice/config", {
    method: "GET",
    cache: "no-store",
  });

  cached = await parseApiResponse<VoiceConfig>(response);
  return cached;
}

export function clearVoiceConfigCache(): void {
  cached = null;
}
