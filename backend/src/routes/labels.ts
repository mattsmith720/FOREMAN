import type { FastifyError, FastifyInstance } from "fastify";
import { z } from "zod";
import { toClientError } from "../api-error.js";
import { isSupabaseConfigured } from "../db/supabase.js";
import { getSupabase } from "../db/supabase.js";
import { requireSessionToken } from "../require-session-token.js";

const LABEL_BODY_LIMIT_BYTES = 2 * 1024 * 1024;
// Route-local fallback until shared body-size limits are centralized in config.ts.
const LABEL_VALUE_LIMIT_BYTES = 32 * 1024;

const confirmLabelSchema = z.object({
  sessionId: z.string().uuid(),
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(2000),
  frameId: z.string().uuid().optional(),
  correctedValue: z.string().max(2000).optional(),
});

interface LabelRouteDependencies {
  isSupabaseConfigured: typeof isSupabaseConfigured;
  getSupabase: typeof getSupabase;
  requireSessionToken: typeof requireSessionToken;
}

const defaultDependencies: LabelRouteDependencies = {
  isSupabaseConfigured,
  getSupabase,
  requireSessionToken,
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

export async function registerLabelRoutes(
  app: FastifyInstance,
  dependencies: LabelRouteDependencies = defaultDependencies,
): Promise<void> {
  app.post(
    "/labels/confirm",
    {
      bodyLimit: LABEL_BODY_LIMIT_BYTES,
      preValidation: async (request, reply) => {
        const headerLength = contentLength(request);
        if (headerLength !== null && headerLength > LABEL_BODY_LIMIT_BYTES) {
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
        return reply.status(500).send({ error: "Label request failed" });
      },
    },
    async (request, reply) => {
      if (!dependencies.isSupabaseConfigured()) {
        return reply.status(503).send({
          error: "Supabase is not configured for label storage",
        });
      }

      const parsed = confirmLabelSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid request" });
      }

      const { sessionId, key, value, frameId, correctedValue } = parsed.data;
      const finalValue = correctedValue ?? value;
      if (Buffer.byteLength(finalValue, "utf8") > LABEL_VALUE_LIMIT_BYTES) {
        return reply.status(413).send({ error: "Label payload too large" });
      }

      if (!dependencies.requireSessionToken(request, reply, sessionId)) {
        return;
      }

      try {
        const supabase = dependencies.getSupabase();
        const labelSource = correctedValue ? "corrected" : "human";
        const storedValue = finalValue;

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
    },
  );
}
