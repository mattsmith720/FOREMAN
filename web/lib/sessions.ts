import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";
import { clearSessionToken, setSessionToken } from "./session-auth";

export interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  worker: string | null;
  job_type: string | null;
  notes: string | null;
  summary: string | null;
}

export interface SessionCounts {
  frames: number;
  coaching_events: number;
  labels: number;
  transcript_segments: number;
}

export interface StartSessionInput {
  worker?: string;
  jobType?: string;
  notes?: string;
}

export async function startSession(
  input?: StartSessionInput,
): Promise<SessionRow> {
  const response = await apiFetch("/sessions/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });

  const body = await parseApiResponse<{
    session: SessionRow;
    token?: string;
  }>(response);
  if (body.token) {
    setSessionToken(body.token);
  }
  return body.session;
}

export async function stopSession(sessionId: string): Promise<{
  session: SessionRow;
  stored: SessionCounts;
}> {
  const response = await apiFetch(`/sessions/${sessionId}/stop`, {
    method: "POST",
  });

  const result = await parseApiResponse<{
    session: SessionRow;
    stored: SessionCounts;
  }>(response);
  clearSessionToken();
  return result;
}

export async function getSession(sessionId: string): Promise<{
  session: SessionRow;
  stored: SessionCounts;
}> {
  const response = await apiFetch(`/sessions/${sessionId}`);
  return parseApiResponse<{ session: SessionRow; stored: SessionCounts }>(
    response,
  );
}
