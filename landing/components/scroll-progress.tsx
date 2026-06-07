"use client";

import { useEffect, useState } from "react";

function scrollPercent(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) {
    return 0;
  }
  return Math.min(100, (window.scrollY / max) * 100);
}

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReduceMotion(mq.matches);
    syncMotion();
    mq.addEventListener("change", syncMotion);

    const onScroll = () => setProgress(scrollPercent());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      mq.removeEventListener("change", syncMotion);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  if (reduceMotion) {
    return null;
  }

  return (
    <div
      className="lp-scroll-progress"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    >
      <div className="lp-scroll-progress-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}
