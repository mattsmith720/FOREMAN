import { apiFetch } from "./api-fetch";
import { parseApiResponse } from "./parse-api-response";
import type { SessionRow } from "./sessions";

export interface ReviewItem {
  category: string;
  message: string;
  severity: "info" | "warning" | "critical";
  ts: string;
}

/** Top coaching events from a just-finished job, for the in-van review. */
export async function getSessionReview(sessionId: string): Promise<{
  session: SessionRow;
  items: ReviewItem[];
}> {
  const response = await apiFetch(`/sessions/${sessionId}/review`, {
    retry: { retries: 1 },
  });
  return parseApiResponse<{ session: SessionRow; items: ReviewItem[] }>(
    response,
  );
}

/** Confirm (human) or correct (corrected) a coaching item → a human-sourced label. */
export async function confirmLabel(input: {
  sessionId: string;
  key: string;
  value: string;
  correctedValue?: string;
}): Promise<void> {
  const response = await apiFetch("/labels/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    retry: { retries: 1, allowUnsafe: true },
  });
  await parseApiResponse<{ ok: boolean }>(response);
}

/** Save free-text job metadata (roof type, panel brand) to session.notes. */
export async function saveSessionNotes(
  sessionId: string,
  notes: string,
): Promise<void> {
  const response = await apiFetch(`/sessions/${sessionId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
    retry: { retries: 0 },
  });
  await parseApiResponse<{ session: unknown }>(response);
}
