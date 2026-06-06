/** Charlie — Australian male, casual (ElevenLabs premade). */
export const DEFAULT_AU_VOICE_ID = "IKne3meq5aSn9XLyUdCD";

const TTS_MODELS = ["eleven_turbo_v2_5", "eleven_multilingual_v2"] as const;

export function isElevenLabsTtsConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY?.trim());
}

export function getElevenLabsVoiceId(): string {
  return process.env.ELEVENLABS_VOICE_ID?.trim() || DEFAULT_AU_VOICE_ID;
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
  fetchImpl: typeof fetch,
): Promise<ArrayBuffer> {
  const url = new URL(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  );
  url.searchParams.set("output_format", "mp3_44100_128");

  const response = await fetchImpl(url, {
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
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${detail}`);
  }

  return response.arrayBuffer();
}

export async function synthesizeElevenLabsSpeech(
  text: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ArrayBuffer> {
  const voiceId = getElevenLabsVoiceId();
  let lastError: Error | null = null;

  for (const modelId of TTS_MODELS) {
    try {
      return await synthesizeWithModel(text, voiceId, modelId, fetchImpl);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("ElevenLabs TTS failed");
    }
  }

  throw lastError ?? new Error("ElevenLabs TTS failed");
}
