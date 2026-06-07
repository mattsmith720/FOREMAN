import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { createLead } from "../db/leads.js";
import { isSupabaseConfigured } from "../db/supabase.js";

const leadSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  crewSize: z.string().min(1).max(100),
  email: z.string().email().max(320),
  phone: z.string().max(40).optional().nullable(),
  source: z.string().max(50).optional(),
});

export async function registerLeadsRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/leads",
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      if (!isSupabaseConfigured()) {
        return reply.status(503).send({ error: "Storage is not configured" });
      }

      const parsed = leadSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid lead payload" });
      }

      try {
        const lead = await createLead(parsed.data);
        return reply.status(201).send({ ok: true, id: lead.id });
      } catch (err) {
        if (err instanceof Error && err.message === "LEADS_TABLE_NOT_MIGRATED") {
          return reply.status(503).send({
            error:
              "Lead storage is not migrated yet. Apply backend/supabase/leads.sql.",
          });
        }
        request.log.error(err);
        const { statusCode, message } = toClientError(err, "Failed to save lead");
        return reply.status(statusCode).send({ error: message });
      }
    },
  );
}
