import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { analyseImage, decodeImagePayload } from "../analyse.js";
import { persistFrame } from "../db/persist-frame.js";
import { assertActiveSession } from "../db/sessions.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getRecentSessionTranscript } from "../db/transcript.js";
import type { SessionContext } from "../prompts/analysis.js";

const analyseRequestSchema = z.object({
  image: z.string().min(1),
  sessionId: z.string().uuid().optional(),
  recentTranscript: z.array(z.string()).optional(),
  context: z
    .object({
      jobType: z.string().optional(),
      worker: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export async function registerAnalyseRoutes(app: FastifyInstance): Promise<void> {
  app.post("/analyse", async (request, reply) => {
    const parsed = analyseRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    try {
      const { base64, mediaType } = decodeImagePayload(parsed.data.image);

      let context: SessionContext | undefined = parsed.data.context;
      if (parsed.data.sessionId) {
        if (!isSupabaseConfigured()) {
          return reply.status(503).send({
            error:
              "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
          });
        }

        const session = await assertActiveSession(parsed.data.sessionId);
        const storedTranscript = await getRecentSessionTranscript(
          parsed.data.sessionId,
        );
        const clientTranscript = parsed.data.recentTranscript ?? [];
        const recentTranscript = [
          ...storedTranscript,
          ...clientTranscript.filter((line) => !storedTranscript.includes(line)),
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
      if (parsed.data.sessionId) {
        persisted = await persistFrame({
          sessionId: parsed.data.sessionId,
          base64,
          mediaType,
          coaching,
        });
      }

      return reply.send({ coaching, persisted });
    } catch (err) {
      request.log.error(err);
      const message =
        err instanceof Error ? err.message : "Analysis failed";
      return reply.status(500).send({ error: message });
    }
  });
}
