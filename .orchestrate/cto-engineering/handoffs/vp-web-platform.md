<!-- orchestrate handoff
task: vp-web-platform
branch: orch/cto-engineering/vp-web-platform
agentId: bc-c12e05ce-1795-4647-9758-acc20a0b58c9
runId: run-9a8b8024-cb19-4322-9538-aa0941fca89d
resultStatus: finished
finishedAt: 2026-06-06T02:46:56.927Z
-->

## Status
success

## Branch
`orch/cto-engineering/vp-web-platform`

## What I did
- Hardened all `web/app/api/**/route.ts` proxy handlers (10/10 routes) to use explicit `try/catch` and return structured JSON errors via `Response.json({ ok: false, error }, { status })` by introducing/using `createProxyErrorResponse` from `web/lib/proxy-backend.ts`.
- Strengthened `web/lib/proxy-backend.ts` with:
  - bounded body reads (`maxBodyBytes`) and early 413 handling,
  - timeout-based aborts (`AbortController`) and request abort propagation,
  - normalized `ProxyError` status mapping,
  - strict proxy-path validation and backend URL validation,
  - shared options for timeout/body limits across JSON and binary proxy flows.
- Enforced same-origin client API invariant in `web/lib/api-url.ts` (absolute `NEXT_PUBLIC_API_URL` now falls back to `/api`), and updated `web/lib/api-fetch.ts` to use a new retry primitive.
- Added minimal retry helper `web/lib/retry.ts` (exponential backoff, 1 retry by default on retryable result/error), and wired usage through fetchers:
  - `web/lib/analyse.ts` (retry only when no `sessionId`),
  - `web/lib/transcribe.ts` (explicitly no retry for session-mutating POST),
  - `web/lib/sessions.ts` (no retry for start/stop POST, retry for GET session).
- Added targeted tests in allowed scope:
  - `web/lib/retry.test.ts` (retry and no-retry behavior),
  - `web/lib/proxy-route.test.ts` (proxy failure path returns structured JSON),
  - `web/lib/api-url.test.ts` (same-origin invariant).
- Committed and pushed to `origin/orch/cto-engineering/vp-web-platform` (no PR opened).

## Measurements
- `web/app/api route handlers with try/catch + structured proxy error path: 10 == 10`
- `analyse/transcribe/sessions fetcher modules using retry helper policy: 3 == 3`
- `npm run build --workspace web exit code: 0 == 0`
- `cd web && npm test passing: 7 == 7`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- `git diff --name-only main..HEAD` includes pre-existing orchestration files under `.orchestrate/cto-engineering/*` from earlier branch history; my code changes for this task are limited to allowed `web/**` paths.
- Local workspace still has a pre-existing unstaged `package-lock.json` modification unrelated to this task; it was not added to commits.
- No forbidden paths from your list were modified by my task commits.

## Suggested follow-ups
- Add one more route-level test for body-size rejection (413) on a proxy endpoint to lock in abuse-bound behavior.
- Add a small unit test around `apiFetch` retry policy by method (GET retries, POST defaults no retry) to prevent regressions in idempotency handling.