import type { FastifyInstance, FastifyRequest } from "fastify";
import { toClientError } from "../api-error.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  getSessionExportRecords,
  listRecentSessions,
  listSiteVideoQueue,
} from "../db/ops.js";
import { needsSummaryRetry } from "../stuck-summary.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Internal ops gate. The Vercel proxy already injects FOREMAN_API_KEY (enforced
 * by the global auth hook); OPS_PASSWORD is an optional second factor. If unset,
 * /ops relies on the API key alone.
 */
function opsAuthorized(request: FastifyRequest): boolean {
  const expected = process.env.OPS_PASSWORD?.trim();
  if (!expected) {
    return true;
  }
  const provided = request.headers["x-ops-password"];
  const value = Array.isArray(provided) ? provided[0] : provided;
  return value === expected;
}

export async function registerOpsRoutes(app: FastifyInstance): Promise<void> {
  app.get("/ops/sessions", async (request, reply) => {
    if (!opsAuthorized(request)) {
      return reply.status(401).send({ error: "Ops password required" });
    }
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }
    try {
      const rows = await listRecentSessions(20);
      const sessions = rows.map((session) => ({
        id: session.id,
        started_at: session.started_at,
        ended_at: session.ended_at,
        worker: session.worker,
        job_type: session.job_type,
        consent_at: session.consent_at ?? null,
        frame_count: session.frame_count,
        summary_snippet: session.summary ? session.summary.slice(0, 140) : null,
        stuck: needsSummaryRetry(session),
      }));
      return reply.send({ sessions });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to list sessions",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.get("/ops/ingest", async (request, reply) => {
    if (!opsAuthorized(request)) {
      return reply.status(401).send({ error: "Ops password required" });
    }
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }
    try {
      const videos = await listSiteVideoQueue(20);
      return reply.send({ videos });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to list ingest queue",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.get("/ops/sessions/:id/export", async (request, reply) => {
    if (!opsAuthorized(request)) {
      return reply.status(401).send({ error: "Ops password required" });
    }
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({ error: "Supabase is not configured" });
    }
    const id = (request.params as { id?: string }).id ?? "";
    if (!UUID_RE.test(id)) {
      return reply.status(400).send({ error: "Invalid session id" });
    }
    try {
      const records = await getSessionExportRecords(id);
      const ndjson = records.map((record) => JSON.stringify(record)).join("\n");
      reply.header("content-type", "application/x-ndjson");
      reply.header(
        "content-disposition",
        `attachment; filename="session-${id}.jsonl"`,
      );
      return reply.send(ndjson);
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Failed to export session");
      return reply.status(statusCode).send({ error: message });
    }
  });
}
