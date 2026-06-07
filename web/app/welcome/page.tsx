import type { Metadata } from "next";
import Link from "next/link";
import { RoiCalculator } from "../../components/roi-calculator";

export const metadata: Metadata = {
  title: "Foreman — AI coach for solar install crews",
  description:
    "Hands-free live coaching for Australian solar installers — safety cues, CER compliance capture, and proof logged on every job.",
};

const STEPS = [
  {
    title: "Start on site",
    body: "Open Foreman on your phone, confirm consent, pick install or survey phase, and point the camera at the job.",
  },
  {
    title: "Work with live coaching",
    body: "AI watches the roof in real time — spoken safety and quality cues, pitch feedback when you're with a customer, and guided shots for compliance evidence.",
  },
  {
    title: "Close with proof",
    body: "Finish the session to get a job summary, six-shot evidence pack with geo stamp, and a logged record your crew lead can export.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="marketing-page">
      <header className="marketing-header">
        <p className="marketing-eyebrow">For solar install crews</p>
        <h1 className="marketing-title">
          An AI foreman on your shoulder — not another form at the end of the day.
        </h1>
        <p className="marketing-lead">
          Foreman watches the job through your phone camera while you work. It catches safety and
          quality issues on the spot, walks you through CER evidence capture, and logs proof of
          every install — so crews ship compliant jobs without slowing down.
        </p>
        <div className="marketing-cta-row">
          <Link href="/" className="marketing-cta">
            Open the app
          </Link>
          <p className="marketing-cta-note">Free to try on your phone — no account required for the pilot.</p>
        </div>
      </header>

      <section className="marketing-section" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="marketing-section-title">
          How it works
        </h2>
        <ol className="marketing-steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="marketing-step">
              <span className="marketing-step-num" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3 className="marketing-step-title">{step.title}</h3>
                <p className="marketing-step-body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="marketing-section" aria-labelledby="measured-trust">
        <h2 id="measured-trust" className="marketing-section-title">
          Measured, not marketed
        </h2>
        <p className="marketing-trust-intro">
          Claims below are from the Phase 0 trust audit — verified in CI and smoke tests, not
          slide-deck promises.
        </p>
        <ul className="marketing-metrics">
          <li className="marketing-metric">
            <span className="marketing-metric-value">11/11</span>
            <span className="marketing-metric-label">
              offline eval scenarios scored with committed CER goldens (97% rubric pass rate)
            </span>
          </li>
          <li className="marketing-metric">
            <span className="marketing-metric-value">6</span>
            <span className="marketing-metric-label">
              guided shots assembled into a geo-stamped evidence ZIP per install
            </span>
          </li>
        </ul>
      </section>

      <RoiCalculator />

      <footer className="marketing-footer">
        <p className="marketing-footer-copy">
          Built for Australian solar crews — live coaching, compliance capture, and job logging in
          one session.
        </p>
        <Link href="/" className="marketing-cta marketing-cta-secondary">
          Start job
        </Link>
      </footer>
    </div>
  );
}
