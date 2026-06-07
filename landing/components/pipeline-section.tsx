const STAGES = [
  {
    id: "1",
    name: "Record the visit",
    detail: "Consent, start the job, and stream frames plus audio to your private store.",
  },
  {
    id: "2",
    name: "Coach on site",
    detail: "Foreman flags technique gaps and turns speech into a searchable transcript.",
  },
  {
    id: "3",
    name: "Build your dataset",
    detail: "Labels, coaching events, and session exports for your own model training.",
  },
  {
    id: "4",
    name: "Onboard new hires",
    detail: "Auto-generated steps, safety notes, quiz, and briefing script from real jobs.",
  },
] as const;

export function PipelineSection() {
  return (
    <section className="lp-pipeline" id="pipeline" aria-labelledby="pipeline-title">
      <div className="lp-wrap">
        <p className="lp-section-label">How it works</p>
        <h2 id="pipeline-title" className="lp-section-headline">
          What happens on each job
        </h2>
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
