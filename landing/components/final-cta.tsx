import { BookDemo } from "./book-demo";
import { ScrollReveal } from "./scroll-reveal";

export function FinalCta() {
  return (
    <section className="lp-final-cta" aria-labelledby="final-cta">
      <div className="lp-wrap lp-final-inner">
        <ScrollReveal>
          <div>
            <h2 id="final-cta">
              Record once on the roof. Onboard the next hire automatically.
            </h2>
            <p className="lp-final-sub">
              Book a demo. We run a live maintenance visit on the phone and generate your
              first training module from SolarShield footage.
            </p>
          </div>
        </ScrollReveal>
        <ScrollReveal>
          <BookDemo label="Book a demo" />
        </ScrollReveal>
      </div>
    </section>
  );
}
