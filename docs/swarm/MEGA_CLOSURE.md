# Mega Programs A–D — Claimed vs Verified (final)

**Integration SHA:** post–Mega wave 3 on `main`  
**Trust audit baseline:** `docs/swarm/TRUST_AUDIT.md`  
**Factory gate:** Programs E–H **OPEN** for recon-delta (Mega A–D closed).

## Program A — Prove it (CLOSED ✓)

| Lane | Claim | Status | Metric |
|------|-------|--------|--------|
| A1 | CER fixture library | **VERIFIED** | 10 JPEG pairs + `manifest.json` |
| A2 | Playwright E2E scaffold | **VERIFIED** | 1 consent-boot spec + `e2e.yml` |
| A3 | Pack validator CLI | **VERIFIED** | `npm run validate-pack` + 6 tests |
| A4 | Vision eval at scale | **VERIFIED** | **11/11** scenarios offline; **58/60** rubric (97%) |
| A5 | API bench | **VERIFIED** | `npm run bench` + `BENCH.md` |

## Program B — Pilot-grade (CLOSED ✓)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| B1 | Offline-first capture | **VERIFIED** | IndexedDB queue wired in `camera-coach.tsx` |
| B2 | Installer + crew model | **VERIFIED** | `crew-model.sql` + graceful session columns + accreditation on boot |
| B3 | Blake's dashboard | **VERIFIED** | `/dashboard` behind ops auth |
| B4 | Professional PDF pack | **VERIFIED** | `GET /sessions/:id/evidence-report.pdf` |
| B5 | Performance budget | **VERIFIED** | `lighthouse.yml` + `web/lighthouserc.cjs` (warn budget) |

## Program C — Sell it (CLOSED ✓)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| C1 | Self-running demo | **VERIFIED** | `/demo` |
| C2 | Landing page | **VERIFIED** | `/welcome` |
| C3 | ROI calculator | **VERIFIED** | Interactive widget on `/welcome` |
| C4 | Pitch kit | **VERIFIED** | `PITCH_KIT.md` + `DEMO_SCRIPT_5MIN.md` |

## Program D — Operate it (CLOSED ✓)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| D1 | Structured observability | **VERIFIED** | Backend hooks + web `api-fetch` error logs |
| D2 | /ops maturity | **VERIFIED** | Eval trendline, error feed, mission-control sections |
| D3 | Security hardening sweep | **VERIFIED** | `scripts/security-audit.sh` + existing `SECURITY.md` controls |
| D4 | Data safety routine | **VERIFIED** | `scripts/backup-supabase.sh` |

## Headline metrics (measured)

| Metric | Value | Direction |
|--------|------:|-----------|
| Backend tests | 79 | — |
| Web tests | 65 | — |
| Eval scenarios | 11/11 (100%) | ↑ from 6/11 |
| Eval rubric (offline) | 58/60 (97%) | ↑ |
| Prod smoke | PASS (last gate) | — |
| Guided compliance shots | 6 | — |

## Factory gate

| Program | Status |
|---------|--------|
| E Self-improving intelligence | **RECON** — see `docs/swarm/FACTORY_RECON.md` |
| F Rules as data | **QUEUED** |
| G True hands-free | **QUEUED** |
| H Ship like a company | **QUEUED** |

**Operator-gated (unchanged):** migration 4 apply · OPS_PASSWORD · payments · external accounts · real job footage for live eval lineage.
