# Mega Programs A–D — Claimed vs Verified (final)

**Integration SHA:** post–Mega wave 2 merge on `main`  
**Trust audit baseline:** `docs/swarm/TRUST_AUDIT.md`  
**Queue discipline:** Factory Programs E–H **QUEUED** until Mega backlog lanes below are closed or explicitly waived by operator.

## Program A — Prove it (CLOSED ✓)

| Lane | Claim | Status | Metric |
|------|-------|--------|--------|
| A1 | CER fixture library | **VERIFIED** | 10 JPEG pairs + `manifest.json` |
| A2 | Playwright E2E scaffold | **VERIFIED** | 1 consent-boot spec + `e2e.yml` |
| A3 | Pack validator CLI | **VERIFIED** | `npm run validate-pack` + 6 tests |
| A4 | Vision eval at scale | **VERIFIED** | **11/11** scenarios offline; **58/60** rubric (97%) |
| A5 | API bench | **VERIFIED** | `npm run bench` + `BENCH.md` |

**Trendline:** eval coverage **6/11 → 11/11** after A4 goldens.

## Program B — Pilot-grade (PARTIAL)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| B1 | Offline-first capture | **PARTIAL** | `offline-queue.ts` + `offline-sync.ts` merged; integrator wiring pending (`B1_OFFLINE_HANDOFF.md`) |
| B2 | Installer + crew model | **NOT STARTED** | Migration files only — Mega backlog |
| B3 | Blake's dashboard | **NOT STARTED** | Mega backlog |
| B4 | Professional PDF pack | **NOT STARTED** | Mega backlog (audit: PDF was FALSE in S2) |
| B5 | Performance budget | **NOT STARTED** | Mega backlog |

## Program C — Sell it (PARTIAL)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| C1 | Self-running demo | **VERIFIED** | `/demo` one-tap scripted job |
| C2 | Landing page | **VERIFIED** | `/welcome` marketing page |
| C3 | ROI calculator | **NOT STARTED** | Mega backlog |
| C4 | Pitch kit | **VERIFIED** | `PITCH_KIT.md` + `DEMO_SCRIPT_5MIN.md` |

## Program D — Operate it (PARTIAL)

| Lane | Claim | Status | Notes |
|------|-------|--------|-------|
| D1 | Structured observability | **PARTIAL** | Backend structured logs merged; web proxy wiring pending |
| D2 | /ops maturity | **NOT STARTED** | Mega backlog |
| D3 | Security hardening sweep | **NOT STARTED** | Mega backlog |
| D4 | Data safety routine | **VERIFIED** | `scripts/backup-supabase.sh` + `.md` |

## Headline metrics (measured, post-Mega wave 2)

| Metric | Value | Direction |
|--------|------:|-----------|
| Backend tests | 79 | ↑ from 73 |
| Web tests | 65 | — |
| Eval scenarios scored | 11/11 (100%) | ↑ from 6/11 |
| Eval rubric pass (offline) | 58/60 (97%) | ↑ from 31/31 on 6 scenarios |
| Prod smoke | PASS | — |
| Guided compliance shots | 6 | — |

## Factory gate

| Program | Status |
|---------|--------|
| E Self-improving intelligence | **QUEUED** |
| F Rules as data | **QUEUED** |
| G True hands-free | **QUEUED** |
| H Ship like a company | **QUEUED** (H5 blocked on Mega B backlog per queue rule) |

**Operator-gated (unchanged):** migrations apply · OPS_PASSWORD · payments · external accounts · real job footage for live eval lineage.
