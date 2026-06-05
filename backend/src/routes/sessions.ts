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
  type SessionRow,
  updateSessionSummary,
} from "../db/sessions.js";
import { requireSessionToken } from "../require-session-token.js";
import { signSessionToken } from "../session-token.js";
import { summariseSession } from "../summarise-session.js";

const SUMMARISING_PLACEHOLDER = "Summarising job…";

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

async function completeSessionSummary(sessionId: string): Promise<SessionRow> {
  if (!isAnalysisConfigured()) {
    return updateSessionSummary(
      sessionId,
      "Session ended. Summary unavailable — ANTHROPIC_API_KEY not set.",
    );
  }

  try {
    const summary = await summariseSession(sessionId);
    return updateSessionSummary(sessionId, summary);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "unknown error";
    return updateSessionSummary(
      sessionId,
      `Session ended. Summary could not be generated (${detail}).`,
    );
  }
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
      const token = signSessionToken(session.id);
      return reply.status(201).send({ session, token });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Failed to start session");
      return reply.status(statusCode).send({ error: message });
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

    if (!requireSessionToken(request, reply, id)) {
      return;
    }

    try {
      const existing = await getSession(id);

      if (existing.ended_at && existing.summary !== SUMMARISING_PLACEHOLDER) {
        const stored = await getSessionCounts(id);
        return reply.send({ session: existing, stored });
      }

      if (existing.ended_at && existing.summary === SUMMARISING_PLACEHOLDER) {
        const session = await completeSessionSummary(id);
        const stored = await getSessionCounts(id);
        return reply.send({ session, stored });
      }

      const claimed = await claimSessionEnd(id);
      if (!claimed) {
        const session = await getSession(id);
        if (session.summary === SUMMARISING_PLACEHOLDER) {
          const updated = await completeSessionSummary(id);
          const stored = await getSessionCounts(id);
          return reply.send({ session: updated, stored });
        }
        const stored = await getSessionCounts(id);
        return reply.send({ session, stored });
      }

      const session = await completeSessionSummary(id);
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

    if (!requireSessionToken(request, reply, id)) {
      return;
    }

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
