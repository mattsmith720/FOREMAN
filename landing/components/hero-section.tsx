import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { DEMO_URL } from "@/lib/config";

const SIGNALS = [
  { label: "capture", value: "phone + mic" },
  { label: "infer", value: "vision + speech" },
  { label: "output", value: "training module" },
] as const;

export function HeroSection() {
  return (
    <header className="lp-hero-v2">
      <div className="lp-wrap">
        <p className="lp-hero-v2-kicker">
          <span className="lp-hero-v2-dot" aria-hidden="true" />
          field_intelligence :: maintenance_crews
        </p>
        <h1>Job footage in. Trained crews out.</h1>
        <p className="lp-hero-v2-lede">
          Foreman runs on the phone during real visits — captures the job, coaches technique
          live, and ships onboarding modules built from your own footage.
        </p>

        <div className="lp-hero-v2-signals" aria-label="Pipeline">
          {SIGNALS.map((s, i) => (
            <div key={s.label} className="lp-hero-v2-signal">
              <span className="lp-hero-v2-signal-key">{s.label}</span>
              <span className="lp-hero-v2-signal-val">{s.value}</span>
              {i < SIGNALS.length - 1 && (
                <span className="lp-hero-v2-signal-arrow" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="lp-cta-row" id="book">
          <BookDemo />
          <a href={DEMO_URL} className="lp-btn lp-btn--secondary">
            view_demo()
          </a>
          <Link href="/pricing" className="lp-btn lp-btn--secondary">
            pricing
          </Link>
        </div>

        <pre className="lp-hero-v2-terminal" aria-label="Example coaching output">
          <code>
            {`> foreman.coach()\n`}
            {`  status: live\n`}
            {`  cue: "rinse lower row before moving ladder"\n`}
            {`  module: queued_on_job_end`}
          </code>
        </pre>
      </div>
    </header>
  );
}
