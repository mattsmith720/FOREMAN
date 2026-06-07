export const REQUEST_ID_HEADER = "x-request-id";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface StructuredLogEntry {
  ts: string;
  level: LogLevel;
  msg: string;
  requestId?: string;
  sessionId?: string;
  event?: string;
  [key: string]: unknown;
}

export interface LogContext {
  requestId?: string;
  sessionId?: string;
}

export function withLogContext(
  ctx: LogContext,
  fields?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(ctx.requestId ? { requestId: ctx.requestId } : {}),
    ...(ctx.sessionId ? { sessionId: ctx.sessionId } : {}),
    ...fields,
  };
}

export function getRequestIdFromResponse(response: Response): string | undefined {
  return response.headers.get(REQUEST_ID_HEADER) ?? undefined;
}

export function structuredLog(
  level: LogLevel,
  msg: string,
  fields?: Record<string, unknown>,
): void {
  const entry: StructuredLogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...fields,
  };
  const line = JSON.stringify(entry);

  if (level === "error" || level === "warn") {
    console.error(line);
    return;
  }

  console.log(line);
}
