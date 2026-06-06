import type { FastifyError } from "fastify";

export function isRateLimitError(error: FastifyError): boolean {
  return error.statusCode === 429 || error.code === "FST_ERR_RATE_LIMIT";
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly clientMessage?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function toClientError(err: unknown, fallback: string): {
  statusCode: number;
  message: string;
} {
  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode,
      message: err.clientMessage ?? err.message,
    };
  }

  if (err instanceof Error) {
    if (err.message === "Session not found") {
      return { statusCode: 404, message: err.message };
    }
    if (err.message === "Session has already ended") {
      return { statusCode: 409, message: err.message };
    }
    if (
      err.message.includes("ANTHROPIC_API_KEY") ||
      err.message.includes("OPENAI_API_KEY")
    ) {
      return { statusCode: 503, message: "AI service is not configured" };
    }
    if (err.message.includes("ElevenLabs")) {
      const statusMatch = err.message.match(/\((\d{3})\)/);
      const upstream = statusMatch ? Number(statusMatch[1]) : 502;
      const statusCode =
        upstream === 401 || upstream === 403
          ? 503
          : upstream >= 400 && upstream < 600
            ? upstream
            : 502;
      return {
        statusCode,
        message: "Voice synthesis unavailable — check ElevenLabs API key and voice ID on Render",
      };
    }
    if (
      err.message.includes("Supabase") ||
      (err.message.includes("Failed to") && !err.message.includes("ElevenLabs"))
    ) {
      return { statusCode: 503, message: "Storage service unavailable" };
    }
    if (err.message.includes("invalid input syntax for type uuid")) {
      return { statusCode: 400, message: "Invalid session id" };
    }
    if (
      err.message.includes("Unsupported audio type") ||
      err.message.includes("Unsupported image type")
    ) {
      return { statusCode: 400, message: err.message };
    }
  }

  return { statusCode: 500, message: fallback };
}
