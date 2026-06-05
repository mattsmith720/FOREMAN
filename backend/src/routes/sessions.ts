import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  createSession,
  finishSession,
  getSession,
  getSessionCounts,
} from "../db/sessions.js";
import { summariseSession } from "../summarise-session.js";

const startSessionSchema = z.object({
  worker: z.string().optional(),
  jobType: z.string().optional(),
  notes: z.string().optional(),
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
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    try {
      const session = await createSession(parsed.data);
      return reply.status(201).send({ session });
    } catch (err) {
      request.log.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to start session";
      return reply.status(500).send({ error: message });
    }
  });

  app.post("/sessions/:id/stop", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const { id } = request.params as { id: string };

    try {
      const existing = await getSession(id);
      if (existing.ended_at) {
        const stored = await getSessionCounts(id);
        return reply.send({ session: existing, stored });
      }

      const summary = await summariseSession(id);
      const session = await finishSession(id, summary);
      const stored = await getSessionCounts(id);

      return reply.send({ session, stored });
    } catch (err) {
      request.log.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to stop session";
      return reply.status(500).send({ error: message });
    }
  });

  app.get("/sessions/:id", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const { id } = request.params as { id: string };

    try {
      const session = await getSession(id);
      const stored = await getSessionCounts(id);
      return reply.send({ session, stored });
    } catch (err) {
      request.log.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch session";
      return reply.status(404).send({ error: message });
    }
  });
}
