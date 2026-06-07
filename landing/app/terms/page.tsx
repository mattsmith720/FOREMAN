import Link from "next/link";

export const metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="lp-section" id="main">
      <div className="lp-wrap" style={{ maxWidth: "40rem" }}>
        <h1>Terms</h1>
        <p>
          Foreman is provided as a pilot service to qualified solar install crews. Use of the
          product does not constitute CER approval, certification, or endorsement of your STC
          claims.
        </p>
        <p>
          Crews remain responsible for the accuracy and completeness of evidence submitted to
          regulators and retailers.
        </p>
        <p>
          <strong>Operator note:</strong> Formal terms of service require legal review before
          wider commercial use.
        </p>
        <p>
          <Link href="/">← Back to Foreman</Link>
        </p>
      </div>
    </main>
  );
}
