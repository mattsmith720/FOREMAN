import type { FastifyError, FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isAnalysisConfigured } from "../config.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  claimSessionEnd,
  createSession,
  getSession,
  getSessionCoachingEvents,
  getSessionCounts,
  type SessionRow,
  updateSessionNotes,
  updateSessionSummary,
} from "../db/sessions.js";
import { requireSessionToken } from "../require-session-token.js";
import { signSessionToken } from "../session-token.js";
import { summariseSession } from "../summarise-session.js";

import { needsSummaryRetry } from "../stuck-summary.js";

const SESSION_START_BODY_LIMIT_BYTES = 2 * 1024 * 1024;
// Route-local fallback until shared body-size limits are centralized in config.ts.
const SESSION_NOTES_LIMIT_BYTES = 64 * 1024;

const startSessionSchema = z.object({
  worker: z.string().max(200).optional(),
  jobType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  consentAt: z.string().datetime().optional(),
  accreditationNumber: z.string().max(50).optional(),
  orgId: z.string().uuid().optional(),
  crewId: z.string().uuid().optional(),
  installerId: z.string().uuid().optional(),
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

interface SessionRouteDependencies {
  isSupabaseConfigured: typeof isSupabaseConfigured;
  createSession: typeof createSession;
  signSessionToken: typeof signSessionToken;
  requireSessionToken: typeof requireSessionToken;
  getSession: typeof getSession;
  getSessionCounts: typeof getSessionCounts;
  claimSessionEnd: typeof claimSessionEnd;
  needsSummaryRetry: typeof needsSummaryRetry;
  completeSessionSummary: (sessionId: string) => Promise<SessionRow>;
}

const defaultDependencies: SessionRouteDependencies = {
  isSupabaseConfigured,
  createSession,
  signSessionToken,
  requireSessionToken,
  getSession,
  getSessionCounts,
  claimSessionEnd,
  needsSummaryRetry,
  completeSessionSummary,
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

export async function registerSessionRoutes(
  app: FastifyInstance,
  dependencies: SessionRouteDependencies = defaultDependencies,
): Promise<void> {
  app.post(
    "/sessions/start",
    {
      bodyLimit: SESSION_START_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > SESSION_START_BODY_LIMIT_BYTES) {
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
        return reply.status(500).send({ error: "Session request failed" });
      },
    },
    async (request, reply) => {
      if (!dependencies.isSupabaseConfigured()) {
        return supabaseUnavailable(reply);
      }

      const parsed = startSessionSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      if (
        parsed.data.notes &&
        Buffer.byteLength(parsed.data.notes, "utf8") > SESSION_NOTES_LIMIT_BYTES
      ) {
        return reply.status(413).send({ error: "Session notes payload too large" });
      }

      try {
        let session: SessionRow;
        try {
          session = await dependencies.createSession(parsed.data);
        } catch (providerErr) {
          request.log.error(providerErr);
          const { statusCode, message } = toClientError(
            providerErr,
            "Session storage unavailable",
          );
          return reply.status(statusCode).send({ error: message });
        }
        const token = dependencies.signSessionToken(session.id);
        return reply.status(201).send({ session, token });
      } catch (err) {
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Failed to start session");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );

  app.post("/sessions/:id/stop", async (request, reply) => {
    if (!dependencies.isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    if (!dependencies.requireSessionToken(request, reply, id)) {
      return;
    }

    try {
      const existing = await dependencies.getSession(id);

      if (existing.ended_at && !dependencies.needsSummaryRetry(existing)) {
        const stored = await dependencies.getSessionCounts(id);
        return reply.send({ session: existing, stored });
      }

      if (dependencies.needsSummaryRetry(existing)) {
        const session = await dependencies.completeSessionSummary(id);
        const stored = await dependencies.getSessionCounts(id);
        return reply.send({ session, stored });
      }

      const claimed = await dependencies.claimSessionEnd(id);
      if (!claimed) {
        const session = await dependencies.getSession(id);
        if (dependencies.needsSummaryRetry(session)) {
          const updated = await dependencies.completeSessionSummary(id);
          const stored = await dependencies.getSessionCounts(id);
          return reply.send({ session: updated, stored });
        }
        const stored = await dependencies.getSessionCounts(id);
        return reply.send({ session, stored });
      }

      const session = await dependencies.completeSessionSummary(id);
      const stored = await dependencies.getSessionCounts(id);
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
    if (!dependencies.isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    if (!dependencies.requireSessionToken(request, reply, id)) {
      return;
    }

    try {
      const session = await dependencies.getSession(id);
      const stored = await dependencies.getSessionCounts(id);
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

  app.get("/sessions/:id/review", async (request, reply) => {
    if (!dependencies.isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }

    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }

    const { id } = params.data;

    if (!dependencies.requireSessionToken(request, reply, id)) {
      return;
    }

    try {
      const session = await dependencies.getSession(id);
      const events = await getSessionCoachingEvents(id);
      const severityRank: Record<string, number> = {
        critical: 0,
        warning: 1,
        info: 2,
      };
      // Surface the most actionable calls first; cap at 5 for the in-van review.
      const items = [...events]
        .sort(
          (a, b) =>
            (severityRank[a.severity] ?? 3) - (severityRank[b.severity] ?? 3),
        )
        .slice(0, 5);
      return reply.send({ session, items });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Failed to load review");
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.post("/sessions/:id/notes", async (request, reply) => {
    if (!dependencies.isSupabaseConfigured()) {
      return supabaseUnavailable(reply);
    }
    const params = sessionIdSchema.safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session id" });
    }
    const { id } = params.data;
    if (!dependencies.requireSessionToken(request, reply, id)) {
      return;
    }
    const body = z
      .object({ notes: z.string().max(2000) })
      .safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }
    try {
      const session = await updateSessionNotes(id, body.data.notes);
      return reply.send({ session });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Failed to save notes");
      return reply.status(statusCode).send({ error: message });
    }
  });
}
