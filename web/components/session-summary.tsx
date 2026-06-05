import type { SessionCounts, SessionRow } from "../lib/sessions";

interface SessionSummaryProps {
  session: SessionRow;
  stored: SessionCounts;
}

export function SessionSummary({ session, stored }: SessionSummaryProps) {
  return (
    <section className="summary-panel jarvis-summary">
      <div className="jarvis-summary-header">
        <span className="jarvis-brand">JOB COMPLETE</span>
        <span className="jarvis-subbrand">SESSION ARCHIVED</span>
      </div>
      <h2>Neural summary</h2>
      <p className="summary-text">{session.summary}</p>
      <div className="stored-counts jarvis-summary-stats">
        <p>
          <strong>Training memory ingested</strong>
        </p>
        <ul>
          <li>{stored.frames} vision frames</li>
          <li>{stored.coaching_events} coaching events</li>
          <li>{stored.labels} training labels</li>
          <li>{stored.transcript_segments} audio segments</li>
        </ul>
        <p className="session-id">SID {session.id.slice(0, 8).toUpperCase()}</p>
      </div>
    </section>
  );
}
