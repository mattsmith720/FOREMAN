import Link from "next/link";
import { BookDemo } from "@/components/book-demo";
import { PricingCalculator } from "@/components/pricing-calculator";
import { SiteNav } from "@/components/site-nav";
import {
  ADD_ONS,
  METERING,
  PRICING_DISCLAIMER,
  PRICING_FAQ,
  PRICING_TIERS,
  VOLUME_BREAKS,
} from "@/lib/pricing";
import { site } from "@/lib/site";

export const metadata = {
  title: "Pricing",
  description:
    "Foreman pricing for solar maintenance crews — per-seat plans, fleet discounts, usage metering, and enterprise options. AUD ex GST.",
};

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="lp-pricing-page lp-home">
        <header className="lp-pricing-hero">
          <div className="lp-wrap">
            <p className="lp-section-label">pricing</p>
            <h1>Pay per field tech. Own the training data.</h1>
            <p className="lp-pricing-hero-lede">
              Foreman pricing is built around active seats — techs who run real jobs on the
              phone. Coaching, storage, and training modules are bundled with clear allowances.
              Scale from a short pilot to a full crew without surprise platform fees.
            </p>
            <p className="lp-pricing-disclaimer">{PRICING_DISCLAIMER}</p>
          </div>
        </header>

        <section className="lp-section" aria-labelledby="tiers-title">
          <div className="lp-wrap">
            <h2 id="tiers-title" className="lp-section-title">
              Plans
            </h2>
            <div className="lp-pricing-tiers">
              {PRICING_TIERS.map((tier) => (
                <article
                  key={tier.id}
                  className={`lp-pricing-tier${tier.highlighted ? " lp-pricing-tier--highlight" : ""}`}
                >
                  {tier.highlighted && (
                    <p className="lp-pricing-tier-badge">Most crews start here</p>
                  )}
                  <h3>{tier.name}</h3>
                  <p className="lp-pricing-tier-tagline">{tier.tagline}</p>
                  <p className="lp-pricing-tier-price">
                    <span>{tier.priceLabel}</span>
                    <span className="lp-pricing-tier-price-note">{tier.priceNote}</span>
                  </p>
                  <p className="lp-pricing-tier-seats">{tier.seatRange}</p>
                  <BookDemo
                    label={tier.cta}
                    primary={tier.highlighted}
                    className="lp-pricing-tier-cta"
                  />
                  <div className="lp-pricing-tier-block">
                    <h4>Includes</h4>
                    <ul>
                      {tier.includes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="lp-pricing-tier-block lp-pricing-tier-block--muted">
                    <h4>Limits</h4>
                    <ul>
                      {tier.limits.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--alt" aria-labelledby="volume-title">
          <div className="lp-wrap">
            <h2 id="volume-title" className="lp-section-title">
              Volume breaks
            </h2>
            <p className="lp-section-lede">
              Per-seat rate drops as committed seats grow. Crew tier requires annual prepay.
            </p>
            <div className="lp-pricing-table-wrap">
              <table className="lp-pricing-table">
                <thead>
                  <tr>
                    <th scope="col">Active seats</th>
                    <th scope="col">Field (monthly)</th>
                    <th scope="col">Crew (annual)</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {VOLUME_BREAKS.map((row) => (
                    <tr key={row.seats}>
                      <td>{row.seats}</td>
                      <td>{row.field}</td>
                      <td>{row.crew}</td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PricingCalculator />
          </div>
        </section>

        <section className="lp-section" aria-labelledby="metering-title">
          <div className="lp-wrap">
            <h2 id="metering-title" className="lp-section-title">
              Usage &amp; overages
            </h2>
            <p className="lp-section-lede">
              Typical maintenance visits sit comfortably inside included allowances. Heavy
              ingest, franchise-scale module generation, or unusual frame rates are metered
              at cost-plus so margins stay predictable for both sides.
            </p>
            <div className="lp-pricing-table-wrap">
              <table className="lp-pricing-table">
                <thead>
                  <tr>
                    <th scope="col">Metric</th>
                    <th scope="col">Unit</th>
                    <th scope="col">Included</th>
                    <th scope="col">Overage</th>
                  </tr>
                </thead>
                <tbody>
                  {METERING.map((line) => (
                    <tr key={line.name}>
                      <td>
                        <strong>{line.name}</strong>
                        {line.notes && (
                          <span className="lp-pricing-table-note">{line.notes}</span>
                        )}
                      </td>
                      <td>{line.unit}</td>
                      <td>{line.included}</td>
                      <td>{line.overage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--alt" aria-labelledby="addons-title">
          <div className="lp-wrap">
            <h2 id="addons-title" className="lp-section-title">
              Professional services &amp; add-ons
            </h2>
            <ul className="lp-pricing-addons">
              {ADD_ONS.map((addon) => (
                <li key={addon.name} className="lp-pricing-addon">
                  <div className="lp-pricing-addon-head">
                    <h3>{addon.name}</h3>
                    <p className="lp-pricing-addon-price">{addon.price}</p>
                  </div>
                  <p>{addon.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="model-title">
          <div className="lp-wrap lp-pricing-model">
            <h2 id="model-title" className="lp-section-title">
              How we think about pricing
            </h2>
            <div className="lp-pricing-model-grid">
              <article>
                <h3>Seats, not logins</h3>
                <p>
                  You pay for techs doing real work — not for office staff reviewing modules
                  or dashboards. That keeps the model aligned with crew growth.
                </p>
              </article>
              <article>
                <h3>Data is the moat</h3>
                <p>
                  Your footage stays yours. Export is included on Field and above so you can
                  train Whisper and future vision models on your own visits — not a generic
                  catalogue.
                </p>
              </article>
              <article>
                <h3>Pilot → fleet path</h3>
                <p>
                  Start on Pilot to prove coaching and module quality on 2–8 techs. Roll into
                  Field monthly or commit to Crew annual when the whole team adopts it.
                </p>
              </article>
              <article>
                <h3>Transparent AI metering</h3>
                <p>
                  Coaching and transcription have fair-use bundles. If you are ingesting a
                  historical video library or generating dozens of modules a week, overage
                  rates are listed above — no opaque “AI credits”.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--alt" aria-labelledby="pricing-faq-title">
          <div className="lp-wrap">
            <h2 id="pricing-faq-title" className="lp-section-title">
              Pricing FAQ
            </h2>
            <dl className="lp-pricing-faq">
              {PRICING_FAQ.map((item) => (
                <div key={item.q} className="lp-pricing-faq-item">
                  <dt>{item.q}</dt>
                  <dd>{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="lp-final-v2" aria-labelledby="pricing-cta">
          <div className="lp-wrap lp-final-v2-inner">
            <h2 id="pricing-cta">model_your_crew()</h2>
            <p>Map seats, job volume, and module usage on a demo call.</p>
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
            <p className="lp-footer-v2-meta">
              © {site.year} {site.name} · {site.company} · {site.location}
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
