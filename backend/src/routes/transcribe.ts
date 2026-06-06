import type { FastifyError, FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { assertActiveSession } from "../db/sessions.js";
import {
  persistTranscriptSegment,
  type TranscriptSegmentRow,
} from "../db/transcript.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { requireSessionToken } from "../require-session-token.js";
import {
  decodeAudioPayload,
  isTranscriptionConfigured,
  transcribeAudio,
} from "../transcribe.js";
import { validateAudioBytes } from "../validate-media.js";

const TRANSCRIBE_BODY_LIMIT_BYTES = 15 * 1024 * 1024;
// Route-local fallback until shared body-size limits are centralized in config.ts.
const TRANSCRIBE_RAW_AUDIO_LIMIT_BYTES = 10 * 1024 * 1024;

const transcribeRequestSchema = z.object({
  audio: z.string().min(1).max(20_000_000),
  sessionId: z.string().uuid().optional(),
  speaker: z.string().max(100).optional(),
});

interface TranscribeRouteDependencies {
  isTranscriptionConfigured: typeof isTranscriptionConfigured;
  requireSessionToken: typeof requireSessionToken;
  isSupabaseConfigured: typeof isSupabaseConfigured;
  assertActiveSession: typeof assertActiveSession;
  decodeAudioPayload: typeof decodeAudioPayload;
  validateAudioBytes: typeof validateAudioBytes;
  transcribeAudio: typeof transcribeAudio;
  persistTranscriptSegment: typeof persistTranscriptSegment;
}

const defaultDependencies: TranscribeRouteDependencies = {
  isTranscriptionConfigured,
  requireSessionToken,
  isSupabaseConfigured,
  assertActiveSession,
  decodeAudioPayload,
  validateAudioBytes,
  transcribeAudio,
  persistTranscriptSegment,
};

function contentLength(request: { headers: Record<string, unknown> }): number | null {
  const header = request.headers["content-length"];
  const raw = Array.isArray(header) ? header[0] : header;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function isPayloadTooLargeError(error: FastifyError): boolean {
  return error.statusCode === 413 || error.code === "FST_ERR_CTP_BODY_TOO_LARGE";
}

function isMalformedJsonError(error: FastifyError): boolean {
  return (
    error.code === "FST_ERR_CTP_INVALID_JSON_BODY" ||
    error.message.toLowerCase().includes("json")
  );
}

export async function registerTranscribeRoutes(
  app: FastifyInstance,
  dependencies: TranscribeRouteDependencies = defaultDependencies,
): Promise<void> {
  app.post(
    "/transcribe",
    {
      config: {
        rateLimit: { max: 30, timeWindow: "1 minute" },
      },
      bodyLimit: TRANSCRIBE_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > TRANSCRIBE_BODY_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        return undefined;
      },
      errorHandler: (error, request, reply) => {
        if (isPayloadTooLargeError(error)) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        if (isMalformedJsonError(error)) {
          return reply.status(400).send({ error: "Malformed JSON body" });
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Transcription request failed" });
      },
    },
    async (request, reply) => {
      if (!dependencies.isTranscriptionConfigured()) {
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
          if (
            !dependencies.requireSessionToken(request, reply, parsed.data.sessionId)
          ) {
            return;
          }

          if (!dependencies.isSupabaseConfigured()) {
            return reply.status(503).send({
              error: "Supabase is not configured for session logging",
            });
          }
          await dependencies.assertActiveSession(parsed.data.sessionId);
        }

        const { bytes, mimeType: declaredType } = dependencies.decodeAudioPayload(
          parsed.data.audio,
        );
        if (bytes.length > TRANSCRIBE_RAW_AUDIO_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Audio payload too large" });
        }
        const { mimeType } = dependencies.validateAudioBytes(bytes, declaredType);
        if (bytes.length < 1000) {
          return reply.send({ text: "", persisted: false });
        }

        let text: string;
        try {
          text = await dependencies.transcribeAudio(bytes, mimeType);
        } catch (providerErr) {
          request.log.error(providerErr);
          const { statusCode, message } = toClientError(
            providerErr,
            "Transcription provider unavailable",
          );
          return reply.status(statusCode).send({ error: message });
        }
        if (!text) {
          return reply.send({ text: "", persisted: false });
        }

        let segment: TranscriptSegmentRow | undefined;
        if (parsed.data.sessionId) {
          segment = await dependencies.persistTranscriptSegment({
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
