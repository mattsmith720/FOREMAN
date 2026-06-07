import crypto from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { toClientError } from "../api-error.js";
import { getAnalyseCostUsd, getTranscribeCostUsd } from "../config.js";
import { getLatencyMetrics } from "../metrics.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  getDatasetStats,
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
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  try {
    return crypto.timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

function opsAuthorized(request: FastifyRequest): boolean {
  const expected = process.env.OPS_PASSWORD?.trim();
  if (!expected) {
    // Fail CLOSED in production: the Vercel proxy auto-injects FOREMAN_API_KEY,
    // so the API key is not a real gate for /ops. Require OPS_PASSWORD in prod.
    return process.env.NODE_ENV !== "production";
  }
  const provided = request.headers["x-ops-password"];
  const value = Array.isArray(provided) ? provided[0] : provided;
  return typeof value === "string" && safeEqual(value, expected);
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
      const analyseCost = getAnalyseCostUsd();
      const transcribeCost = getTranscribeCostUsd();
      const sessions = rows.map((session) => {
        const estCost =
          session.frame_count * analyseCost +
          session.transcript_count * transcribeCost;
        return {
          id: session.id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          worker: session.worker,
          job_type: session.job_type,
          consent_at: session.consent_at ?? null,
          frame_count: session.frame_count,
          transcript_count: session.transcript_count,
          est_cost_usd: Math.round(estCost * 1000) / 1000,
          summary_snippet: session.summary ? session.summary.slice(0, 140) : null,
          stuck: needsSummaryRetry(session),
        };
      });
      const totals = sessions.reduce(
        (acc, s) => ({
          frames: acc.frames + s.frame_count,
          transcripts: acc.transcripts + s.transcript_count,
          est_cost_usd: acc.est_cost_usd + s.est_cost_usd,
        }),
        { frames: 0, transcripts: 0, est_cost_usd: 0 },
      );
      totals.est_cost_usd = Math.round(totals.est_cost_usd * 100) / 100;
      const dataset = await getDatasetStats();
      return reply.send({
        sessions,
        totals,
        dataset,
        latency: getLatencyMetrics(),
        costModel: { analyse_usd: analyseCost, transcribe_usd: transcribeCost },
      });
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
