import type { SessionCounts, SessionRow } from "../lib/sessions";

interface SessionSummaryProps {
  session: SessionRow;
  stored: SessionCounts;
  onStartNew?: () => void;
}

export function SessionSummary({
  session,
  stored,
  onStartNew,
}: SessionSummaryProps) {
  const summaryFailed =
    session.summary?.startsWith("Summarising job") ?? false;

  return (
    <section className="summary-panel">
      <h2>{summaryFailed ? "Job ended" : "Job complete"}</h2>
      <p className="summary-text">{session.summary ?? "No summary generated."}</p>
      <div className="stored-counts">
        <p>
          <strong>Saved to this job</strong>
        </p>
        <ul>
          <li>{stored.frames} frames</li>
          <li>{stored.coaching_events} coaching events</li>
          <li>{stored.labels} labels</li>
          <li>{stored.transcript_segments} transcript segments</li>
        </ul>
        <p className="session-id">Session {session.id.slice(0, 8)}</p>
      </div>
      {onStartNew && (
        <button type="button" className="button button-primary summary-new-job" onClick={onStartNew}>
          Start new job
        </button>
      )}
    </section>
  );
}
