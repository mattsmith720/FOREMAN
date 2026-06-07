import Link from "next/link";
import { LandingFooter } from "@/components/landing-footer";
import { SiteNav } from "@/components/site-nav";
import { site } from "@/lib/site";

export const metadata = {
  title: "Privacy",
  description:
    "How Foreman handles camera, microphone, and job data during solar maintenance pilot sessions.",
};

const SECTIONS = [
  {
    id: "capture",
    title: "What we capture",
    paragraphs: [
      "During a maintenance visit, Foreman may record camera frames, microphone audio, and job context such as timestamps, location, job type, and crew identifiers.",
      "Recording starts only after the tech accepts an on-screen consent step. No capture occurs before that point.",
    ],
  },
  {
    id: "protection",
    title: "How we protect your data",
    paragraphs: [
      "Footage and transcripts are treated as sensitive personal and business data. Data is encrypted in transit and stored in access-controlled systems.",
      "Access is limited to authorised crew leads and operators involved in the pilot. We do not publish session media or make it publicly searchable.",
    ],
  },
  {
    id: "retention",
    title: "Retention and deletion",
    paragraphs: [
      "Session data is retained for the duration of the pilot so crews can review visit records, training modules, and coaching history.",
      "Deletion and export requests can be raised with your operator contact. Formal retention schedules will be published before wider rollout.",
    ],
  },
  {
    id: "rights",
    title: "Your rights",
    paragraphs: [
      "Field techs and crew leads may request access to session data held about them, or ask for corrections where job metadata is inaccurate.",
      "If you believe data has been handled incorrectly, contact your operator representative so we can investigate and respond.",
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="lp-section" aria-labelledby="privacy-title">
          <div className="lp-wrap lp-faq-wrap">
            <p className="lp-solution-kicker">Legal</p>
            <h1 id="privacy-title" className="lp-section-title">
              Privacy
            </h1>
            <p className="lp-section-lede">
              A plain-language summary of how Foreman handles sensitive job data during
              the maintenance pilot. Last updated {site.year}.
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
                  <strong>Operator note:</strong> This page is a pilot summary, not a
                  final privacy policy. Formal wording must be reviewed for Australian
                  privacy rules before customer rollout.
                </p>
              </aside>

              <p className="lp-legal-back">
                <Link href="/">← Back to Foreman</Link>
                {" · "}
                <Link href="/terms">Terms</Link>
              </p>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>
    </>
  );
}
