# DR4 — Per-surface redesign specs

All lanes consume `web/styles/tokens.css` — **never edit tokens**.

## VS1 — In-job camera-coach (owner: VS1)

**Files:** `camera-coach.tsx`, `coach-overlay.tsx`, `coach-scan-overlay.tsx`, `coach-annotations.tsx`, `capture-health.tsx`, related `globals.css` blocks

**Intent:** Sunlight-first. One dominant cue card. REC indicator readable at 1m. Orange accent on phase chip only (not severity). Glove targets on controls. Set `data-coaching-live="true"` on `.camera-app` when session active.

**Remove:** `backdrop-filter` on coach-card, sky-blue scan grid.

## VS2 — Pre-job / consent / summary

**Files:** boot screen classes, `session-summary.tsx`, consent copy

**Intent:** One-tap start — display type for title, accreditation field legible, summary sheet uses `fm-sheet`.

## VS3 — Review + labelling

**Files:** `post-job-review.tsx`

**Intent:** Van-test effortless — large tap rows, no `window.prompt`.

## VS4 — Guided capture

**Files:** `compliance-evidence-handler`, verdict cues, pack download UX

**Intent:** Shot prompt is the hero; stamped confirmation uses pass severity token.

## VS5 — /ops mission control

**Files:** `web/app/ops/page.tsx`, ops CSS

**Intent:** Dense tables → card stack below 480px; trendline sparkline; StatCard for headline metrics.

## VS6 — Blake dashboard

**Files:** `web/app/dashboard/page.tsx`

**Intent:** Buyer confidence — display numbers, orange accent on net upside only.

## VS7 — Demo + landing + ROI

**Files:** `welcome/page.tsx`, `demo-coach.tsx`, `roi-calculator.tsx`, marketing CSS

**Intent:** Expressive register — subtle asphalt texture, staged hero reveal (respect reduced motion).

## VS8 — Brand artifacts

**Files:** `evidence-report.ts`, `manifest.webmanifest`, favicon, PWA icons

**Intent:** PDF cover uses display font + orange rule; icons hi-vis on charcoal.
