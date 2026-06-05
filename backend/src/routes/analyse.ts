import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { analyseImage, decodeImagePayload } from "../analyse.js";
import { isAnalysisConfigured } from "../config.js";
import { persistFrame } from "../db/persist-frame.js";
import { assertActiveSession } from "../db/sessions.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getRecentSessionTranscript } from "../db/transcript.js";
import type { SessionContext } from "../prompts/analysis.js";
import { requireSessionToken } from "../require-session-token.js";
import { validateImageBytes } from "../validate-media.js";

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

export async function registerAnalyseRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/analyse",
    {
      config: {
        rateLimit: { max: 20, timeWindow: "1 minute" },
      },
    },
    async (request, reply) => {
      if (!isAnalysisConfigured()) {
        return reply.status(503).send({
          error: "ANTHROPIC_API_KEY is not set for vision coaching",
        });
      }

      const parsed = analyseRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      try {
        const { base64, mediaType: declaredType } = decodeImagePayload(
          parsed.data.image,
        );
        const imageBytes = Buffer.from(base64, "base64");
        const { mediaType } = validateImageBytes(imageBytes, declaredType);

        let context: SessionContext | undefined = parsed.data.context;
        if (parsed.data.sessionId) {
          if (!requireSessionToken(request, reply, parsed.data.sessionId)) {
            return;
          }

          if (!isSupabaseConfigured()) {
            return reply.status(503).send({
              error: "Supabase is not configured for session logging",
            });
          }

          const session = await assertActiveSession(parsed.data.sessionId);
          const storedTranscript = await getRecentSessionTranscript(
            parsed.data.sessionId,
          );
          const clientTranscript = parsed.data.recentTranscript ?? [];
          const recentTranscript = [
            ...storedTranscript,
            ...clientTranscript.filter(
              (line) => !storedTranscript.includes(line),
            ),
          ].slice(-8);
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

        const coaching = await analyseImage({
          base64,
          mediaType,
          context,
        });

        let persisted: { frameId: string; storageRef: string } | undefined;
        let persistError: string | undefined;

        if (parsed.data.sessionId) {
          try {
            persisted = await persistFrame({
              sessionId: parsed.data.sessionId,
              base64,
              mediaType,
              coaching,
            });
          } catch (persistErr) {
            request.log.error(persistErr);
            persistError = "Frame coaching was not saved to storage";
          }
        }

        return reply.send({ coaching, persisted, persistError });
      } catch (err) {
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Analysis failed");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );
}
