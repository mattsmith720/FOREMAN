import type { SessionCounts, SessionRow } from "../lib/sessions";

interface SessionSummaryProps {
  session: SessionRow;
  stored: SessionCounts;
}

export function SessionSummary({ session, stored }: SessionSummaryProps) {
  return (
    <section className="summary-panel">
      <h2>Job summary</h2>
      <p className="summary-text">{session.summary}</p>
      <div className="stored-counts">
        <p>
          <strong>Stored in Supabase</strong>
        </p>
        <ul>
          <li>{stored.frames} frames</li>
          <li>{stored.coaching_events} coaching events</li>
          <li>{stored.labels} labels</li>
          <li>{stored.transcript_segments} transcript segments</li>
        </ul>
        <p className="session-id">Session {session.id}</p>
      </div>
    </section>
  );
}
