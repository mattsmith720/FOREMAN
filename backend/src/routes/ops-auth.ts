import crypto from "node:crypto";
import type { FastifyRequest } from "fastify";

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

/** Shared ops gate for routes outside registerOpsRoutes. */
export function opsAuthorized(request: FastifyRequest): boolean {
  const expected = process.env.OPS_PASSWORD?.trim();
  if (!expected) {
    return process.env.NODE_ENV !== "production";
  }
  const provided = request.headers["x-ops-password"];
  const value = Array.isArray(provided) ? provided[0] : provided;
  return typeof value === "string" && safeEqual(value, expected);
}
