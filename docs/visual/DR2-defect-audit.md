# DR2 — Existing defect audit

Findings from code review + prior UI fix pass (`59918f0`). Each item → surface lane owner.

| ID | Severity | Finding | File anchor | Lane |
|----|----------|---------|-------------|------|
| V-01 | P1 | Sky-blue accent reads "generic SaaS", fails Design Law | `globals.css` `--accent` was `#38bdf8` | VF1 ✓ |
| V-02 | P1 | System font stack — banned defaults | `globals.css` `font-family` | VF1 ✓ |
| V-03 | P1 | ~59 raw hex in `globals.css` outside tokens | `web/app/globals.css` | VS1–VS7 |
| V-04 | P2 | `coach-card-text` 3-line clamp may truncate long cues without ellipsis affordance | `.coach-card-text` | VS1 |
| V-05 | P2 | Warning banner z-index 11 vs controls 10 — OK but offline banner stacks with warning | `.warning-banner` | VS1 |
| V-06 | P2 | Marketing metrics duplicated "6 shots" on welcome (fixed in mega) | `welcome/page.tsx` | VS7 ✓ |
| V-07 | P2 | `viewport.maximumScale: 1` blocks text-zoom sweep in browser — harness uses Playwright zoom | `layout.tsx` | VF2 |
| V-08 | P3 | Scan overlay animations during live coaching — battery + distraction | `.coach-scan-sweep` | VS1 + `data-coaching-live` |
| V-09 | P3 | Inline hex in `coach-annotations.tsx` (7) | component | VS1 |
| V-10 | P3 | Ops tables dense on 360px — horizontal risk | `.ops-table` | VS5 |
| V-11 | P3 | Z-index ad-hoc (2,3,4,8,9,10,11,12) not tokenised | `globals.css` | VF1 partial |
| V-12 | P2 | `backdrop-filter` on coach-card — glassmorphism banned | `.coach-card` | VS1 |

**Orientation:** Portrait primary; landscape not supported on in-job camera — **lock portrait** via CSS `orientation` media query in VS1.
