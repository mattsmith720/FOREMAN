import Link from "next/link";
import { site } from "@/lib/site";

const PRODUCT_LINKS = [
  { href: "/#pain", label: "The problem" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#services", label: "Services" },
  { href: "/#faq", label: "FAQ" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-inner lp-footer-inner--multi">
        <div className="lp-footer-brand">
          <Link href="/" className="lp-logo lp-logo--footer">
            Fore<span className="lp-logo-mark">man</span>
          </Link>
          <p className="lp-footer-tagline">{site.tagline}</p>
        </div>

        <nav className="lp-footer-col" aria-label="Product">
          <p className="lp-footer-col-title">Product</p>
          <ul className="lp-footer-links">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav className="lp-footer-col" aria-label="Legal">
          <p className="lp-footer-col-title">Legal</p>
          <ul className="lp-footer-links">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lp-footer-col lp-footer-app">
          <p className="lp-footer-col-title">Get started</p>
          <ul className="lp-footer-links">
            <li>
              <a href={site.appUrl}>Open the app</a>
            </li>
            <li>
              <a href={`${site.appUrl}/training`}>Training modules</a>
            </li>
            <li>
              <Link href="/#book">Book a demo</Link>
            </li>
          </ul>
        </div>

        <div className="lp-footer-bottom">
          <p>
            © {site.year} {site.name} · A {site.company} product · {site.location}
          </p>
          <p className="lp-footer-fine">
            Consent-first recording · private training data
          </p>
        </div>
      </div>
    </footer>
  );
}
