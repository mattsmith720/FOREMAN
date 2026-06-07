import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isAnalysisConfigured } from "../config.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getSession } from "../db/sessions.js";
import { generateTrainingModule } from "../generate-training-module.js";
import { requireSessionToken } from "../require-session-token.js";
import { opsAuthorized } from "./ops-auth.js";

const sessionIdSchema = z.object({
  id: z.string().uuid(),
});

function supabaseUnavailable(reply: FastifyReply) {
  return reply.status(503).send({
    error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  });
}

async function handleTrainingModule(
  request: FastifyRequest,
  reply: FastifyReply,
  sessionId: string,
): Promise<unknown> {
  if (!isSupabaseConfigured()) {
    return supabaseUnavailable(reply);
  }

  if (!isAnalysisConfigured()) {
    return reply.status(503).send({
      error: "Training module generation requires ANTHROPIC_API_KEY.",
    });
  }

  try {
    await getSession(sessionId);
    const module = await generateTrainingModule(sessionId);
    return reply.send({ sessionId, module });
  } catch (err) {
    request.log.error(err);
    const { statusCode, message } = toClientError(
      err,
      "Failed to generate training module",
    );
    return reply.status(statusCode).send({ error: message });
  }
}

export async function registerTrainingModuleRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post("/sessions/:id/training-module", async (request, reply) => {
    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    if (!requireSessionToken(request, reply, id)) {
      return;
    }

    return handleTrainingModule(request, reply, id);
  });

  app.post("/ops/sessions/:id/training-module", async (request, reply) => {
    if (!opsAuthorized(request)) {
      return reply.status(401).send({ error: "Ops password required" });
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    return handleTrainingModule(request, reply, params.data.id);
  });
}
