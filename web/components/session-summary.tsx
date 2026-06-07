import type { ReactNode } from "react";
import type { SessionCounts, SessionRow } from "../lib/sessions";

interface SessionSummaryProps {
  session: SessionRow;
  stored: SessionCounts;
  onStartNew?: () => void;
  children?: ReactNode;
}

export function SessionSummary({
  session,
  stored,
  onStartNew,
  children,
}: SessionSummaryProps) {
  const summaryFailed =
    session.summary?.startsWith("Summarising job") ?? false;
  const noFrames = stored.frames === 0;

  return (
    <section className="summary-panel">
      <h2>{summaryFailed || noFrames ? "Job ended" : "Job complete"}</h2>
      {noFrames ? (
        <p className="summary-text summary-empty">
          No frames were analysed during this session.
        </p>
      ) : (
        <p className="summary-text">
          {session.summary ?? "No summary generated."}
        </p>
      )}
      <div className="stored-counts">
        {!noFrames && (
          <p className="summary-value">
            This job is logged — {stored.frames} moments captured and{" "}
            {stored.coaching_events} coaching calls. Every job makes Foreman
            sharper for your crew.
          </p>
        )}
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
      {children}

      {onStartNew && (
        <button type="button" className="button button-primary summary-new-job" onClick={onStartNew}>
          Start new job
        </button>
      )}
    </section>
  );
}
