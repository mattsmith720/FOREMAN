import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isApiKeyRequired } from "./config.js";

const API_KEY_HEADER = "x-foreman-api-key";

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

function isPublicPath(url: string): boolean {
  const path = url.split("?")[0];
  return (
    path === "/health" ||
    path === "/ready" ||
    path === "/ingest/drive-webhook" ||
    path === "/ingest/process-pending"
  );
}

export async function registerAuthHook(app: FastifyInstance): Promise<void> {
  app.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (isPublicPath(request.url)) {
      return;
    }

    const requiredKey = process.env.FOREMAN_API_KEY?.trim();
    if (!requiredKey) {
      if (process.env.NODE_ENV === "production") {
        return reply.status(503).send({ error: "API is not configured for production" });
      }
      return;
    }

    const provided = request.headers[API_KEY_HEADER];
    const key = Array.isArray(provided) ? provided[0] : provided;

    if (!key || !safeEqual(key, requiredKey)) {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });
}

export { API_KEY_HEADER, isApiKeyRequired };
