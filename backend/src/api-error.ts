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
    if (err.message.includes("Supabase") || err.message.includes("Failed to")) {
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
