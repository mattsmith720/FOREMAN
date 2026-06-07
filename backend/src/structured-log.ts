import type { FastifyReply, FastifyRequest } from "fastify";
import { recordOpsError } from "./ops-errors.js";

export const REQUEST_ID_HEADER = "x-request-id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface RequestLogContext {
  requestId: string;
  sessionId?: string;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Best-effort session id from route params, JSON body, or /sessions/:id URL. */
export function extractSessionId(request: FastifyRequest): string | undefined {
  const params = request.params as Record<string, unknown> | undefined;
  if (params) {
    for (const key of ["id", "sessionId"]) {
      const value = params[key];
      if (typeof value === "string" && isUuid(value)) {
        return value;
      }
    }
  }

  const body = request.body;
  if (body && typeof body === "object" && "sessionId" in body) {
    const sessionId = (body as { sessionId?: unknown }).sessionId;
    if (typeof sessionId === "string" && isUuid(sessionId)) {
      return sessionId;
    }
  }

  const match = request.url.match(/\/sessions\/([0-9a-f-]{36})/i);
  if (match?.[1] && isUuid(match[1])) {
    return match[1];
  }

  return undefined;
}

export function getRequestLogContext(request: FastifyRequest): RequestLogContext {
  const sessionId = extractSessionId(request);
  return sessionId
    ? { requestId: request.id, sessionId }
    : { requestId: request.id };
}

export function logHttpRequestStart(request: FastifyRequest): void {
  request.log.info(
    {
      ...getRequestLogContext(request),
      event: "http.request.start",
      method: request.method,
      url: request.url,
    },
    "request started",
  );
}

export function logHttpRequestComplete(
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const fields = {
    ...getRequestLogContext(request),
    event: "http.request.complete",
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    responseTimeMs: Math.round(reply.elapsedTime),
  };

  if (reply.statusCode >= 500) {
    request.log.error(fields, "request completed with server error");
    recordOpsError({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      sessionId: extractSessionId(request),
    });
    return;
  }

  request.log.info(fields, "request completed");
}
