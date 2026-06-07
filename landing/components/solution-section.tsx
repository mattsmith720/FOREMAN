import { FeatureShowcase } from "@/components/feature-showcase";
import { ScrollReveal } from "@/components/scroll-reveal";
import { media } from "@/lib/media";

const FEATURES = [
  {
    title: "Record Real Jobs",
    headline: "Your footage becomes your training library",
    body: "Techs run Foreman on the phone during panel cleans, pigeon proofing, thermal scans, and plan visits. Every frame and spoken line lands in your private dataset · ready for export and model training.",
  },
  {
    title: "Live Technique Coaching",
    headline: "One spoken line while the ladder is still up",
    body: "Missed lower-row rinse. Mesh gap at the corner. Thermal angle off. Foreman flags it on site · not on the callback visit.",
  },
  {
    title: "Auto Training Modules",
    headline: "Onboarding packages from your best techs",
    body: "End a job and Foreman generates step-by-step modules, safety notes, quiz questions, and a pre-job briefing script · pulled from real visits, not generic slides.",
  },
  {
    title: "Proof-of-Work Packs",
    headline: "Before/after evidence for every maintenance visit",
    body: "Geotagged, timestamped visit records for annual plans, thermal reports, and customer handover · without chasing five phones after the van leaves.",
  },
] as const;

export function SolutionSection() {
  return (
    <section
      className="lp-section lp-solution"
      id="solution"
      aria-labelledby="solution-title"
    >
      <div className="lp-wrap">
        <ScrollReveal>
          <p className="lp-solution-kicker">Panels clean. Crew still inconsistent.</p>
          <h2 id="solution-title" className="lp-section-title">
            The training layer for your maintenance business
          </h2>
          <p className="lp-section-lede">
            Foreman turns field video into proprietary training data and auto-built onboarding
            · so SolarShield scales crews without scaling owner time on the roof.
          </p>
        </ScrollReveal>
        <div className="lp-showcase-stack">
          {FEATURES.map((feature, index) => (
            <ScrollReveal key={feature.title}>
              <FeatureShowcase
                title={feature.title}
                headline={feature.headline}
                body={feature.body}
                image={media.features[index].src}
                alt={media.features[index].alt}
                reversed={index % 2 === 1}
                index={index}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
