const STAGES = [
  {
    id: "01",
    name: "ingest",
    detail: "Consent → start job → frames + audio stream to private store",
  },
  {
    id: "02",
    name: "analyse",
    detail: "Vision model flags technique gaps · speech → transcript",
  },
  {
    id: "03",
    name: "accumulate",
    detail: "Labels, coaching events, and session data export for your models",
  },
  {
    id: "04",
    name: "onboard",
    detail: "Auto-generated steps, safety notes, quiz, briefing script",
  },
] as const;

export function PipelineSection() {
  return (
    <section className="lp-pipeline" id="pipeline" aria-labelledby="pipeline-title">
      <div className="lp-wrap">
        <h2 id="pipeline-title" className="lp-section-label">
          data_pipeline
        </h2>
        <p className="lp-section-headline">Every visit compounds your dataset</p>
        <ol className="lp-pipeline-list">
          {STAGES.map((stage) => (
            <li key={stage.id} className="lp-pipeline-item">
              <span className="lp-pipeline-id">{stage.id}</span>
              <div>
                <h3>{stage.name}</h3>
                <p>{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
