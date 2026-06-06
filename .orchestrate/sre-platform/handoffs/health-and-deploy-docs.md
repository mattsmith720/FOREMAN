<!-- orchestrate handoff
task: health-and-deploy-docs
branch: orch/sre-platform/health-and-deploy-docs
agentId: bc-6027e477-72c4-4f56-a60d-a9f58508561d
runId: run-ec380007-dc42-4a05-bf42-b5e5005e89e1
resultStatus: finished
finishedAt: 2026-06-06T02:58:19.353Z
-->

## Status
success

## Branch
`orch/sre-platform/health-and-deploy-docs`

## What I did
- **`scripts/check-ready.sh`**: Replaced raw `json.tool` dump with `print_ready_breakdown()` — fetches `/ready` with optional `x-foreman-api-key`, asserts `anthropic`, `openai`, `supabase`, `transcription` (and `elevenlabs` when configured in `.env`), prints green/red/yellow per boolean, surfaces `x-request-id`, and yellows on unreachable backend or parse errors without failing the script structurally. Added **Production (Render)** block hitting `https://foreman-api-y31r.onrender.com/health` (hard red on non-200).
- **`render.yaml`**: Kept `healthCheckPath: /health`; added comment that `/health` is liveness and `/ready` is feature-availability.
- **`DEPLOY.md`**: Noted Vercel has no `healthCheckPath` probe (platform checks are implicit). Added **`## Reading production logs`** covering Render Dashboard/CLI, Vercel Dashboard/CLI, and grepping by `x-request-id`.
- **`web/vercel.json`**: Unchanged (no probe to add). No root `vercel.json` exists.
- **`PHONE_READY.md`**: Left unchanged — `npm run check-ready` flow still accurate.

## Measurements
- `npm run build --workspace backend (exit code)`: n/a → 0
- `cd backend && npm test (passing tests)`: n/a → 8 == 8
- `bash scripts/check-ready.sh (bash structural errors)`: n/a → 0
- `bash scripts/check-ready.sh (exit code, local backend + .env + prod health)`: n/a → 0
- `curl https://foreman-phi.vercel.app/api/health (HTTP)`: n/a → 200
- `curl https://foreman-api-y31r.onrender.com/health (HTTP)`: n/a → 200
- `forbidden doc edits (SECURITY.md / README.md / PHONE_DEMO.md / YOUR_ACTIONS.md)`: n/a → 0

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- `/ready` requires `x-foreman-api-key` when `FOREMAN_API_KEY` is set; the script now passes the local key so the breakdown works in normal dev/prod-like setups. Without a key in dev (auth hook skipped), unauthenticated curl still works.
- Added Render `/health` production check (was missing on inherited branch); DoD expects Vercel + Render 200 for exit 0.
- `package-lock.json` had a pre-existing unstaged change — not committed.
- Test `.env` created locally for verification only; not committed.

## Suggested follow-ups
- Add `/ready` to `isPublicPath()` in `backend/src/auth.ts` if operators should probe readiness without an API key (separate auth decision).
- Extend `check-ready.sh` to optionally hit production Render `/ready` with operator-supplied key for full feature-availability visibility outside local dev.