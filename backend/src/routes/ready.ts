import type { FastifyInstance } from "fastify";
import {
  isAnalysisConfigured,
  isElevenLabsConfigured,
  isOpenAiConfigured,
  isSupabaseConfigured,
  isTranscriptionConfigured,
} from "../config.js";

type ReadyResponse = {
  ok: boolean;
  anthropic: boolean;
  openai: boolean;
  supabase: boolean;
  transcription: boolean;
  elevenlabs?: boolean;
};

export async function registerReadyRoute(app: FastifyInstance): Promise<void> {
  app.get("/ready", async (): Promise<ReadyResponse> => {
    const anthropic = isAnalysisConfigured();
    const openai = isOpenAiConfigured();
    const supabase = isSupabaseConfigured();
    const transcription = isTranscriptionConfigured();

    const response: ReadyResponse = {
      ok: anthropic && openai && supabase && transcription,
      anthropic,
      openai,
      supabase,
      transcription,
    };

    if (typeof process.env.ELEVENLABS_API_KEY === "string") {
      response.elevenlabs = isElevenLabsConfigured();
    }

    return response;
  });
}
