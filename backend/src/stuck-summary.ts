export const SUMMARISING_PLACEHOLDER = "Summarising job…";

export function needsSummaryRetry(session: {
  ended_at: string | null;
  summary: string | null;
}): boolean {
  return Boolean(
    session.ended_at && session.summary === SUMMARISING_PLACEHOLDER,
  );
}
