import Link from "next/link";
import type { ReactElement } from "react";
import { BookDemo } from "@/components/book-demo";
import { ServicesBand } from "@/components/services-band";
import { Faq } from "@/components/faq";
import { FinalCta } from "@/components/final-cta";
import { HeroReveal } from "@/components/hero-reveal";
import { HeroSection } from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import { PainSection } from "@/components/pain-section";
import { ScrollProgress } from "@/components/scroll-progress";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { SolutionSection } from "@/components/solution-section";
import { TrustStrip } from "@/components/trust-strip";
import { ANNOUNCEMENT } from "@/lib/config";

/** Set true to use inline fallback when a lane component file is missing. */
const SECTION_OVERRIDES = {
  hero: false,
  pain: false,
  solution: false,
  howItWorks: false,
  servicesBand: false,
  trustStrip: false,
  finalCta: false,
  siteFooter: false,
} as const;

type SectionFn = () => ReactElement;

function pickSection(override: boolean, Impl: SectionFn, Fallback: SectionFn): SectionFn {
  return override ? Fallback : Impl;
}

const Hero = pickSection(SECTION_OVERRIDES.hero, HeroSection, HeroSectionFallback);
const Pain = pickSection(SECTION_OVERRIDES.pain, PainSection, PainSectionFallback);
const Solution = pickSection(
  SECTION_OVERRIDES.solution,
  SolutionSection,
  SolutionSectionFallback,
);
const HowItWorksSection = pickSection(
  SECTION_OVERRIDES.howItWorks,
  HowItWorks,
  HowItWorksFallback,
);
const Services = pickSection(
  SECTION_OVERRIDES.servicesBand,
  ServicesBand,
  ServicesBandFallback,
);
const Trust = pickSection(SECTION_OVERRIDES.trustStrip, TrustStrip, TrustStripFallback);
const Final = pickSection(SECTION_OVERRIDES.finalCta, FinalCta, FinalCtaFallback);
const Footer = pickSection(SECTION_OVERRIDES.siteFooter, SiteFooter, SiteFooterFallback);

export default function LandingPage() {
  return (
    <main id="main">
      <ScrollProgress />
      <HeroReveal />

      <div className="lp-pilot-strip">
        {ANNOUNCEMENT}
        <a href="#book">Book a demo</a>
      </div>

      <SiteNav />

      <Hero />
      <Trust />
      <Pain />
      <HowItWorksSection />
      <Solution />
      <Services />

      <section
        className="lp-section lp-section--alt lp-faq-section"
        id="faq"
        aria-labelledby="faq-title"
      >
        <div className="lp-wrap lp-faq-wrap">
          <ScrollReveal>
            <h2 id="faq-title" className="lp-section-title">
              Frequently asked questions
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <Faq />
          </ScrollReveal>
        </div>
      </section>

      <Final />
      <Footer />
    </main>
  );
}

/* ── Inline fallbacks (activate via SECTION_OVERRIDES) ── */

function HeroSectionFallback(): ReactElement {
  return (
    <header className="lp-hero">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <p className="lp-badge lp-hero-stagger lp-reveal">Pilot</p>
          <h1 className="lp-hero-stagger lp-reveal">
            Every job your best techs do becomes the training for everyone who joins next
          </h1>
          <p className="lp-hero-sub lp-hero-stagger lp-reveal">
            Foreman records maintenance visits on the phone, coaches on the roof, and turns
            real footage into onboarding packages · so you stop teaching the same thing on
            every roof.
          </p>
          <div className="lp-cta-row lp-hero-stagger lp-reveal" id="book">
            <BookDemo />
          </div>
        </div>
      </div>
    </header>
  );
}

function PainSectionFallback(): ReactElement {
  return (
    <section className="lp-section lp-section--alt" id="pain" aria-labelledby="pain-title">
      <div className="lp-wrap">
        <h2 id="pain-title" className="lp-section-title">
          Scaling a maintenance crew shouldn&apos;t mean scaling your training load
        </h2>
      </div>
    </section>
  );
}

function SolutionSectionFallback(): ReactElement {
  return (
    <section className="lp-section lp-solution" id="solution" aria-labelledby="solution-title">
      <div className="lp-wrap">
        <h2 id="solution-title" className="lp-section-title">
          The training layer for your maintenance business
        </h2>
      </div>
    </section>
  );
}

function HowItWorksFallback(): ReactElement {
  return (
    <section
      className="lp-section lp-section--alt"
      id="how-it-works"
      aria-labelledby="hiw-title"
    >
      <div className="lp-wrap">
        <h2 id="hiw-title" className="lp-section-title">
          How it works
        </h2>
      </div>
    </section>
  );
}

function ServicesBandFallback(): ReactElement {
  return (
    <section className="lp-cer-band" id="services" aria-labelledby="services-band-title">
      <div className="lp-wrap lp-cer-inner">
        <h2 id="services-band-title" className="lp-cer-title">
          Maintenance jobs Foreman trains on
        </h2>
      </div>
    </section>
  );
}

function TrustStripFallback(): ReactElement {
  return (
    <aside className="lp-trust-strip" aria-label="Trust and disclosures">
      <div className="lp-wrap lp-trust-inner">
        <p className="lp-trust-disclaimer">Private pilot · consent-first recording</p>
      </div>
    </aside>
  );
}

function FinalCtaFallback(): ReactElement {
  return (
    <section className="lp-final-cta" aria-labelledby="final-cta">
      <div className="lp-wrap lp-final-inner">
        <h2 id="final-cta">Record once on the roof. Onboard the next hire automatically.</h2>
        <BookDemo label="Book a demo" />
      </div>
    </section>
  );
}

function SiteFooterFallback(): ReactElement {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-inner">
        <Link href="/" className="lp-logo lp-logo--footer">
          Fore<span className="lp-logo-mark">man</span>
        </Link>
        <nav aria-label="Footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
