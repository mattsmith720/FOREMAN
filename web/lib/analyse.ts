import {
  coachingResponseSchema,
  type CoachingResponse,
} from "@foreman/shared";
import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";
import { withRetry } from "./retry";

export interface AnalyseContext {
  jobType?: string;
  worker?: string;
  notes?: string;
}

export interface AnalyseResult {
  coaching: CoachingResponse;
}

// The backend persists frames asynchronously (fire-and-forget) and the /analyse
// response carries coaching only — persistence is confirmed at job end via the
// stored session counts, not per frame.
interface AnalyseSuccess {
  coaching: CoachingResponse;
}

interface AnalyseError {
  error: string;
}

// Hard cap across all attempts so a stalled analyse can't freeze the capture
// loop on weak 4G. Each attempt gets a fresh AbortController bounded by
// whatever budget remains inside this total window.
const ANALYSE_TOTAL_TIMEOUT_MS = 12000;
const ANALYSE_RETRIES = 1;

export interface CaptureMeta {
  capturedAt: string;
  lat?: number;
  lng?: number;
  complianceShotId?: string;
}

function isRetryableAnalyseError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }
  return true;
}

export async function analyseFrame(
  image: string,
  options?: {
    context?: AnalyseContext;
    sessionId?: string;
    recentTranscript?: string[];
    captureMeta?: CaptureMeta;
  },
): Promise<AnalyseResult> {
  const deadline = Date.now() + ANALYSE_TOTAL_TIMEOUT_MS;

  const response = await withRetry(
    async () => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        throw new DOMException("Analysis timed out", "AbortError");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), remaining);
      try {
        return await apiFetch("/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            context: options?.context,
            sessionId: options?.sessionId,
            recentTranscript: options?.recentTranscript,
            captureMeta: options?.captureMeta,
          }),
          signal: controller.signal,
          // Retries are orchestrated here with per-attempt abort signals.
          retry: { retries: 0 },
        });
      } finally {
        clearTimeout(timeout);
      }
    },
    {
      retries: ANALYSE_RETRIES,
      deadline,
      shouldRetryResult: (result) => result.status >= 500,
      shouldRetryError: (error) => isRetryableAnalyseError(error),
    },
  );

  const body = await parseApiResponse<AnalyseSuccess | AnalyseError>(response);

  if (!("coaching" in body)) {
    throw new Error("Analysis response was missing coaching data");
  }

  return {
    coaching: coachingResponseSchema.parse(body.coaching),
  };
}
