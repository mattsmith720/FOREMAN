import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { assertActiveSession } from "../db/sessions.js";
import { persistTranscriptSegment } from "../db/transcript.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  decodeAudioPayload,
  isTranscriptionConfigured,
  transcribeAudio,
} from "../transcribe.js";

const transcribeRequestSchema = z.object({
  audio: z.string().min(1),
  sessionId: z.string().uuid().optional(),
  speaker: z.string().optional(),
});

export async function registerTranscribeRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post("/transcribe", async (request, reply) => {
    if (!isTranscriptionConfigured()) {
      return reply.status(503).send({
        error: "OPENAI_API_KEY is not set for speech transcription",
      });
    }

    const parsed = transcribeRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    try {
      if (parsed.data.sessionId) {
        if (!isSupabaseConfigured()) {
          return reply.status(503).send({
            error:
              "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          });
        }
        await assertActiveSession(parsed.data.sessionId);
      }

      const { bytes, mimeType } = decodeAudioPayload(parsed.data.audio);
      if (bytes.length < 1000) {
        return reply.send({ text: "", persisted: false });
      }

      const text = await transcribeAudio(bytes, mimeType);
      if (!text) {
        return reply.send({ text: "", persisted: false });
      }

      let segment;
      if (parsed.data.sessionId) {
        segment = await persistTranscriptSegment({
          sessionId: parsed.data.sessionId,
          text,
          speaker: parsed.data.speaker,
        });
      }

      return reply.send({
        text,
        persisted: Boolean(segment),
        segment,
      });
    } catch (err) {
      request.log.error(err);
      const message =
        err instanceof Error ? err.message : "Transcription failed";
      return reply.status(500).send({ error: message });
    }
  });
}
