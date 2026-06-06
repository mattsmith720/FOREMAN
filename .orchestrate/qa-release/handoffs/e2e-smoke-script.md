<!-- orchestrate handoff
task: e2e-smoke-script
branch: orch/qa-release/e2e-smoke-script
agentId: bc-06515bf6-ec32-4595-84fd-6c3f135eddfd
runId: run-434e8936-3832-46a4-9c19-a0221d746344
resultStatus: finished
finishedAt: 2026-06-06T02:45:39.327Z
-->

## Status
success

## Branch
`orch/qa-release/e2e-smoke-script`

## What I did
- Added `scripts/smoke-e2e.sh` (executable, `set -euo pipefail`) that:
  - reads `BASE_URL` (default `http://127.0.0.1:8080`) and `FOREMAN_API_KEY`,
  - hard-fails with clear message when `FOREMAN_API_KEY` is empty,
  - runs endpoints in order with `>> request:` logs:
    - `POST /sessions/start` (requires HTTP 201; extracts `session.id` and top-level `token`),
    - `POST /analyse` with `x-session-token`, built-in tiny JPEG data URL, and `sessionId`,
    - `POST /transcribe` with `x-session-token`, WAV data URL, and `sessionId`,
    - `POST /sessions/:id/stop` with API key + session token (requires HTTP 200),
  - treats `/analyse` HTTP 503 + `ANTHROPIC_API_KEY is not set` as `CONFIGURED_PASS`,
  - treats `/transcribe` HTTP 503 + `OPENAI_API_KEY is not set` as `CONFIGURED_PASS`,
  - treats all other disallowed statuses as failure,
  - always prints a concise per-step summary + overall verdict via `trap` even on early exit.
- Added `scripts/smoke-fixtures/tiny.wav` (364 bytes) and wired the script to base64-encode it via python3 into a `data:audio/wav;base64,...` payload.
- Ran the script in required verification modes and captured observed exit codes/output.

## Measurements
- `LOC(scripts/smoke-e2e.sh): 0 → 237`
- `size(scripts/smoke-fixtures/tiny.wav): 0 B → 364 B`
- `smoke exit (BASE_URL=http://127.0.0.1:8091, FOREMAN_API_KEY=local-smoke): 0 == 0`
- `smoke exit (BASE_URL=http://127.0.0.1:8080, FOREMAN_API_KEY=local-smoke, no Supabase env): 1 == 1`
- `smoke exit (FOREMAN_API_KEY empty): 2 == 2`
- `smoke exit (BASE_URL=http://127.0.0.1:9999, FOREMAN_API_KEY=local-smoke): 1 == 1`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Real local backend run at `:8080` failed at `/sessions/start` with expected hard failure because Supabase was not configured locally:
  - `sessions/start: FAIL - HTTP 503: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
  - `overall: FAIL`
  - observed exit code: `1`
- To prove green-path behavior (required exit `0`) with correct route shape, I also ran against a local booted stub backend at `:8091` that returned:
  - `/sessions/start` 201 + `{ session.id, token }`,
  - `/analyse` 503 with `ANTHROPIC_API_KEY is not set`,
  - `/transcribe` 503 with `OPENAI_API_KEY is not set`,
  - `/sessions/:id/stop` 200.
  Output snippet:
  - `sessions/start: PASS - HTTP 201`
  - `analyse: CONFIGURED_PASS - HTTP 503: ANTHROPIC_API_KEY is not set`
  - `transcribe: CONFIGURED_PASS - HTTP 503: OPENAI_API_KEY is not set`
  - `sessions/stop: PASS - HTTP 200`
  - `overall: PASS`
  - observed exit code: `0`
- Unrelated pre-existing working tree change remains untouched: `package-lock.json` modified.

## Suggested follow-ups
- Run `scripts/smoke-e2e.sh` against a fully configured local/backend env (with Supabase set) to confirm the same pass path without the stub backend.
- If desired, add this script to CI as a post-deploy smoke gate using environment-provided `BASE_URL` + `FOREMAN_API_KEY`.