import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { assertActiveSession } from "../db/sessions.js";
import { persistTranscriptSegment } from "../db/transcript.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  decodeAudioPayload,
  isTranscriptionConfigured,
  transcribeAudio,
} from "../transcribe.js";

const transcribeRequestSchema = z.object({
  audio: z.string().min(1).max(20_000_000),
  sessionId: z.string().uuid().optional(),
  speaker: z.string().max(100).optional(),
});

export async function registerTranscribeRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post(
    "/transcribe",
    {
      config: {
        rateLimit: { max: 30, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      if (!isTranscriptionConfigured()) {
        return reply.status(503).send({
          error: "OPENAI_API_KEY is not set for speech transcription",
        });
      }

      const parsed = transcribeRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        if (parsed.data.sessionId) {
          if (!isSupabaseConfigured()) {
            return reply.status(503).send({
              error: "Supabase is not configured for session logging",
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
        const { statusCode, message } = toClientError(
          err,
          "Transcription failed",
        );
        return reply.status(statusCode).send({ error: message });
      }
    },
  );
}
