import { BookDemo } from "@/components/book-demo";
import { CapabilitiesSection } from "@/components/capabilities-section";
import { Faq } from "@/components/faq";
import { HeroSection } from "@/components/hero-section";
import { LandingFooter } from "@/components/landing-footer";
import { PipelineSection } from "@/components/pipeline-section";
import { PricingTeaser } from "@/components/pricing-teaser";
import { SiteNav } from "@/components/site-nav";

export default function LandingPage() {
  return (
    <main id="main" className="lp-home">
      <SiteNav />
      <HeroSection />
      <PipelineSection />
      <CapabilitiesSection />
      <PricingTeaser />
      <section className="lp-section lp-section--alt" id="faq" aria-labelledby="faq-title">
        <div className="lp-wrap">
          <p className="lp-section-label">FAQ</p>
          <h2 id="faq-title" className="lp-section-headline">
            Common questions
          </h2>
          <Faq />
        </div>
      </section>
      <section className="lp-final-v2" aria-labelledby="final-cta">
        <div className="lp-wrap lp-final-v2-inner">
          <h2 id="final-cta">Book a demo</h2>
          <p>Walk through a maintenance visit and see the end-of-job summary.</p>
          <BookDemo />
        </div>
      </section>
      <LandingFooter />
    </main>
  );
}
