import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/lib/site";

export const metadata = {
  title: "Terms",
  description:
    "Pilot terms of service for Foreman. Field intelligence for Australian solar maintenance crews.",
};

const SECTIONS = [
  {
    id: "pilot",
    title: "Pilot service",
    paragraphs: [
      "Foreman is provided as a pilot service to qualified solar maintenance operators. Access is limited while we refine job recording, live coaching, training module generation, and dataset export with partner crews.",
    ],
  },
  {
    id: "training-data",
    title: "Training data",
    paragraphs: [
      "Session footage and transcripts may be used to build operator-specific training datasets and onboarding materials. Data handling is governed by the pilot agreement with your operator.",
      "Foreman does not claim ownership of your customer relationships or field procedures. You retain responsibility for how training content is used with your crew.",
    ],
  },
  {
    id: "responsibilities",
    title: "Your responsibilities",
    paragraphs: [
      "Operators remain responsible for the accuracy of training materials generated from session data and for verifying safety procedures before crew use.",
      "You must review auto-generated onboarding modules before assigning them to new hires.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [
      "Recording starts only after the tech accepts an on-screen consent step. Do not use Foreman to capture footage without the knowledge and consent of people on site.",
      "Misuse may result in access being revoked.",
    ],
  },
] as const;

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="lp-section" aria-labelledby="terms-title">
          <div className="lp-wrap lp-faq-wrap">
            <p className="lp-solution-kicker">Legal</p>
            <h1 id="terms-title" className="lp-section-title">
              Terms of service
            </h1>
            <p className="lp-section-lede">
              Pilot terms for solar maintenance crews using Foreman. Last updated{" "}
              {site.year}.
            </p>

            <div className="lp-legal-body">
              {SECTIONS.map((section) => (
                <section key={section.id} aria-labelledby={`${section.id}-heading`}>
                  <h2 id={`${section.id}-heading`} className="lp-legal-heading">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="lp-legal-paragraph">
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}

              <aside className="lp-legal-note" aria-label="Operator note">
                <p>
                  <strong>Operator note:</strong> Formal terms of service require legal
                  review before wider commercial use. Contact your Foreman operator for the
                  latest pilot agreement.
                </p>
              </aside>

              <p className="lp-legal-back">
                <Link href="/">← Back to Foreman</Link>
                {" · "}
                <Link href="/privacy">Privacy</Link>
              </p>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
