import Link from "next/link";
import { ForemanLogo } from "./foreman-logo";
import { site } from "@/lib/site";

export function LandingFooter() {
  return (
    <footer className="lp-footer-v2">
      <div className="lp-wrap lp-footer-v2-inner">
        <ForemanLogo />
        <nav aria-label="Footer">
          <Link href="/#pipeline">How it works</Link>
          <Link href="/#capabilities">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </nav>
        <p className="lp-footer-v2-meta">
          © {site.year} {site.name} · {site.company} · {site.location}
        </p>
      </div>
    </footer>
  );
}
