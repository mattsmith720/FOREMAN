import Link from "next/link";
import { PILOT_BADGE } from "@/lib/config";

export function TrustStrip() {
  return (
    <aside className="lp-trust-strip" aria-label="Trust and disclosures">
      <div className="lp-wrap lp-trust-inner">
        <span className="lp-trust-pilot">{PILOT_BADGE}</span>
        <span className="lp-trust-sep" aria-hidden="true">
          ·
        </span>
        <p className="lp-trust-disclaimer">
          Private pilot · consent-first recording
        </p>
        <span className="lp-trust-sep" aria-hidden="true">
          ·
        </span>
        <Link href="/privacy" className="lp-trust-link">
          Privacy
        </Link>
      </div>
    </aside>
  );
}
