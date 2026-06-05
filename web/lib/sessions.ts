import { getApiUrl } from "./api-url";

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

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }
  return body;
}

export async function startSession(
  input?: StartSessionInput,
): Promise<SessionRow> {
  const response = await fetch(`${getApiUrl()}/sessions/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });

  const body = await parseResponse<{ session: SessionRow }>(response);
  return body.session;
}

export async function stopSession(sessionId: string): Promise<{
  session: SessionRow;
  stored: SessionCounts;
}> {
  const response = await fetch(`${getApiUrl()}/sessions/${sessionId}/stop`, {
    method: "POST",
  });

  return parseResponse<{ session: SessionRow; stored: SessionCounts }>(
    response,
  );
}

export async function getSession(sessionId: string): Promise<{
  session: SessionRow;
  stored: SessionCounts;
}> {
  const response = await fetch(`${getApiUrl()}/sessions/${sessionId}`);
  return parseResponse<{ session: SessionRow; stored: SessionCounts }>(
    response,
  );
}
