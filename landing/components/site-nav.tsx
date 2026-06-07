import Link from "next/link";
import { BookDemo } from "./book-demo";
import { ForemanLogo } from "./foreman-logo";
import { MobileNav } from "./mobile-nav";
import { NAV_LINKS } from "@/lib/nav";

export function SiteNav() {
  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-wrap lp-nav-inner">
        <ForemanLogo />
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
