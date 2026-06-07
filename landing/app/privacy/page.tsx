import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="lp-section" id="main">
      <div className="lp-wrap" style={{ maxWidth: "40rem" }}>
        <h1>Privacy</h1>
        <p>
          Foreman captures camera, microphone, and job context during install sessions.
          Recording starts only after the installer accepts an on-screen consent step.
        </p>
        <p>
          Footage and transcripts are treated as sensitive personal data. Access is limited to
          authorised crew leads and operators. Data is encrypted in transit and stored in
          access-controlled systems.
        </p>
        <p>
          <strong>Operator note:</strong> This page is a pilot summary. Formal privacy policy
          wording must be reviewed for Australian privacy rules before customer rollout.
        </p>
        <p>
          <Link href="/">← Back to Foreman</Link>
        </p>
      </div>
    </main>
  );
}
