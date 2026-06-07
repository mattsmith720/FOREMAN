const CAPS = [
  {
    key: "live_coach",
    title: "Live coach",
    body: "One actionable cue per frame — safety and technique while the ladder is still up.",
  },
  {
    key: "private_store",
    title: "Private store",
    body: "Frames, audio, transcripts, and labels in your tenant. Export JSONL for fine-tunes.",
  },
  {
    key: "job_types",
    title: "Maintenance profiles",
    body: "Panel clean, pigeon proofing, thermal scan, exterior and commercial cleans.",
  },
  {
    key: "modules",
    title: "Training modules",
    body: "End-of-job onboarding packages from real visits — not generic slide decks.",
  },
] as const;

export function CapabilitiesSection() {
  return (
    <section
      className="lp-caps"
      id="capabilities"
      aria-labelledby="caps-title"
    >
      <div className="lp-wrap">
        <h2 id="caps-title" className="lp-section-label">
          capabilities
        </h2>
        <p className="lp-section-headline">Built for field ops, not slide decks</p>
        <ul className="lp-caps-grid">
          {CAPS.map((cap) => (
            <li key={cap.key} className="lp-cap-card">
              <p className="lp-cap-key">{cap.key}</p>
              <h3>{cap.title}</h3>
              <p>{cap.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
