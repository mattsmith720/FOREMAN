import { BookDemo } from "@/components/book-demo";
import { LandingFooter } from "@/components/landing-footer";
import { PricingCalculator } from "@/components/pricing-calculator";
import { SiteNav } from "@/components/site-nav";
import {
  ADD_ONS,
  GLASSES_RETAIL,
  HARDWARE_OPTIONS,
  HYBRID_MODEL,
  METERING,
  PRICING_DISCLAIMER,
  PRICING_FAQ,
  PRICING_TIERS,
  VOLUME_BREAKS,
  WEARABLE_BUNDLES,
  glassesLeaseMonthlyAud,
} from "@/lib/pricing";

export const metadata = {
  title: "Pricing",
  description:
    "Foreman hybrid pricing for solar maintenance crews — per-seat platform fee plus metered jobs and AI usage. Fleet discounts, hardware options, enterprise. AUD ex GST.",
};

export default function PricingPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="lp-pricing-page lp-home">
        <header className="lp-pricing-hero">
          <div className="lp-wrap">
            <p className="lp-section-label">Pricing</p>
            <h1>Seat fee and usage rates</h1>
            <p className="lp-pricing-hero-lede">
              {HYBRID_MODEL.lede} Pilot runs on the phone only. Field and Crew can add
              Meta Ray-Ban glasses for hands-free capture. Fixed and variable charges appear
              as separate lines on the invoice.
            </p>
            <p className="lp-pricing-disclaimer">{PRICING_DISCLAIMER}</p>
          </div>
        </header>

        <section className="lp-section" aria-labelledby="hybrid-title">
          <div className="lp-wrap lp-pricing-model">
            <h2 id="hybrid-title" className="lp-section-title">
              {HYBRID_MODEL.headline}
            </h2>
            <div className="lp-pricing-hybrid-grid">
              <div className="lp-pricing-hybrid-col">
                <h3 className="lp-pricing-calc-title">Fixed monthly</h3>
                <ul className="lp-pricing-hybrid-list">
                  {HYBRID_MODEL.fixed.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lp-pricing-hybrid-col">
                <h3 className="lp-pricing-calc-title">Variable usage</h3>
                <ul className="lp-pricing-hybrid-list">
                  {HYBRID_MODEL.variable.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section lp-section--alt" aria-labelledby="tiers-title">
          <div className="lp-wrap">
            <h2 id="tiers-title" className="lp-section-title">
              Platform seats
            </h2>
            <p className="lp-section-lede">
              Seat fee includes bundled usage pools — jobs, frames, transcription, modules,
              and storage. Metered rates apply once you exceed those allowances.
            </p>
            <div className="lp-pricing-tiers">
              {PRICING_TIERS.map((tier) => (
                <article
                  key={tier.id}
                  className={`lp-pricing-tier${tier.highlighted ? " lp-pricing-tier--highlight" : ""}`}
                >
                  {tier.highlighted && (
                    <p className="lp-pricing-tier-badge">Typical starting tier</p>
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

        <section className="lp-section lp-section--alt" aria-labelledby="hardware-title">
          <div className="lp-wrap">
            <h2 id="hardware-title" className="lp-section-title">
              Meta glasses hardware
            </h2>
            <p className="lp-section-lede">
              {GLASSES_RETAIL.model} retails around AU${GLASSES_RETAIL.audRetailStandard}{" "}
              (standard lenses) or ~AU${GLASSES_RETAIL.audRetailPrescription} with
              prescription — based on Meta&apos;s US${GLASSES_RETAIL.usdRetail} list price
              plus typical lens add-ons. Foreman does not mark up software to hide device
              cost; you choose how hardware is funded.
            </p>
            <div className="lp-pricing-table-wrap">
              <table className="lp-pricing-table">
                <thead>
                  <tr>
                    <th scope="col">Option</th>
                    <th scope="col">Upfront / seat</th>
                    <th scope="col">Monthly / seat</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {HARDWARE_OPTIONS.map((opt) => (
                    <tr key={opt.id}>
                      <td>
                        <strong>{opt.name}</strong>
                        <span className="lp-pricing-table-note">{opt.description}</span>
                      </td>
                      <td>
                        {opt.id === "glasses_buy"
                          ? `$649 standard · $949 Rx`
                          : opt.id === "phone" || opt.id === "byod_glasses"
                            ? "—"
                            : "—"}
                      </td>
                      <td>
                        {opt.id === "glasses_lease"
                          ? `$${glassesLeaseMonthlyAud(false)} standard · $${glassesLeaseMonthlyAud(true)} Rx`
                          : opt.id === "phone" || opt.id === "byod_glasses"
                            ? "$0"
                            : "—"}
                      </td>
                      <td>
                        {opt.id === "glasses_lease"
                          ? `${GLASSES_RETAIL.leaseTermMonths}-mo term · replacement reserve incl.`
                          : opt.id === "byod_glasses"
                            ? "Retail ~$599–$899 AUD at Meta / opticians"
                            : "Pilot default"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lp-pricing-bundles">
              <h3 className="lp-pricing-calc-title">Published hands-free bundles</h3>
              <p className="lp-section-lede">
                Software plus glasses lease in one monthly line — useful for crew budgeting.
              </p>
              <ul className="lp-pricing-addons">
                {WEARABLE_BUNDLES.map((bundle) => (
                  <li key={bundle.name} className="lp-pricing-addon">
                    <div className="lp-pricing-addon-head">
                      <h3>{bundle.name}</h3>
                      <p className="lp-pricing-addon-price">
                        ${bundle.totalPerSeat} / seat / mo
                      </p>
                    </div>
                    <p>
                      {bundle.note} — ${bundle.softwarePerSeat} software + $
                      {bundle.hardwarePerSeat} lease.
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="lp-section" aria-labelledby="volume-title">
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
              Usage rates
            </h2>
            <p className="lp-section-lede">
              Charges for usage above the included amounts in your tier. The table lists
              the unit and overage rate for each metric.
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
              Notes on billing
            </h2>
            <div className="lp-pricing-model-grid">
              <article>
                <h3>Seat vs usage</h3>
                <p>
                  The seat fee is fixed each month for every active tech. Usage charges
                  depend on job count and how much coaching, transcription, and storage you
                  consume above the included amounts.
                </p>
              </article>
              <article>
                <h3>Your job data</h3>
                <p>
                  Session footage and transcripts stay in your account. Field and above
                  include dataset export (JSONL) if you want to train models on your own
                  visits.
                </p>
              </article>
              <article>
                <h3>Pilot to full rollout</h3>
                <p>
                  Pilot is phone-only. For hands-free capture on Field or Crew, add Meta
                  glasses — lease from $29 per seat per month or purchase from $649 per
                  seat. Combined software and lease bundles are listed above.
                </p>
              </article>
              <article>
                <h3>Overage rates</h3>
                <p>
                  Each tier bundles a set number of jobs, frames, minutes, and modules.
                  Anything above those thresholds is charged at the unit rates in the usage
                  table.
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
            <h2 id="pricing-cta">Estimate for your crew</h2>
            <p>Use the calculator above, or walk through your job volume on a call.</p>
            <BookDemo />
          </div>
        </section>

        <LandingFooter />
      </main>
    </>
  );
}
