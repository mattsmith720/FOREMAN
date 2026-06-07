import Image from "next/image";
import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { Faq } from "@/components/faq";
import { HeroReveal } from "@/components/hero-reveal";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ANNOUNCEMENT, DEMO_URL, PILOT_BADGE } from "@/lib/config";
import { site } from "@/lib/site";

const PAIN = [
  {
    title: "Failed Claims",
    body: "One missing shutdown-label photo holds up a $3,000 rebate.",
  },
  {
    title: "Camera-Roll Chaos",
    body: "Your evidence lives across five phones and a WhatsApp thread.",
  },
  {
    title: "The Regulator Checks With AI",
    body: "The CER reviews every photo with AI. Unclear shots get rejected.",
  },
  {
    title: "Found Out at Claim Time",
    body: "Defects surface weeks later — back on the roof you go.",
  },
] as const;

const FEATURES = [
  {
    title: "Voice-Guided Evidence Capture",
    body: "Foreman prompts every CER-required shot and auto-captures when it's sharp, legible, geotagged and timestamped. No shutter taps, no missed photos.",
    image: "/assets/feature-evidence.png",
    alt: "Foreman demo — guided compliance capture on a live install",
  },
  {
    title: "Real-Time Defect Coaching",
    body: "One spoken line the moment something would fail — missing labels, serial mismatches, exposed DC runs — while you can still fix it.",
    image: "/assets/feature-coaching.png",
    alt: "Foreman demo — real-time defect coaching cue on switchboard",
  },
  {
    title: "One-Tap Submission Packs",
    body: "Every job ends with a branded, submission-ready evidence pack: stamped photos, serial checks, full manifest.",
    image: "/assets/feature-pack.png",
    alt: "Foreman demo — evidence pack validation complete",
  },
  {
    title: "Crew Dashboard",
    body: "Jobs today, packs ready, defects caught — per installer, at a glance.",
    image: "/assets/feature-dashboard.png",
    alt: "Foreman dashboard — jobs and crew activity",
  },
] as const;

export default function LandingPage() {
  return (
    <main>
      <HeroReveal />
      <div className="lp-announce">
        🚀 {ANNOUNCEMENT} —{" "}
        <a href="#book">Book a demo</a>
      </div>

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-grid">
          <div>
            <p className="lp-badge lp-hero-stagger lp-reveal" style={{ marginBottom: "1rem" }}>
              {PILOT_BADGE}
            </p>
            <p className="lp-eyebrow lp-hero-stagger lp-reveal">{site.tagline}</p>
            <h1 className="lp-hero-stagger lp-reveal">
              Your evidence and your coaching. Built around how crews actually work on a roof.
            </h1>
            <p className="lp-hero-lead lp-hero-stagger lp-reveal">
              We make it easy to stop losing STC claims to paperwork.
            </p>
            <p className="lp-hero-oneliner lp-hero-stagger lp-reveal">
              Built around the CER&apos;s photo-evidence requirements — not a regulator endorsement.
            </p>
            <div className="lp-cta-row lp-hero-stagger lp-reveal" id="book">
              <BookDemo />
              <a href={DEMO_URL} className="lp-btn lp-btn--secondary">
                Watch it run a job
              </a>
            </div>
          </div>
          <div className="lp-media-frame lp-hero-stagger lp-reveal">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/hero-poster.png"
              aria-label="Silent demo of Foreman coaching an install"
            >
              <source src="/assets/hero-demo.webm" type="video/webm" />
              <source src="/assets/hero-demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </header>

      <section className="lp-section lp-section--alt" aria-labelledby="pain-title">
        <div className="lp-wrap">
          <ScrollReveal>
            <h2 id="pain-title">Solar Compliance Shouldn&apos;t Be This Hard</h2>
            <p className="lp-section-lede">
              Photos get lost. Labels get missed. One unclear shot spirals into a failed claim
              and a return trip. There has to be a better way.
            </p>
          </ScrollReveal>
          <div className="lp-pain-grid">
            {PAIN.map((card) => (
              <ScrollReveal key={card.title}>
                <article className="lp-card lp-card--pain">
                  <div className="lp-card-icon" aria-hidden="true">
                    ❌
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" aria-labelledby="solution-title">
        <div className="lp-wrap">
          <ScrollReveal>
            <h2 id="solution-title">The Compliance Layer for Your Crew</h2>
            <p className="lp-section-lede">
              Foreman automates the high-friction parts of every install: evidence, defects,
              claims.
            </p>
          </ScrollReveal>
          <div className="lp-feature-grid">
            {FEATURES.map((feature) => (
              <ScrollReveal key={feature.title}>
                <article className="lp-feature">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    width={640}
                    height={400}
                    loading="lazy"
                  />
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt" aria-labelledby="faq-title">
        <div className="lp-wrap">
          <ScrollReveal>
            <h2 id="faq-title">Frequently asked questions</h2>
          </ScrollReveal>
          <ScrollReveal>
            <Faq />
          </ScrollReveal>
        </div>
      </section>

      <section className="lp-final-cta" aria-labelledby="final-cta">
        <div className="lp-wrap">
          <h2 id="final-cta">
            Let&apos;s make your next claim{" "}
            <span className="lp-highlight">pass first time</span>.
          </h2>
          <BookDemo label="Book a demo" />
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <p>
            © {site.year} {site.name} · A {site.company} product · {site.location}
          </p>
          <nav aria-label="Footer">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={site.appUrl}>Open the app</a>
          </nav>
          {/* Analytics slot — operator sets NEXT_PUBLIC_ANALYTICS_ID when ready */}
        </div>
      </footer>
    </main>
  );
}
