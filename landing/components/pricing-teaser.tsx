import Link from "next/link";
import { BookDemo } from "@/components/book-demo";

export function PricingTeaser() {
  return (
    <section className="lp-pricing-teaser" aria-labelledby="pricing-teaser-title">
      <div className="lp-wrap lp-pricing-teaser-inner">
        <div>
          <h2 id="pricing-teaser-title" className="lp-section-label">
            pricing
          </h2>
          <p className="lp-section-headline">Per-seat. No platform tax.</p>
          <p className="lp-pricing-teaser-copy">
            Pilot from $99/tech · Field at $149/tech · fleet breaks at 10+ seats.
            Usage metering published — no opaque AI credits.
          </p>
        </div>
        <div className="lp-pricing-teaser-actions">
          <Link href="/pricing" className="lp-btn lp-btn--secondary">
            full_pricing()
          </Link>
          <BookDemo />
        </div>
      </div>
    </section>
  );
}
