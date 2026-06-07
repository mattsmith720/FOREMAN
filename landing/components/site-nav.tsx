import Link from "next/link";
import { BookDemo } from "./book-demo";
import { MobileNav } from "./mobile-nav";
import { DEMO_URL } from "@/lib/config";

const LINKS = [
  { href: "#pain", label: "Problem" },
  { href: "#how-it-works", label: "Flow" },
  { href: "#solution", label: "Product" },
  { href: "#services", label: "Services" },
  { href: "#faq", label: "FAQ" },
] as const;

export function SiteNav() {
  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-wrap lp-nav-inner">
        <Link href="/" className="lp-logo">
          Fore<span className="lp-logo-mark">man</span>
        </Link>

        <div className="lp-nav-links">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="lp-nav-actions">
          <a href={DEMO_URL} className="lp-nav-demo">
            Demo
          </a>
          <BookDemo label="Book a demo" className="lp-nav-cta" />
        </div>

        <MobileNav />
      </div>
    </nav>
  );
}
