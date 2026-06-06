<!-- orchestrate handoff
task: ready-and-logging
branch: orch/sre-platform/ready-and-logging
agentId: bc-51427672-a954-446f-889b-86ba694a0e9f
runId: run-c67f2dae-8cbf-4696-b39d-400e21c600cc
resultStatus: finished
finishedAt: 2026-06-06T02:42:32.934Z
-->

## Status
success

## Branch
`orch/sre-platform/ready-and-logging`

## What I did
- Added `backend/src/routes/ready.ts` with `registerReadyRoute(app)` and `/ready` response:
  - Required booleans: `ok`, `anthropic`, `openai`, `supabase`, `transcription`
  - `ok` is `anthropic && openai && supabase && transcription`
  - `elevenlabs` is conditionally included only when `ELEVENLABS_API_KEY` is present in env (set/unset behavior is consistent)
- Expanded `backend/src/config.ts` with readiness helpers and normalization:
  - Added `cleanEnv`, `isOpenAiConfigured`, `isSupabaseConfigured`, `isElevenLabsConfigured`
  - Kept and reused `isAnalysisConfigured` / `isTranscriptionConfigured` (with transcription delegating to OpenAI helper)
- Updated `backend/src/index.ts`:
  - Replaced inline `/ready` stub with `await registerReadyRoute(app)`
  - Kept `/health` as cheap liveness
  - Added production-aware logger config:
    - `NODE_ENV=production` => `{ level: "info" }` (structured JSON)
    - non-prod => pretty transport only if `pino-pretty` is resolvable, else `logger: true`
  - Added request correlation id behavior:
    - `genReqId: () => randomUUID()`
    - `onRequest` sets `x-request-id` response header from `request.id`
    - `onResponse` logs 5xx completions with `reqId`
    - `setErrorHandler` logs `{ reqId, err }` on 5xx via `request.log.error(..., "request failed")`

## Measurements
- `npm run build --workspace backend (exit code): 2 → 0`
- `cd backend && npm test (passing tests): 8 == 8`
- `curl /ready anthropic flag (ANTHROPIC_API_KEY unset → test): false → true`
- `curl -i /ready x-request-id header count: 0 → 1`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Verified local boot and readiness shape:
  - `PORT=8080 NODE_ENV=development npm run dev --workspace backend`
  - `curl -i -s http://127.0.0.1:8080/ready` returned HTTP 200 with `{"ok":false,"anthropic":false,"openai":false,"supabase":false,"transcription":false}` and `x-request-id` header.
- Verified env toggle behavior:
  - Started second server with `ANTHROPIC_API_KEY=test` on port 8081 and got `anthropic:true` in `/ready`.
- Verified request logging includes correlation id in Fastify structured logs (`reqId` present on incoming/completed request lines).
- Per your branch discipline, I did not merge/rebase/open PR.  
- Unrelated pre-existing workspace change remains unstaged: `package-lock.json`.

## Suggested follow-ups
- Add a focused backend test file for `/ready` route shape and `ok` truth-table combinations (including conditional `elevenlabs` field behavior).
- Add an integration test to assert `x-request-id` response header presence and error-path 5xx logging contract (e.g., via injected failing test route in test harness).