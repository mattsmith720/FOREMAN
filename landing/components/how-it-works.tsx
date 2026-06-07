import { ScrollReveal } from "./scroll-reveal";

const STEPS = [
  {
    title: "Record",
    body: "Open Foreman on the crew phone, confirm consent, pick the job type (panel clean, pigeon proofing, thermal scan), and run the visit.",
    icon: "start",
  },
  {
    title: "Capture & coach",
    body: "Foreman logs frames and audio, coaches technique and safety in real time, and stores everything in your private training dataset.",
    icon: "capture",
  },
  {
    title: "Train",
    body: "Generate an onboarding module from any completed job: steps, safety notes, quiz, and briefing script · ready for the next hire.",
    icon: "pack",
  },
] as const;

type StepIconName = (typeof STEPS)[number]["icon"];

function StepIcon({ name }: { name: StepIconName }) {
  const common = {
    width: 32,
    height: 32,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "start") {
    return (
      <svg {...common}>
        <rect x="6" y="4" width="20" height="24" rx="3" />
        <path d="M11 9h10M11 14h10M11 19h6" />
        <circle cx="22" cy="22" r="5" fill="var(--accent-soft)" stroke="var(--accent)" />
        <path d="M20 22l1.5 1.5L24 20" stroke="var(--accent)" />
      </svg>
    );
  }

  if (name === "capture") {
    return (
      <svg {...common}>
        <path d="M8 10h4l2-3h8l2 3h2a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" />
        <circle cx="16" cy="18" r="5" />
        <path d="M14 18l1.5 1.5L18 16" stroke="var(--accent)" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 8h20v18H6z" />
      <path d="M10 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      <path d="M12 16h8M12 20h5" />
      <circle cx="22" cy="22" r="5" fill="var(--accent-soft)" stroke="var(--accent)" />
      <path d="M20.5 22l1 1 2.5-2.5" stroke="var(--accent)" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section
      className="lp-section lp-section--alt"
      id="how-it-works"
      aria-labelledby="hiw-title"
    >
      <div className="lp-wrap">
        <ScrollReveal>
          <h2 id="hiw-title" className="lp-section-title">
            How it works
          </h2>
          <p className="lp-section-lede">
            Three steps on every maintenance visit. Record on site · build your dataset ·
            onboard the next tech automatically.
          </p>
        </ScrollReveal>

        <ol className="lp-hiw-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <ScrollReveal>
                <div className="lp-hiw-step">
                  <div className="lp-hiw-icon" aria-hidden="true">
                    <StepIcon name={step.icon} />
                  </div>
                  <div className="lp-hiw-copy">
                    <p className="lp-hiw-num">
                      Step {index + 1}
                      <span className="lp-hiw-arrow" aria-hidden="true">
                        {index < STEPS.length - 1 ? "→" : ""}
                      </span>
                    </p>
                    <h3 className="lp-hiw-title">{step.title}</h3>
                    <p className="lp-hiw-body">{step.body}</p>
                  </div>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
