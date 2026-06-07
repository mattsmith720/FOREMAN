import { LandingVisual } from "@/components/landing-visual";
import { ScrollReveal } from "@/components/scroll-reveal";
import { media } from "@/lib/media";

const PAIN = [
  {
    title: "Owner on Every Roof",
    body: "New hires shadow you for weeks. You repeat the same scrub, mesh, and thermal steps on every visit.",
  },
  {
    title: "Inconsistent Crew Quality",
    body: "Five techs, five techniques. Callbacks and customer complaints when the standard slips.",
  },
  {
    title: "Footage Goes Nowhere",
    body: "Phone video sits in camera rolls. Nothing structured for training or your own AI model.",
  },
  {
    title: "Franchise Scale Stalls",
    body: "You cannot clone yourself. Growth means more training load, not less.",
  },
] as const;

export function PainSection() {
  return (
    <section
      className="lp-section lp-section--alt"
      id="pain"
      aria-labelledby="pain-title"
    >
      <div className="lp-wrap">
        <ScrollReveal>
          <h2 id="pain-title" className="lp-section-title">
            Scaling a maintenance crew shouldn&apos;t mean scaling your training load
          </h2>
          <p className="lp-section-lede">
            SolarShield runs panel cleans, pigeon proofing, thermal scans, and maintenance
            plans across Brisbane. The bottleneck is not leads · it is getting every new tech
            to work like your best tech without you on every roof.
          </p>
        </ScrollReveal>
        <div className="lp-pain-grid">
          {PAIN.map((card, index) => (
            <ScrollReveal key={card.title}>
              <article className="lp-card lp-card--pain">
                <div className="lp-card-thumb">
                  <LandingVisual
                    src={media.pain[index].src}
                    alt={media.pain[index].alt}
                    width={400}
                    height={400}
                  />
                </div>
                <div className="lp-card-body">
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
