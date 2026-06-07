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
  const noFrames = stored.frames === 0;

  return (
    <section className="summary-panel summary-panel--simple">
      <h2>{summaryFailed || noFrames ? "Job ended" : "Job complete"}</h2>
      {noFrames ? (
        <p className="summary-text summary-empty">
          No footage was captured this time.
        </p>
      ) : (
        <p className="summary-text">
          {session.summary ?? "Summary will appear here when ready."}
        </p>
      )}

      {onStartNew && (
        <button
          type="button"
          className="button button-primary summary-new-job"
          onClick={onStartNew}
        >
          Start new job
        </button>
      )}
    </section>
  );
}
