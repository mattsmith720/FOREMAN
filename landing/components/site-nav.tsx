import Link from "next/link";
import { BookDemo } from "./book-demo";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS } from "@/lib/nav";

export function SiteNav() {
  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-wrap lp-nav-inner">
        <Link href="/" className="lp-logo">
          Fore<span className="lp-logo-mark">man</span>
        </Link>
        <div className="lp-nav-links" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="lp-nav-link">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="lp-nav-actions">
          <BookDemo className="lp-nav-cta" />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
