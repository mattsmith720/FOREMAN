# Field app truth audit (App A1)

**Date:** 2026-06-06  
**Prod:** https://foreman-phi.vercel.app

## Scope

Field app (`/`), ops (`/ops`), training (`/training`). Out of scope: landing, demo, welcome, dashboard.

## Boot

| Claim | Truth |
|-------|-------|
| Manual job type picker | ❌ Removed — one Start job tap; `job_type: auto` on session |
| Auto-detect job category | ✅ Backend `auto` analysis phase identifies task from camera |
| Consent on first visit | ✅ "I understand — start job" records consent once per device |
| Return visit | ✅ Button reads "Start job" |
| Optional worker name | ✅ Boot input, persisted via `worker-profile.ts` |
| Explicit phase picker (ingest) | ✅ `/ingest` still supports manual job type for uploads |

## Live session

| Claim | Truth |
|-------|-------|
| REC indicator | ✅ Top-left badge while live |
| Pause UI | ❌ Removed from footer; pause logic remains in code |
| End job | ✅ Single footer button |
| Maintenance idle hints | ✅ Phase-specific copy before first analyse |
| Coach overlay | ✅ Minimal mode — hero card only |

## Post-job

| Claim | Truth |
|-------|-------|
| Summary text | ✅ From `/sessions/:id/stop` |
| Quiet stats line | ✅ frames · coaching cues · voice clips |
| Generate training module | ✅ POST `/api/sessions/:id/training-module` from summary |
| Open in training | ✅ Link to `/training?session={id}` |

## Ops / training

| Claim | Truth |
|-------|-------|
| Ops session table | ✅ Recent jobs, export |
| Ops → training link | ✅ Per-row Training link with session query |
| Training pre-fill | ✅ `?session=` fills session id field |

## Tests

| Harness | Status |
|---------|--------|
| `web/e2e/golden-path.spec.ts` | Full mocked lifecycle |
| `web/e2e/visual/live-session-geometry.spec.ts` | Live layout @ 390px |
| `web/e2e/ops-training.spec.ts` | Ops + training smoke |
| `web/scripts/smoke-prod.sh` | Prod HTTP smoke |
