import Link from "next/link";
import { BookDemo } from "./book-demo";

export function SiteNav() {
  return (
    <nav className="lp-nav" aria-label="Primary">
      <div className="lp-wrap lp-nav-inner">
        <Link href="/" className="lp-logo">
          Foreman
        </Link>
        <BookDemo label="Book a demo" primary={false} className="lp-nav-cta" />
      </div>
    </nav>
  );
}
