# Phase 0 Trust Audit — Claims vs Verified

**Audit date:** 2026-06-07  
**Baseline commit (pre-audit):** `37d5950`  
**Auditors:** AU1–AU8 (parallel adversarial swarm)

## Executive summary

| Verdict | Count |
|---------|------:|
| VERIFIED | 18 |
| PARTIAL | 9 |
| FALSE | 6 |

**Post-audit fixes merged:** double cue-metric fire, hero≠spoken drift, ZIP binary proxy, ops export `label_source`, doc ZIP truth, flaky test tolerance, review notes retry.

## Claims table

| Claim | Status | Evidence |
|-------|--------|----------|
| Clean-room gate (build/lint/tests from lockfile) | **VERIFIED** (post-fix) | AU1: clone + `npm ci` + build + lint + backend 73 + web 65 |
| S0 cue latency + $/session HUD/ops | **PARTIAL** | Code wired; prod cost model `{"analyse_usd":0.015}`; ops latency `sampleCount` needs `OPS_PASSWORD` (operator-gated) |
| S1 scan mode + 5 CER spoken verdicts | **VERIFIED** | AU2: 5/5 fixtures + `pickSpokenCue` tests pass; spoken lines pasted in AU2 report |
| S2 six-shot guided capture + geo stamp | **VERIFIED** | `compliance-pack.ts` 6 shots; `stamp-frame.ts` burns overlay |
| S2 ZIP evidence pack | **VERIFIED** | `evidence-pack.ts` backend + client; 8 pack tests pass |
| S2 "4 attendance selfies" | **FALSE** | Code has 2 selfies (`setup`, `testing`) only — AU3 |
| S2 PDF deliverable | **FALSE** | No PDF generation in repo — AU3 |
| S2 serial check automation | **FALSE** | Photo capture + coaching prompt only; no REC/OCR — AU3 |
| Eval 100% coaching quality | **PARTIAL** | 31/31 on **6/11** scenarios (54.5%); 5 CER skipped — AU4 |
| CER eval coverage | **FALSE** | 0 frames, 0 goldens for CER scenarios — AU4 |
| Ops export `label_source` | **VERIFIED** (post-fix) | `getSessionExportRecords` selects provenance columns with migration fallback |
| Scene-change reduces API calls | **PARTIAL** | Gate implemented; no production skip counter — AU4 |
| Production deploys new code | **VERIFIED** | AU7: `geolocation=(self)`, cost-model proxy, smoke PASS |
| iOS model sync | **PARTIAL** | Swift models updated; **build-unverified** — AU5/L9 |
| Double cue E2E metric | **FALSE** (fixed) | AU5 P0: `frameInstrumentation` + `camera-coach` double POST — fixed in audit-fix |
| Hero spoken == shown | **FALSE** (fixed) | AU5: `collectCues` overrode `pickSpokenCue` — fixed in audit-fix |
| ZIP proxy corrupts binary | **FALSE** (fixed) | AU6: text proxy on evidence-pack — fixed to `proxyBinaryToBackend` |

## Operator-gated (not fixable in lane work)

- `OPS_PASSWORD` on Render → prod `/ops` latency readout
- Supabase migrations 2+3 → full `label_source` in prod export
- PDF report, serial REC check, 4-stage attendance selfies → **Program B scope** (B4/B2), not shipped in S2

## Metrics (measured)

| Metric | Value |
|--------|------:|
| Backend tests | 73 |
| Web tests | 65 |
| Eval scenarios scored | 6/11 (54.5%) |
| Eval rubric pass (scored) | 31/31 (100%) |
| Guided compliance shots | 6 |
| Prod smoke | PASS |
