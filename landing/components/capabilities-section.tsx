const CAPS = [
  {
    title: "Live coach",
    body: "Spoken cues on safety and technique during the job, one at a time.",
  },
  {
    title: "Private job library",
    body: "Frames, audio, transcripts, and labels stay in your account. Export when you need to.",
  },
  {
    title: "Maintenance job types",
    body: "Panel clean, pigeon proofing, thermal scan, exterior and commercial cleans.",
  },
  {
    title: "Training modules",
    body: "Steps, safety notes, and a briefing script generated from the visit recording.",
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
        <p className="lp-section-label">Features</p>
        <h2 id="caps-title" className="lp-section-headline">
          What Foreman does on site
        </h2>
        <ul className="lp-caps-grid">
          {CAPS.map((cap) => (
            <li key={cap.title} className="lp-cap-card">
              <h3>{cap.title}</h3>
              <p>{cap.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
