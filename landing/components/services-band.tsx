/** Maintenance services covered in the pilot. */

const SERVICES = [
  {
    title: "Panel clean",
    detail: "Scrub, rinse, Debris-Block, and before/after documentation on every array.",
  },
  {
    title: "Pigeon proofing",
    detail: "Nest removal, mesh continuity, repellent steps, and sign-off captures.",
  },
  {
    title: "Thermal scan",
    detail: "Hotspot protocol, inverter display, and report-ready evidence.",
  },
  {
    title: "Exterior clean",
    detail: "Gutters, skylights, soft wash, and property care on site.",
  },
  {
    title: "Commercial clean",
    detail: "Larger arrays, team coordination, and maintenance-contract records.",
  },
  {
    title: "Training export",
    detail: "Every visit feeds your dataset, model training, and auto onboarding modules.",
  },
] as const;

export function ServicesBand() {
  return (
    <section
      className="lp-cer-band"
      id="services"
      aria-labelledby="services-band-title"
    >
      <div className="lp-wrap lp-cer-inner">
        <header className="lp-cer-intro">
          <p className="lp-cer-kicker">Pilot scope</p>
          <h2 id="services-band-title" className="lp-cer-title">
            Maintenance jobs Foreman trains on
          </h2>
          <p className="lp-cer-lede">
            Built for daily maintenance work · panel cleans, pigeon proofing, thermal
            imaging, and maintenance plans. Each service gets its own coaching profile and
            training module output.
          </p>
        </header>

        <ol className="lp-cer-shots">
          {SERVICES.map((service, index) => (
            <li key={service.title} className="lp-cer-shot">
              <span className="lp-cer-shot-num" aria-hidden="true">
                {index + 1}
              </span>
              <div className="lp-cer-shot-copy">
                <h3 className="lp-cer-shot-title">{service.title}</h3>
                <p className="lp-cer-shot-desc">{service.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="lp-cer-disclaimer">
          Private pilot for field operations. Job recordings and training data stay in
          access-controlled systems · not shared publicly.
        </p>
      </div>
    </section>
  );
}
