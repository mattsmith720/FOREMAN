import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { DEMO_URL } from "@/lib/config";
import { site } from "@/lib/site";

const STEPS = [
  { label: "Capture", value: "Phone or glasses on site" },
  { label: "Coach", value: "Live safety and technique cues" },
  { label: "Train", value: "Onboarding from real visits" },
] as const;

export function HeroSection() {
  return (
    <header className="lp-hero-v2">
      <div className="lp-wrap">
        <p className="lp-hero-v2-kicker">
          <span className="lp-hero-v2-dot" aria-hidden="true" />
          {site.tagline}
        </p>
        <h1>Coaching and training from maintenance jobs</h1>
        <p className="lp-hero-v2-lede">
          Foreman runs on the phone during a visit. It records the job, gives live coaching
          cues, and produces an end-of-job summary and training module from that session.
        </p>

        <div className="lp-hero-v2-signals" aria-label="How it works">
          {STEPS.map((step, i) => (
            <div key={step.label} className="lp-hero-v2-signal">
              <span className="lp-hero-v2-signal-key">{step.label}</span>
              <span className="lp-hero-v2-signal-val">{step.value}</span>
              {i < STEPS.length - 1 && (
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
            Try the demo
          </a>
          <Link href="/pricing" className="lp-btn lp-btn--secondary">
            View pricing
          </Link>
        </div>

        <aside className="lp-hero-v2-coach" aria-label="Example coaching cue">
          <p className="lp-hero-v2-coach-label">Live coaching</p>
          <p className="lp-hero-v2-coach-cue">
            &ldquo;Rinse the lower row before you move the ladder.&rdquo;
          </p>
          <p className="lp-hero-v2-coach-meta">
            Spoken on site · training module queued when the job ends
          </p>
        </aside>
      </div>
    </header>
  );
}
