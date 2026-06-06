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
  persisted: boolean;
  persistError?: string;
}

interface AnalyseSuccess {
  coaching: CoachingResponse;
  persisted?: { frameId: string; storageRef: string };
  persistError?: string;
}

interface AnalyseError {
  error: string;
}

export async function analyseFrame(
  image: string,
  options?: {
    context?: AnalyseContext;
    sessionId?: string;
    recentTranscript?: string[];
  },
): Promise<AnalyseResult> {
  const response = await apiFetch("/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image,
      context: options?.context,
      sessionId: options?.sessionId,
      recentTranscript: options?.recentTranscript,
    }),
    retry: options?.sessionId
      ? { retries: 0 }
      : { retries: 1, allowUnsafe: true },
  });

  const body = await parseApiResponse<AnalyseSuccess | AnalyseError>(response);

  if (!("coaching" in body)) {
    throw new Error("Analysis response was missing coaching data");
  }

  return {
    coaching: coachingResponseSchema.parse(body.coaching),
    persisted: Boolean(body.persisted),
    persistError: body.persistError,
  };
}
