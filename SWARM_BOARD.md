# FOREMAN Swarm Board

**Orchestrator worktree:** `foreman-swarm-24e6d6ec`  
**Integration branch:** `swarm/integration`  
**Baseline:** `970f25e` (S0–S2 already on main)  
**Capability:** Cursor `/worktree` — up to 8 parallel lane agents per wave

## Wave 0 — Seam cut (integrator)

| Status | Branch | SHA | Gate |
|--------|--------|-----|------|
| merged → main | `swarm/integration` | `8ed82c8` | green (build/lint/backend 60/web 40/smoke PASS) |

Extracted modules (disjoint lane ownership):
- `web/lib/frame-instrumentation.ts` → **L1**
- `web/lib/verdict-cue-delivery.ts` + `web/lib/pick-spoken-cue.ts` → **L2**
- `web/lib/compliance-evidence-handler.ts` + capture stack → **L3**
- `web/lib/compliance-pack.ts` (assembly/export) → **L4**
- `backend/eval/**` + `backend/scripts/eval-coaching.ts` → **L5** (new files only)
- `web/lib/phone-frame-source.ts` + sampling policy → **L6**
- `web/lib/review.ts` + `web/components/post-job-review.tsx` + ops dataset stats → **L7**
- `web/lib/retry.ts` + network paths → **L8**
- `native/ios/**` → **L9** (build-unverified)
- `web/app/globals.css` + docs → **L10**

**Integrator-only (CONTRACT REQUEST required):**
`shared/src/coaching.ts`, `package.json`, `package-lock.json`, `.github/**`, `render.yaml`, `web/app/api/**`, `backend/src/index.ts`, `backend/src/auth.ts`, `backend/src/routes/analyse.ts` (schema wire), `web/components/camera-coach.tsx` (thin shell only)

## Lane ownership map (WRITE)

| Lane | Sprint | Writable paths |
|------|--------|----------------|
| L1 instrument | S0 Δ | `backend/src/metrics.ts`, `backend/src/routes/metrics.ts`, `backend/src/routes/ops.ts`, `web/lib/cue-metrics.ts`, `web/lib/session-cost.ts`, `web/lib/frame-instrumentation.ts`, `web/components/capture-health.tsx`, `web/app/ops/page.tsx` |
| L2 defect-coach | S1 Δ | `backend/src/prompts/analysis-phases.ts`, `backend/src/prompts/analysis.ts`, `backend/fixtures/cer-*.json`, `backend/fixtures/coaching-solar-install.json`, `web/lib/pick-spoken-cue.ts`, `web/lib/verdict-cue-delivery.ts`, `backend/src/prompts/cer-fixtures.test.ts` |
| L3 capture | S2a | `web/lib/phone-frame-source.ts`, `web/lib/frame-sharpness.ts`, `web/lib/interaction-mode.ts`, `web/lib/compress-frame.ts`, `web/lib/stamp-frame.ts`, `web/lib/geolocation.ts`, `web/lib/compliance-evidence-handler.ts` |
| L4 pack | S2b | `web/lib/compliance-pack.ts`, `backend/src/db/persist-frame.ts`, `backend/src/routes/sessions.ts` (pack endpoint CR), `web/lib/evidence-pack.ts` (new) |
| L5 eval | S3 | `backend/eval/**`, `backend/scripts/eval-coaching.ts`, `.github/workflows/eval-coaching.yml` (new) |
| L6 efficiency | S3 | `web/lib/scene-change.ts` (new), `web/lib/session-spend-cap.ts` (new), `web/lib/phone-frame-source.ts` (sampling hooks only — **conflicts L3: serialise L6 after L3 merges**) |
| L7 data | S4 | `web/components/post-job-review.tsx`, `web/lib/review.ts`, `backend/src/routes/labels.ts`, `backend/src/db/ops.ts`, `web/app/ops/page.tsx` (dataset stats section) |
| L8 reliability | S5 | `web/lib/retry.ts`, `web/lib/phone-audio-source.ts`, `web/lib/analyse.ts`, `web/lib/api-fetch.ts`, `backend/src/api-error.ts` |
| L9 native-sync | S5 | `native/ios/**` |
| L10 polish | S5 | `web/app/globals.css`, `PILOT_HANDOFF.md`, `PHONE_DEMO.md`, `YOUR_ACTIONS.md`, `web/**/*.test.ts` (a11y) |

## Recon swarm (Phase A)

| Agent | Status | Notes |
|-------|--------|-------|
| R1–R10 | complete | See `docs/swarm/recon-summary.md` |

## Build lanes (Phase B)

| Lane | Status | Branch |
|------|--------|--------|
| L1 instrument | merged | `swarm/l1-instrument` |
| L2 defect-coach | merged | `swarm/l2-defect-coach` |
| L3 compliance | merged | `swarm/l3-compliance` |
| L4 evidence-pack | merged | `swarm/l4-evidence-pack` |
| L5 eval | merged | `swarm/l5-eval` |
| L6 efficiency | merged | `swarm/l6-efficiency` |
| L7 review | merged | `swarm/l7-review` |
| L8 reliability | merged | `swarm/l8-reliability` |
| L9 ios | merged | `swarm/l9-ios` |
| L10 polish | merged | `swarm/l10-polish` |

## Integration train (Phase C)

| Status | Branch | Notes |
|--------|--------|-------|
| integrating | `swarm/integrate-all` | L1→L10 merged + integrator CONTRACT |

## Operator-gated (never lane work)

Supabase migrations 2+3 · OPS_PASSWORD · GitHub SUPABASE_* · Local.xcconfig · iPhone UAT · spend caps · legal review · GUNNR STC format
