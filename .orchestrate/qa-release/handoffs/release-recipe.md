<!-- orchestrate handoff
task: release-recipe
branch: orch/qa-release/release-recipe
agentId: bc-e168e190-ee7d-4cd4-9a9c-ed9e96936bbf
runId: run-9f482f7c-51aa-4ae4-9004-faca428e75d5
resultStatus: finished
finishedAt: 2026-06-06T02:46:21.215Z
-->

## Status
success

## Branch
`orch/qa-release/release-recipe`

## What I did
- Added `"smoke": "bash scripts/smoke-e2e.sh"` to root `package.json` (after `check-ready`, other scripts unchanged).
- Appended a `## Release smoke` section to the end of `DEPLOY.md` (after Costs) with script path, env vars, local/production examples, and non-zero-on-failure note.
- Verified `npm run smoke` resolves to and executes `scripts/smoke-e2e.sh`.

## Measurements
- `package.json scripts.smoke`: absent → `bash scripts/smoke-e2e.sh`
- `DEPLOY.md ## Release smoke` headings: 0 → 1
- `npm run smoke (FOREMAN_API_KEY empty) exit code`: N/A → 2
- `grep '^## Release smoke' DEPLOY.md`: 0 matches → 1 match

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Upstream `scripts/smoke-e2e.sh` was present on `orch/qa-release/e2e-smoke-script`; no upstream-blocked flag needed.
- Local backend at `:8080` was not running during verification; smoke correctly reached the script and failed with exit `2` when `FOREMAN_API_KEY` was empty (expected missing-key behavior).
- `npm run smoke -- --help` shows the script is reachable (`> bash scripts/smoke-e2e.sh --help`) before the expected `FOREMAN_API_KEY is required` error.

## Suggested follow-ups
- Run `BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=$FOREMAN_API_KEY npm run smoke` against a fully configured local backend (Supabase + keys) to confirm green-path exit `0`.
- Wire `npm run smoke` into CI as a post-deploy gate with environment-provided `BASE_URL` and `FOREMAN_API_KEY`.