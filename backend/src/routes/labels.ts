import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getSupabase } from "../db/supabase.js";
import { requireSessionToken } from "../require-session-token.js";

const confirmLabelSchema = z.object({
  sessionId: z.string().uuid(),
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(2000),
  frameId: z.string().uuid().optional(),
  correctedValue: z.string().max(2000).optional(),
});

export async function registerLabelRoutes(app: FastifyInstance): Promise<void> {
  app.post("/labels/confirm", async (request, reply) => {
    if (!isSupabaseConfigured()) {
      return reply.status(503).send({
        error: "Supabase is not configured for label storage",
      });
    }

    const parsed = confirmLabelSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Invalid request" });
    }

    const { sessionId, key, value, frameId, correctedValue } = parsed.data;

    if (!requireSessionToken(request, reply, sessionId)) {
      return;
    }

    try {
      const supabase = getSupabase();
      const labelSource = correctedValue ? "corrected" : "human";
      const storedValue = correctedValue ?? value;

      const insert = await supabase.from("labels").insert({
        session_id: sessionId,
        key,
        value: storedValue,
        label_source: labelSource,
        frame_id: frameId ?? null,
        confirmed_at: new Date().toISOString(),
      });

      if (insert.error) {
        throw new Error(insert.error.message);
      }

      return reply.status(201).send({
        ok: true,
        labelSource,
        key,
        value: storedValue,
      });
    } catch (err) {
      request.log.error(err);
      const { statusCode, message } = toClientError(err, "Failed to confirm label");
      return reply.status(statusCode).send({ error: message });
    }
  });
}
