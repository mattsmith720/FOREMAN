import type { CoachingResponse } from "@foreman/shared";

interface CoachingOverlayProps {
  coaching: CoachingResponse | null;
}

function severityClass(severity: string): string {
  if (severity === "critical") return "severity-critical";
  if (severity === "warning") return "severity-warning";
  return "severity-info";
}

export function CoachingOverlay({ coaching }: CoachingOverlayProps) {
  if (!coaching) {
    return (
      <section className="coaching-panel">
        <p className="coaching-empty">
          Coaching will appear here after the first frame is analysed.
        </p>
      </section>
    );
  }

  return (
    <section className="coaching-panel">
      {coaching.observations.length > 0 && (
        <div className="coaching-block">
          <h2>Observations</h2>
          <ul>
            {coaching.observations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {coaching.installQualityFlags.length > 0 && (
        <div className="coaching-block">
          <h2>Install quality</h2>
          <ul className="flag-list">
            {coaching.installQualityFlags.map((flag) => (
              <li key={flag.message} className={severityClass(flag.severity)}>
                {flag.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {coaching.salesPitchFeedback.length > 0 && (
        <div className="coaching-block">
          <h2>Sales pitch</h2>
          <ul className="flag-list">
            {coaching.salesPitchFeedback.map((item) => (
              <li key={item.message} className={severityClass(item.severity)}>
                {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {coaching.timeOnTaskNote && (
        <div className="coaching-block">
          <h2>Time on task</h2>
          <p>{coaching.timeOnTaskNote}</p>
        </div>
      )}

      {coaching.nextSteps.length > 0 && (
        <div className="coaching-block">
          <h2>Next steps</h2>
          <ul>
            {coaching.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
