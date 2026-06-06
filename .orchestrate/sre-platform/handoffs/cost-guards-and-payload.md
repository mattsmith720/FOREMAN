<!-- orchestrate handoff
task: cost-guards-and-payload
branch: orch/sre-platform/cost-guards-and-payload
agentId: bc-87c65633-30a2-4b02-8253-5bf02dd837e6
runId: run-fd3c4873-4942-4268-b925-d0fc0e79c3a2
resultStatus: finished
finishedAt: 2026-06-06T02:45:30.030Z
-->

## Status
success

## Branch
`orch/sre-platform/cost-guards-and-payload`

## What I did
- Added centralized cost guards in `backend/src/index.ts` without editing any forbidden route files:
  - Added an `onRoute` hook that overrides per-route rate limits to:
    - `/analyse`: 30/min/IP
    - `/transcribe`: 20/min/IP
    - `/voice` and `/voice/*`: 60/min/IP
  - Kept the existing global default rate-limit (`120/min/IP`) as baseline.
- Added a server-side `/analyse` frame-size guard in `backend/src/index.ts` via global `preValidation`:
  - For `POST /analyse` JSON bodies only, if `image` is a data URL and its base64 payload exceeds cap, returns `413` before handler execution.
- Added `getAnalyseFrameByteCap()` in `backend/src/config.ts`:
  - Reads `ANALYSE_FRAME_MAX_BYTES`
  - Defaults to `4 * 1024 * 1024` (4194304 bytes)
  - Falls back to default for invalid/non-positive values.
- Updated `DEPLOY.md` with new `## Cost guards and billing alerts` section:
  - Documents numeric per-route caps.
  - Documents `ANALYSE_FRAME_MAX_BYTES` cap and 413 behavior.
  - Documents manual operator billing-alert recipes for Anthropic and OpenAI limits pages.
  - Explicitly notes SECURITY.md mirroring is handled separately.

## Measurements
- `npm run build --workspace backend (exit code): 0 == 0`
- `cd backend && npm test (passing tests): 8 == 8`
- `POST /analyse oversized data-url HTTP status: 413 == 413`
- `/analyse burst (35 requests, isolated IP) status counts: 5x429 == 5x429`
- `/transcribe burst (25 requests, isolated IP) status counts: 5x429 == 5x429`
- `/voice/speak burst (65 requests, isolated IP) status counts: 5x429 == 5x429`
- `SECURITY.md changed files in branch diff: 0 == 0`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Did not modify any forbidden files; branch diff from `orch/sre-platform/ready-and-logging` contains only:
  - `backend/src/index.ts`
  - `backend/src/config.ts`
  - `DEPLOY.md`
- A pre-existing unstaged workspace change (`package-lock.json`) remains untouched.
- Backend test server was launched for verification and left running in tmux session `backend-cost-guards` per environment guidance.

## Suggested follow-ups
- Add backend integration tests that assert:
  - central `onRoute` rate-limit overrides are applied for `/analyse`, `/transcribe`, `/voice/*`
  - oversized `/analyse` data-URL returns `413` pre-handler
- Add a targeted regression test proving `/voice/*` override behavior remains 60/min even if individual voice routes define different local limits.