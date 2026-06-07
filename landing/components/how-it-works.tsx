const STEPS = [
  { title: "Record", body: "Run Foreman on the phone during the visit." },
  { title: "Coach", body: "Live technique and safety cues on site." },
  { title: "Train", body: "Generate an onboarding module when the job ends." },
] as const;

export default function HowItWorks() {
  return (
    <section
      className="lp-section lp-section--compact"
      id="how-it-works"
      aria-labelledby="hiw-title"
    >
      <div className="lp-wrap">
        <h2 id="hiw-title" className="lp-section-title lp-section-title--compact">
          How it works
        </h2>
        <ol className="lp-hiw-steps lp-hiw-steps--compact">
          {STEPS.map((step, index) => (
            <li key={step.title} className="lp-hiw-step-compact">
              <span className="lp-hiw-num-compact">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
