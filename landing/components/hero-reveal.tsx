"use client";

import { useEffect } from "react";

export function HeroReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".lp-hero-stagger").forEach((el) => {
        el.classList.add("is-visible");
      });
      return;
    }
    const items = document.querySelectorAll(".lp-hero-stagger");
    items.forEach((el, i) => {
      window.setTimeout(() => el.classList.add("is-visible"), 80 * i);
    });
  }, []);

  return null;
}
