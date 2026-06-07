import { BookDemo } from "@/components/book-demo";
import { LandingVisual } from "@/components/landing-visual";
import { DEMO_URL, PILOT_BADGE } from "@/lib/config";
import { media } from "@/lib/media";

export function HeroSection() {
  return (
    <header className="lp-hero">
      <div className="lp-wrap lp-hero-grid">
        <div>
          <p className="lp-badge lp-hero-stagger lp-reveal">{PILOT_BADGE}</p>
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
            <a href={DEMO_URL} className="lp-btn lp-btn--secondary">
              See a maintenance visit
            </a>
          </div>
        </div>

        <div className="lp-hero-visual lp-hero-stagger lp-reveal">
          <LandingVisual
            src={media.hero.src}
            alt={media.hero.alt}
            width={800}
            height={500}
            priority
          />
        </div>
      </div>
    </header>
  );
}
