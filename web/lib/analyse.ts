import {
  coachingResponseSchema,
  type CoachingResponse,
} from "@foreman/shared";
import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";

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

// Cap each analyse so a stalled request on a weak 4G link can't freeze the
// capture loop. On timeout we abort; the caller surfaces the frame as failed
// and immediately captures the next one.
const ANALYSE_TIMEOUT_MS = 8000;

export async function analyseFrame(
  image: string,
  options?: {
    context?: AnalyseContext;
    sessionId?: string;
    recentTranscript?: string[];
  },
): Promise<AnalyseResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSE_TIMEOUT_MS);
  try {
    const response = await apiFetch("/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        context: options?.context,
        sessionId: options?.sessionId,
        recentTranscript: options?.recentTranscript,
      }),
      signal: controller.signal,
      // One bounded retry on a transient 5xx so a brief backend blip doesn't
      // silently drop a frame; capped at 1 and bounded by ANALYSE_TIMEOUT_MS so
      // the capture loop stays responsive on weak links.
      retry: { retries: 1, allowUnsafe: true },
    });

    const body = await parseApiResponse<AnalyseSuccess | AnalyseError>(response);

    if (!("coaching" in body)) {
      throw new Error("Analysis response was missing coaching data");
    }

    return {
      coaching: coachingResponseSchema.parse(body.coaching),
    };
  } finally {
    clearTimeout(timeout);
  }
}
