# DR1 — Surface + state inventory

**Aesthetic BEFORE:** Slate/blue SaaS dark (`#020617`, sky `#38bdf8`), system UI fonts, glassmorphism on coach card.

## In-job (`/` — `camera-coach.tsx`)

| State | DOM anchor | Screenshot baseline |
|-------|------------|---------------------|
| Pre-job boot | `.boot-screen` | `web/e2e/visual/baselines/boot-*.png` |
| Consent copy | `.consent-overlay` | same |
| Live coaching — info cue | `.coach-card` | VS1 |
| Live coaching — warning | `.coach-card.severity-warning` | VS1 |
| Live coaching — critical | `.coach-card.severity-critical` | VS1 |
| Paused | `.recording-indicator.paused` | VS1 |
| Recording | `.recording-indicator` (pulse) | VS1 |
| Scan mode overlay | `.coach-scan-overlay` | VS1 |
| Debug HUD | `.capture-health` (`?debug`) | VS1 |
| Offline queued | `.offline-queue-banner` | VS1 |
| Error / warning banners | `.error-banner`, `.warning-banner` | VS2 |
| Summarising | status pill "Summarising" | VS2 |
| Post-job summary | `.summary-panel` | VS2 |
| Review / labelling | `PostJobReview` in summary | VS3 |
| Controls footer | `.controls` | VS1 |

## Marketing / demo

| Surface | Route | States |
|---------|-------|--------|
| Landing | `/welcome` | hero, steps, metrics, ROI |
| Demo | `/demo` | idle, running scripted job, summary |
| ROI widget | `/welcome` `#roi-title` | empty + stress inputs |

## Ops / buyer

| Surface | Route | States |
|---------|-------|--------|
| Ops login | `/ops` | unauthenticated |
| Ops mission control | `/ops` | authed — jobs, trendline, errors, ingest |
| Blake dashboard | `/dashboard` | login + authed stats |
| Ingest | `/ingest` | upload form |

## HUD

| Surface | Route | Notes |
|---------|-------|-------|
| Glasses HUD | `/hud` | 600×600 display sim — VS1 extension |

## Baseline capture command

```bash
cd web && npm run test:e2e -- e2e/visual/boot-geometry.spec.ts --grep "visual baseline" --update-snapshots
```
