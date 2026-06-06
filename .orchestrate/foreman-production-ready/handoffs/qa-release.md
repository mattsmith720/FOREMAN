<!-- orchestrate handoff
task: qa-release
branch: orch/qa-release/qa-release
agentId: bc-148267c7-6299-48db-b84b-1fc6cbebadfc
runId: run-d52d7646-a977-450a-936f-44ba30f33f63
resultStatus: finished
finishedAt: 2026-06-06T02:58:13.776Z
-->

Per the parent's instructions, I do not open a PR from this subtree. The deliverable branch `orch/qa-release/qa-release` has been pushed to origin and is ready for the parent CTO planner.

## Status
success

## Branch
`orch/qa-release/qa-release`

## What my subtree did
- Authored `scripts/smoke-e2e.sh` (executable, `set -euo pipefail`, ~237 lines) plus `scripts/smoke-fixtures/tiny.wav`. Walks `POST /sessions/start` → `POST /analyse` → `POST /transcribe` → `POST /sessions/:id/stop` with `x-foreman-api-key`/`x-session-token`, reads `BASE_URL` (default `http://127.0.0.1:8080`) and `FOREMAN_API_KEY`, treats `/analyse` and `/transcribe` 503 with the documented "key is not set" body as `CONFIGURED_PASS`, exits non-zero on any real failure, and prints a per-step + overall summary via a trap (so the summary lands even on early exit).
- Confirmed `cd backend && npm test` (8/8 pass) and `cd web && npm test` (2/2 pass) on the deliverable branch; no test or production source edits were needed to get there.
- Wired `"smoke": "bash scripts/smoke-e2e.sh"` into the root `package.json` and appended a one-paragraph `## Release smoke` section to `DEPLOY.md` naming `scripts/smoke-e2e.sh`, `npm run smoke`, `BASE_URL`, `FOREMAN_API_KEY`, copy-pasteable local + production examples, and the non-zero-on-failure contract (safe for CI).
- Consolidated everything onto `orch/qa-release/qa-release` via an explicit merge worker (commit `9875f73`, two parents `c3a3433` release-recipe + `e4b3452` test-suite-green). Re-ran on the merged branch: `npm install` clean, `npm run build` clean (all routes built, middleware ok), backend tests green, web tests green, `FOREMAN_API_KEY= npm run smoke` → exit `2` with explicit missing-key error.
- A dedicated verifier (`verify-qa-release`) independently re-ran every step on the merged branch and returned `unit-test-verified`, with command-level evidence for each of the four parent acceptance bullets.

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- All four parent acceptance criteria are met on `orch/qa-release/qa-release`: smoke exits non-zero on failure (observed exits `2`/`1`/`1` across three failure modes), `npm run build` clean, backend `# tests 8 # pass 8 # fail 0`, web `# tests 2 # pass 2 # fail 0`, `package.json scripts.smoke` present, `DEPLOY.md` "## Release smoke" present.
- The merge worker self-reported `Status: blocked` only because it could not exit `0` on the local green-path smoke: `/sessions/start` returns `HTTP 503: Supabase is not configured` in the cloud-agent VM (no `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`). The verifier independently confirmed via backend logs that the smoke script DID reach `POST /sessions/start` with the correct headers/body — i.e. the wiring contract is met; only the green-path was env-blocked exactly as the documented gotcha predicted. I treat this slice as success per the plan's "treat the contract test as the primary signal" rule.
- One small enhancement worth picking up: extend `scripts/smoke-e2e.sh` to treat `/sessions/start` HTTP 503 with body `Supabase is not configured` as `CONFIGURED_PASS` (mirroring the existing analyse/transcribe handling). That would let CI without Supabase produce a clean exit `0` end-to-end and tighten the merge-worker acceptance, but it intentionally was NOT done in this slice because the original scopedGoal said "Do NOT add a silent fallback that treats /sessions/start 503 as success" — flipping that decision is a parent-level call.
- Workers + verifier all stayed inside the model whitelist (`gpt-5.3-codex-high-fast` for code workers, `composer-2-fast` for the bounded recipe worker, `claude-opus-4-7` for the verifier). No `invalid_model` failures.
- Subplanner bookkeeping branch is `cursor/qa-release-subplan-adfc` (carries `.orchestrate/qa-release/plan.json`, `state.json`, `handoffs/*`, and per-task status commits). The deliverable branch above is the one to merge upward; the bookkeeping branch is informational only.
- No PR was opened from this subtree, per parent's instruction.

## Suggested follow-ups
- Merge `orch/qa-release/qa-release` into the CTO's aggregation branch. The branch is mergeable cleanly into `main` as of the merge SHA `9875f73`.
- Add an optional `CONFIGURED_PASS` branch in `scripts/smoke-e2e.sh` for `/sessions/start` HTTP 503 with `Supabase is not configured`, mirroring the existing analyse/transcribe configured-pass logic, so CI without Supabase exits `0`.
- Wire `npm run smoke` into CI as a post-deploy gate (`BASE_URL=https://foreman-phi.vercel.app/api FOREMAN_API_KEY=$FOREMAN_API_KEY npm run smoke`) — DEPLOY.md already documents the recipe.
- Commit the lockfile drift surfaced during verifier `npm install` (one new transitive package) in a separate hygiene PR if the parent wants a fully clean working tree.