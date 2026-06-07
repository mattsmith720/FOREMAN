# FOREMAN Swarm Board

**Orchestrator:** integrator-only `main` pushes  
**Production:** https://foreman-phi.vercel.app · API https://foreman-api-y31r.onrender.com  
**Current main:** post–trust-audit fixes (see `docs/swarm/TRUST_AUDIT.md`)

## Phase 0 — Trust audit (COMPLETE)

| Agent | Status | Verdict |
|-------|--------|---------|
| AU1 clean-room gate | done | VERIFIED post-fix (was FALSE: flaky web test + double metric) |
| AU2 S0–S1 DoD | done | S0 PARTIAL · S1 VERIFIED |
| AU3 S2 evidence pack | done | ZIP VERIFIED · PDF/serial/4-selfies FALSE |
| AU4 S3–S4 eval/export | done | eval PARTIAL (6/11) · export fixed |
| AU5 diff archaeology | done | P0 double-metric fixed |
| AU6 security | done | ZIP proxy fixed · see TRUST_AUDIT.md |
| AU7 prod truth | done | VERIFIED |
| AU8 claims table | done | `docs/swarm/TRUST_AUDIT.md` |

### Audit fix lanes (merged)

| Fix | Files |
|-----|-------|
| Single cue-metric POST | `frame-instrumentation.ts`, `camera-coach.tsx` |
| Hero = spokenCue | `coach-overlay.tsx` |
| Binary ZIP proxy | `evidence-pack/route.ts` |
| Ops export provenance | `backend/src/db/ops.ts` |
| Doc ZIP truth | `PILOT_HANDOFF.md`, `PHONE_DEMO.md`, `YOUR_ACTIONS.md` |
| Review notes retry | `web/lib/review.ts` |

**Gate:** build · web lint · backend 73 · web 65 · smoke PASS

## Phase 1 — Four programs (NEXT)

| Program | Lanes | Status |
|---------|-------|--------|
| **A — Prove it** | A1 fixtures · A2 Playwright E2E · A3 pack validator · A4 vision eval · A5 bench | queued |
| **B — Pilot-grade** | B1 offline-first · B2 crew model · B3 Blake dashboard · B4 PDF pack · B5 perf budget | queued |
| **C — Sell it** | C1 demo mode · C2 landing · C3 ROI calc · C4 pitch kit | queued |
| **D — Operate it** | D1 observability · D2 /ops maturity · D3 security sweep · D4 backup routine | queued |

## Prior swarm (L1–L10) — merged `37d5950`

All lanes merged. Test counts: **backend 73**, **web 65**.

## Operator-gated (never lane work)

Supabase migrations 2+3 · OPS_PASSWORD · GitHub SUPABASE_* · Local.xcconfig · iPhone UAT · hard spend caps · legal review · GUNNR STC format · Sentry/external accounts
