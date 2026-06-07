import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import {
  buildEvidencePackZip,
  evidencePackFilename,
} from "../evidence-pack.js";
import {
  buildEvidenceReportPdf,
  evidenceReportFilename,
} from "../evidence-report.js";
import { requireSessionToken } from "../require-session-token.js";

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

export interface EvidencePackRouteDependencies {
  isSupabaseConfigured: typeof isSupabaseConfigured;
  requireSessionToken: typeof requireSessionToken;
  buildEvidencePackZip: typeof buildEvidencePackZip;
}

const defaultDependencies: EvidencePackRouteDependencies = {
  isSupabaseConfigured,
  requireSessionToken,
  buildEvidencePackZip,
};

export async function registerEvidencePackRoutes(
  app: FastifyInstance,
  dependencies: EvidencePackRouteDependencies = defaultDependencies,
): Promise<void> {
  app.get("/sessions/:id/evidence-pack", async (request, reply) => {
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
      const zip = await dependencies.buildEvidencePackZip(id);
      reply.header("content-type", "application/zip");
      reply.header(
        "content-disposition",
        `attachment; filename="${evidencePackFilename(id)}"`,
      );
      return reply.send(zip);
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to build evidence pack",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });

  app.get("/sessions/:id/evidence-report.pdf", async (request, reply) => {
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
      const pdf = await buildEvidenceReportPdf(id);
      reply.header("content-type", "application/pdf");
      reply.header(
        "content-disposition",
        `attachment; filename="${evidenceReportFilename(id)}"`,
      );
      return reply.send(Buffer.from(pdf));
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(
        err,
        "Failed to build evidence report",
      );
      return reply.status(statusCode).send({ error: message });
    }
  });
}
