import type { FastifyReply, FastifyRequest } from "fastify";
import {
  SESSION_TOKEN_HEADER,
  verifySessionToken,
} from "./session-token.js";

export function getSessionTokenFromRequest(
  request: FastifyRequest,
): string | undefined {
  const header = request.headers[SESSION_TOKEN_HEADER];
  return Array.isArray(header) ? header[0] : header;
}

export function requireSessionToken(
  request: FastifyRequest,
  reply: FastifyReply,
  sessionId: string,
): boolean {
  const token = getSessionTokenFromRequest(request);
  if (!verifySessionToken(sessionId, token)) {
    void reply.status(403).send({ error: "Invalid session token" });
    return false;
  }
  return true;
}
