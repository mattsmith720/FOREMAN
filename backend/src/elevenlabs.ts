import { z } from "zod";

/** Charlie — Australian male, casual (ElevenLabs premade). */
export const DEFAULT_AU_VOICE_ID = "IKne3meq5aSn9XLyUdCD";

const TTS_MODELS = ["eleven_turbo_v2_5", "eleven_multilingual_v2"] as const;
const convaiSignedUrlSchema = z.object({
  signed_url: z.string().min(1),
});

export function isElevenLabsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function getElevenLabsVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_AU_VOICE_ID;
}

export function getElevenLabsAgentId(): string | undefined {
  const id = process.env.ELEVENLABS_AGENT_ID?.trim();
  return id || undefined;
}

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY is not set");
  }
  return key;
}

async function synthesizeWithModel(
  text: string,
  voiceId: string,
  modelId: string,
): Promise<Buffer> {
  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  );
  url.searchParams.set("output_format", "mp3_44100_128");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": getApiKey(),
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.8,
        style: 0.1,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS failed (${response.status})`);
  }

  const bytes = await response.arrayBuffer();
  return Buffer.from(bytes);
}

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const voiceId = getElevenLabsVoiceId();
  let lastError: Error | null = null;

  for (const modelId of TTS_MODELS) {
    try {
      return await synthesizeWithModel(text, voiceId, modelId);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("ElevenLabs TTS failed");
    }
  }

  throw lastError ?? new Error("ElevenLabs TTS failed");
}

export async function getConvaiSignedUrl(): Promise<string> {
  const agentId = getElevenLabsAgentId();
  if (!agentId) {
    throw new Error("ELEVENLABS_AGENT_ID is not set for live voice coach");
  }

  const url = new URL(
    "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url",
  );
  url.searchParams.set("agent_id", agentId);

  const response = await fetch(url, {
    method: "GET",
    headers: { "xi-api-key": getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs signed URL failed (${response.status})`);
  }

  const data = convaiSignedUrlSchema.safeParse(await response.json());
  if (!data.success) {
    throw new Error("ElevenLabs signed URL response missing signed_url");
  }

  return data.data.signed_url;
}
