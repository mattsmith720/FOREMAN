import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { CapabilitiesSection } from "@/components/capabilities-section";
import { HeroSection } from "@/components/hero-section";
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
      <section className="lp-final-v2" aria-labelledby="final-cta">
        <div className="lp-wrap lp-final-v2-inner">
          <h2 id="final-cta">deploy_on_your_crew</h2>
          <p>Book a walkthrough on a live maintenance visit.</p>
          <BookDemo label="book_demo()" />
        </div>
      </section>
      <footer className="lp-footer-v2">
        <div className="lp-wrap lp-footer-v2-inner">
          <Link href="/" className="lp-logo">
            Fore<span className="lp-logo-mark">man</span>
          </Link>
          <nav aria-label="Footer">
            <Link href="/pricing">Pricing</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
          <p className="lp-footer-v2-meta">© 2026 Foreman · Unicity · Brisbane AU</p>
        </div>
      </footer>
    </main>
  );
}
