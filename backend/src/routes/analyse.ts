import type { FastifyError, FastifyInstance } from "fastify";
import type { CoachingResponse } from "@foreman/shared";
import { z } from "zod";
import { isRateLimitError, toClientError } from "../api-error.js";
import { analyseImage, decodeImagePayload } from "../analyse.js";
import { isAnalysisConfigured } from "../config.js";
import { persistFrame } from "../db/persist-frame.js";
import { assertActiveSession } from "../db/sessions.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getRecentSessionTranscript } from "../db/transcript.js";
import type { SessionContext } from "../prompts/analysis.js";
import { requireSessionToken } from "../require-session-token.js";
import { validateImageBytes } from "../validate-media.js";

const ANALYSE_BODY_LIMIT_BYTES = 8 * 1024 * 1024;
// Route-local fallback until shared body-size limits are centralized in config.ts.
const ANALYSE_RAW_IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;

const analyseRequestSchema = z.object({
  image: z.string().min(1).max(20_000_000),
  sessionId: z.string().uuid().optional(),
  recentTranscript: z.array(z.string().max(2000)).max(20).optional(),
  context: z
    .object({
      jobType: z.string().max(200).optional(),
      worker: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
    })
    .optional(),
});

interface AnalyseRouteDependencies {
  isAnalysisConfigured: typeof isAnalysisConfigured;
  decodeImagePayload: typeof decodeImagePayload;
  validateImageBytes: typeof validateImageBytes;
  requireSessionToken: typeof requireSessionToken;
  isSupabaseConfigured: typeof isSupabaseConfigured;
  assertActiveSession: typeof assertActiveSession;
  getRecentSessionTranscript: typeof getRecentSessionTranscript;
  analyseImage: typeof analyseImage;
  persistFrame: typeof persistFrame;
}

const defaultDependencies: AnalyseRouteDependencies = {
  isAnalysisConfigured,
  decodeImagePayload,
  validateImageBytes,
  requireSessionToken,
  isSupabaseConfigured,
  assertActiveSession,
  getRecentSessionTranscript,
  analyseImage,
  persistFrame,
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

export async function registerAnalyseRoutes(
  app: FastifyInstance,
  dependencies: AnalyseRouteDependencies = defaultDependencies,
): Promise<void> {
  app.post(
    "/analyse",
    {
      config: {
        // The web client's adaptive capture loop fires a frame as soon as the
        // previous analyse returns, throttled to one every 2.8s (~21/min peak),
        // so a 20/min cap would 429 a fast session. 30/min keeps headroom.
        rateLimit: { max: 30, timeWindow: "1 minute" },
      },
      bodyLimit: ANALYSE_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > ANALYSE_BODY_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        return undefined;
      },
      errorHandler: (error, request, reply) => {
        if (isRateLimitError(error)) {
          throw error;
        }
        if (isPayloadTooLargeError(error)) {
          return reply.status(413).send({ error: "Payload too large" });
        }
        if (isMalformedJsonError(error)) {
          return reply.status(400).send({ error: "Malformed JSON body" });
        }
        request.log.error(error);
        return reply.status(500).send({ error: "Analysis request failed" });
      },
    },
    async (request, reply) => {
      if (!dependencies.isAnalysisConfigured()) {
        return reply.status(503).send({
          error: "ANTHROPIC_API_KEY is not set for vision coaching",
        });
      }

      const parsed = analyseRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        const { base64, mediaType: declaredType } = dependencies.decodeImagePayload(
          parsed.data.image,
        );
        const imageBytes = Buffer.from(base64, "base64");
        if (imageBytes.length > ANALYSE_RAW_IMAGE_LIMIT_BYTES) {
          return reply.status(413).send({ error: "Image payload too large" });
        }
        const { mediaType } = dependencies.validateImageBytes(imageBytes, declaredType);

        let context: SessionContext | undefined = parsed.data.context;
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

          const session = await dependencies.assertActiveSession(parsed.data.sessionId);
          const clientTranscript = parsed.data.recentTranscript ?? [];
          let recentTranscript: string[];

          if (clientTranscript.length > 0) {
            recentTranscript = clientTranscript.slice(-8);
          } else {
            const storedTranscript = await dependencies.getRecentSessionTranscript(
              parsed.data.sessionId,
            );
            recentTranscript = storedTranscript.slice(-8);
          }
          context = {
            jobType: session.job_type ?? context?.jobType,
            worker: session.worker ?? context?.worker,
            notes: session.notes ?? context?.notes,
            recentTranscript,
          };
        } else if (parsed.data.recentTranscript?.length) {
          context = {
            ...context,
            recentTranscript: parsed.data.recentTranscript,
          };
        }

        let coaching: CoachingResponse;
        try {
          coaching = await dependencies.analyseImage({
            base64,
            mediaType,
            context,
          });
        } catch (providerErr) {
          request.log.error(providerErr);
          const { statusCode, message } = toClientError(
            providerErr,
            "Analysis provider unavailable",
          );
          return reply.status(statusCode).send({ error: message });
        }

        if (parsed.data.sessionId) {
          const sessionId = parsed.data.sessionId;
          void dependencies
            .persistFrame({
              sessionId,
              base64,
              mediaType,
              coaching,
            })
            .then((persisted) => {
              request.log.info({ sessionId, frameId: persisted.frameId }, "frame persisted");
            })
            .catch((persistErr) => {
              request.log.error(persistErr, "frame persist failed");
            });
        }

        return reply.send({ coaching });
      } catch (err) {
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Analysis failed");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );
}
