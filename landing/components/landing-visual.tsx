"use client";

import Image from "next/image";
import { useState } from "react";

/** Warm paper + subtle band — brand-aligned blur-up placeholder. */
const BRAND_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxMCI+PHJlY3QgZmlsbD0iI2Y1ZjFlYiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjEwIi8+PHJlY3QgZmlsbD0iI2ViZTVkYyIgeD0iMCIgeT0iNiIgd2lkdGg9IjE2IiBoZWlnaHQ9IjQiLz48cmVjdCBmaWxsPSIjZmY2YjAwIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTYiIGhlaWdodD0iMC41IiBvcGFjaXR5PSIwLjMiLz48L3N2Zz4=";

interface LandingVisualProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  /** Enable Next.js blur-up while the full asset loads. Default: true. */
  blurUp?: boolean;
  /** Override the default brand blur data URL. */
  blurDataURL?: string;
}

function InfographicIcon() {
  return (
    <svg
      className="lp-visual__icon"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="8"
        width="40"
        height="32"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="16" cy="22" r="4" fill="currentColor" opacity="0.35" />
      <path
        d="M26 20h14M26 26h10M26 32h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M12 32l6-6 4 4 8-10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VisualFallback({ alt, className }: { alt: string; className?: string }) {
  return (
    <div
      className={`lp-visual__fallback${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={alt}
    >
      <InfographicIcon />
      <p className="lp-visual__fallback-title">Infographic pending</p>
      <span className="lp-visual__fallback-caption">{alt}</span>
    </div>
  );
}

function VisualSkeleton() {
  return (
    <div className="lp-visual__skeleton" aria-hidden="true">
      <div className="lp-visual__skeleton-accent" />
      <div className="lp-visual__skeleton-blocks">
        <span className="lp-visual__skeleton-block lp-visual__skeleton-block--wide" />
        <span className="lp-visual__skeleton-block" />
        <span className="lp-visual__skeleton-block" />
        <span className="lp-visual__skeleton-block lp-visual__skeleton-block--tall" />
      </div>
      <div className="lp-visual__shimmer" />
    </div>
  );
}

export function LandingVisual({
  src,
  alt,
  width,
  height,
  className,
  priority,
  blurUp = true,
  blurDataURL,
}: LandingVisualProps) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const aspectRatio = `${width} / ${height}`;

  if (failed) {
    return <VisualFallback alt={alt} className={className} />;
  }

  const useBlur = blurUp && (blurDataURL ?? BRAND_BLUR_DATA_URL);

  return (
    <>
      <style>{`
        .lp-visual {
          position: relative;
          display: block;
          width: 100%;
          overflow: hidden;
          background: var(--bg-card, #fffefb);
        }

        .lp-visual__skeleton {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          background: var(--bg-subtle, #ebe5dc);
          pointer-events: none;
        }

        .lp-visual__skeleton-accent {
          flex-shrink: 0;
          height: 3px;
          background: var(--accent, #ff6b00);
          opacity: 0.45;
        }

        .lp-visual__skeleton-blocks {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          padding: 1.25rem 1.5rem 1.5rem;
        }

        .lp-visual__skeleton-block {
          display: block;
          border-radius: var(--radius-md, 0.75rem);
          background: rgb(26 26 30 / 0.06);
          min-height: 2.5rem;
        }

        .lp-visual__skeleton-block--wide {
          grid-column: 1 / -1;
          min-height: 1.25rem;
          max-width: 72%;
        }

        .lp-visual__skeleton-block--tall {
          grid-row: span 2;
          min-height: 5rem;
        }

        .lp-visual__shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 38%,
            rgb(255 255 255 / 0.55) 48%,
            rgb(255 255 255 / 0.35) 52%,
            transparent 62%
          );
          background-size: 200% 100%;
          animation: lp-visual-shimmer 1.6s ease-in-out infinite;
        }

        @keyframes lp-visual-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .lp-visual__img {
          display: block;
          width: 100%;
          height: auto;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .lp-visual__img--blur,
        .lp-visual__img--loaded {
          opacity: 1;
        }

        .lp-visual__fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          min-height: min(280px, 50vw);
          padding: 2rem 1.5rem;
          text-align: center;
          background: var(--bg-card, #fffefb);
          border: 1px solid var(--border-strong, rgb(26 26 30 / 0.18));
          border-top: 3px solid var(--accent, #ff6b00);
          border-radius: var(--radius-xl, 1.25rem);
          box-shadow: var(--shadow-card, 0 1px 0 rgb(26 26 30 / 0.04), 0 8px 32px rgb(26 26 30 / 0.06));
        }

        .lp-visual__icon {
          width: 2.75rem;
          height: 2.75rem;
          color: var(--accent, #ff6b00);
          opacity: 0.85;
        }

        .lp-visual__fallback-title {
          margin: 0;
          font-family: var(--font-display, Georgia, serif);
          font-size: 1rem;
          font-weight: 600;
          color: var(--text, #1a1a1e);
        }

        .lp-visual__fallback-caption {
          font-size: 0.8125rem;
          line-height: 1.45;
          color: var(--ink-faint, rgb(26 26 30 / 0.55));
          max-width: 32ch;
        }

        @media (prefers-reduced-motion: reduce) {
          .lp-visual__shimmer {
            animation: none;
            opacity: 0.25;
          }

          .lp-visual__img {
            transition: none;
          }
        }
      `}</style>

      <div className={`lp-visual${className ? ` ${className}` : ""}`} style={{ aspectRatio }}>
        {!loaded && <VisualSkeleton />}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`lp-visual__img${useBlur ? " lp-visual__img--blur" : ""}${loaded ? " lp-visual__img--loaded" : ""}`}
          priority={priority}
          placeholder={useBlur ? "blur" : "empty"}
          blurDataURL={useBlur ? (blurDataURL ?? BRAND_BLUR_DATA_URL) : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      </div>
    </>
  );
}
