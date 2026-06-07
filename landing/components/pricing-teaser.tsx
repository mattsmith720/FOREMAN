import Link from "next/link";
import { BookDemo } from "@/components/book-demo";

export function PricingTeaser() {
  return (
    <section className="lp-pricing-teaser" aria-labelledby="pricing-teaser-title">
      <div className="lp-wrap lp-pricing-teaser-inner">
        <div>
          <p id="pricing-teaser-title" className="lp-section-label">
            Pricing
          </p>
          <p className="lp-section-headline">Seat fee plus usage rates</p>
          <p className="lp-pricing-teaser-copy">
            From $99 per active tech per month. Jobs, transcription, modules, and storage
            have included allowances; overage rates are on the pricing page. Meta glasses
            lease from $29 per tech per month.
          </p>
        </div>
        <div className="lp-pricing-teaser-actions">
          <Link href="/pricing" className="lp-btn lp-btn--secondary">
            View full pricing
          </Link>
          <BookDemo />
        </div>
      </div>
    </section>
  );
}
