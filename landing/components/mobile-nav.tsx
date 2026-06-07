"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { BookDemo } from "./book-demo";
import { DEMO_URL } from "@/lib/config";

const LINKS = [
  { href: "#pain", label: "Problem" },
  { href: "#how-it-works", label: "Flow" },
  { href: "#solution", label: "Product" },
  { href: "#services", label: "Services" },
  { href: "#faq", label: "FAQ" },
] as const;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div className="lp-mobile-nav">
      <button
        type="button"
        className="lp-mobile-nav-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lp-mobile-nav-icon" aria-hidden="true">
          <span data-open={open} />
          <span data-open={open} />
          <span data-open={open} />
        </span>
      </button>

      {open && (
        <div className="lp-mobile-nav-scrim" onClick={close} aria-hidden="true" />
      )}

      <div
        id={panelId}
        className="lp-mobile-nav-panel"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!open}
      >
        <nav aria-label="Mobile">
          <ul className="lp-mobile-nav-links">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={close}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="lp-mobile-nav-actions">
            <a href={DEMO_URL} className="lp-mobile-nav-demo" onClick={close}>
              Watch demo
            </a>
            <div onClick={close}>
              <BookDemo label="Book a demo" className="lp-mobile-nav-cta" />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
