import Image from "next/image";
import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { Faq } from "@/components/faq";
import { FeatureShowcase } from "@/components/feature-showcase";
import { HeroReveal } from "@/components/hero-reveal";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SiteNav } from "@/components/site-nav";
import { ANNOUNCEMENT, DEMO_URL, PILOT_BADGE } from "@/lib/config";
import { site } from "@/lib/site";

const PAIN = [
  {
    title: "Failed Claims",
    body: "One missing shutdown-label photo holds up a $3,000 rebate.",
    image: "/assets/feature-coaching.png",
    imageAlt: "Foreman flags a missing shutdown label on a switchboard shot",
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
    headline: "Every CER shot, prompted and captured hands-free",
    body: "Foreman prompts every CER-required shot and auto-captures when it's sharp, legible, geotagged and timestamped. No shutter taps, no missed photos.",
    image: "/assets/feature-evidence.png",
    alt: "Foreman demo — guided compliance capture on a live install",
  },
  {
    title: "Real-Time Defect Coaching",
    headline: "One spoken line while you can still fix it",
    body: "Missing labels, serial mismatches, exposed DC runs — Foreman calls it the moment something would fail, not weeks later at claim time.",
    image: "/assets/feature-coaching.png",
    alt: "Foreman demo — real-time defect coaching cue on switchboard",
  },
  {
    title: "One-Tap Submission Packs",
    headline: "Submission-ready evidence at job end",
    body: "Every job ends with a branded evidence pack: stamped photos, serial checks, and a full manifest your crew lead can forward.",
    image: "/assets/feature-pack.png",
    alt: "Foreman demo — evidence pack validation complete",
  },
  {
    title: "Crew Dashboard",
    headline: "Jobs, packs, and defects — per installer",
    body: "Jobs today, packs ready, defects caught — per installer, at a glance for the crew lead.",
    image: "/assets/feature-dashboard.png",
    alt: "Foreman dashboard — jobs and crew activity",
  },
] as const;

export default function LandingPage() {
  return (
    <main>
      <HeroReveal />
      <div className="lp-announce" aria-label="Announcement">
        <span className="lp-announce-track">
          <span>🚀 {ANNOUNCEMENT}</span>
          <span aria-hidden="true">🚀 {ANNOUNCEMENT}</span>
          <a href="#book">Book a demo</a>
        </span>
      </div>

      <SiteNav />

      <header className="lp-hero">
        <div className="lp-wrap lp-hero-center">
          <p className="lp-badge lp-hero-stagger lp-reveal">{PILOT_BADGE}</p>
          <h1 className="lp-hero-stagger lp-reveal">
            Compliance execution for solar install crews
          </h1>
          <p className="lp-hero-sub lp-hero-stagger lp-reveal">
            Your evidence and your coaching. Built around how crews actually work on a roof.
          </p>
          <div className="lp-cta-row lp-hero-stagger lp-reveal lp-cta-row--center" id="book">
            <a href={DEMO_URL} className="lp-btn lp-btn--secondary">
              Watch it run a job
            </a>
            <BookDemo />
          </div>
        </div>

        <div className="lp-wrap lp-hero-media-block lp-hero-stagger lp-reveal">
          <div className="lp-media-labels">
            <span className="lp-media-pill">Demo</span>
            <span className="lp-media-pill lp-media-pill--muted">Live install pilot</span>
          </div>
          <div className="lp-media-frame">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/assets/hero-poster.png"
              aria-label="Silent demo of Foreman coaching an install"
            >
              <source src="/assets/hero-demo.webm" type="video/webm" />
            </video>
          </div>
        </div>
      </header>

      <section className="lp-tagline-band" aria-label="Value proposition">
        <div className="lp-wrap">
          <p className="lp-tagline">
            We make it easy to{" "}
            <span className="lp-highlight">stop losing STC claims to paperwork</span>.
          </p>
          <BookDemo label="Sign up for a demo" className="lp-tagline-cta" />
        </div>
      </section>

      <section className="lp-section lp-section--alt" aria-labelledby="pain-title">
        <div className="lp-wrap">
          <ScrollReveal>
            <h2 id="pain-title" className="lp-section-title">
              Solar Compliance Shouldn&apos;t Be This Hard
            </h2>
            <p className="lp-section-lede lp-section-lede--center">
              Photos get lost. Labels get missed. One unclear shot spirals into a failed claim
              and a return trip. There has to be a better way.
            </p>
          </ScrollReveal>
          <div className="lp-pain-grid">
            {PAIN.map((card, index) => (
              <ScrollReveal key={card.title}>
                <article className={`lp-card lp-card--pain${index === 0 ? " lp-card--pain-featured" : ""}`}>
                  {"image" in card && card.image ? (
                    <div className="lp-card-thumb">
                      <Image
                        src={card.image}
                        alt={card.imageAlt}
                        width={400}
                        height={240}
                      />
                    </div>
                  ) : (
                    <div className="lp-card-icon" aria-hidden="true">
                      ❌
                    </div>
                  )}
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-solution" aria-labelledby="solution-title">
        <div className="lp-wrap">
          <ScrollReveal>
            <p className="lp-solution-kicker">The missing layer on your installs</p>
            <h2 id="solution-title" className="lp-section-title lp-section-title--center">
              The Compliance Layer for Your Crew
            </h2>
            <p className="lp-section-lede lp-section-lede--center">
              Foreman automates the high-friction parts of every install: evidence, defects,
              claims.
            </p>
          </ScrollReveal>
          <div className="lp-showcase-stack">
            {FEATURES.map((feature, index) => (
              <ScrollReveal key={feature.title}>
                <FeatureShowcase
                  title={feature.title}
                  headline={feature.headline}
                  body={feature.body}
                  image={feature.image}
                  alt={feature.alt}
                  reversed={index % 2 === 1}
                />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-section--alt lp-faq-section" aria-labelledby="faq-title">
        <div className="lp-wrap lp-faq-wrap">
          <ScrollReveal>
            <h2 id="faq-title" className="lp-section-title lp-section-title--center">
              Frequently Asked Questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <Faq />
          </ScrollReveal>
        </div>
      </section>

      <section className="lp-final-cta" aria-labelledby="final-cta">
        <div className="lp-wrap lp-final-inner">
          <h2 id="final-cta" className="lp-final-lines">
            <span>Let&apos;s make your next claim</span>
            <span>
              pass{" "}
              <span className="lp-highlight">first time</span>.
            </span>
          </h2>
          <BookDemo label="Book a demo" />
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-inner">
          <Link href="/" className="lp-logo lp-logo--footer">
            Foreman
          </Link>
          <p>
            © {site.year} {site.name} · A {site.company} product · {site.location}
          </p>
          <nav aria-label="Footer">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={site.appUrl}>Open the app</a>
          </nav>
          <p className="lp-footer-fine">
            Built around the CER&apos;s photo-evidence requirements — not a regulator
            endorsement.
          </p>
        </div>
      </footer>
    </main>
  );
}
