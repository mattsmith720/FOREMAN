import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isAnalysisConfigured } from "../config.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  claimSessionEnd,
  createSession,
  getSession,
  getSessionCounts,
  updateSessionSummary,
} from "../db/sessions.js";
import { summariseSession } from "../summarise-session.js";

const startSessionSchema = z.object({
  worker: z.string().max(200).optional(),
  jobType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

const sessionIdSchema = z.object({
  id: z.string().uuid(),
});

function supabaseUnavailable(reply: {
  status: (code: number) => { send: (body: unknown) => unknown };
}) {
  return reply.status(503).send({
    error: "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
  });
}

export async function registerSessionRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post("/sessions/start", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const parsed = startSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }

    try {
      const session = await createSession(parsed.data);
      return reply.status(201).send({ session });
    } catch (err) {
      request.log.error(err);
      const detail = err instanceof Error ? err.message : "Failed to start session";
      const { statusCode, message } = toClientError(err, "Failed to start session");
      return reply.status(statusCode).send({ error: message, detail });
    }
  });

  app.post("/sessions/:id/stop", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    try {
      const existing = await getSession(id);
      if (existing.ended_at && existing.summary !== "Summarising job…") {
        const stored = await getSessionCounts(id);
        return reply.send({ session: existing, stored });
      }

      const claimed = await claimSessionEnd(id);
      if (!claimed) {
        const session = await getSession(id);
        const stored = await getSessionCounts(id);
        return reply.send({ session, stored });
      }

      if (!isAnalysisConfigured()) {
        const session = await updateSessionSummary(
          id,
          "Session ended. Summary unavailable — ANTHROPIC_API_KEY not set.",
        );
        const stored = await getSessionCounts(id);
        return reply.send({ session, stored });
      }

      const summary = await summariseSession(id);
      const session = await updateSessionSummary(id, summary);
      const stored = await getSessionCounts(id);

      return reply.send({ session, stored });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to stop session",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.get("/sessions/:id", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    try {
      const session = await getSession(id);
      const stored = await getSessionCounts(id);
      return reply.send({ session, stored });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to fetch session",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });
}
