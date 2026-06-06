<!-- orchestrate handoff
task: sre-platform
branch: orch/sre-platform/health-and-deploy-docs
agentId: bc-7c1837f2-3344-4cad-bcd2-a2142f8498fe
runId: run-b441a5e9-1a3b-4e8f-bed0-3d66d8fcadad
resultStatus: finished
finishedAt: 2026-06-06T03:09:22.982Z
-->

## Status
success

## Branch
`orch/sre-platform/health-and-deploy-docs`

## What my subtree did
- **`ready-and-logging`** (W1) — Created `backend/src/routes/ready.ts` returning `{ ok, anthropic, openai, supabase, transcription }` (+ conditional `elevenlabs`). Wired `registerReadyRoute(app)` from `backend/src/index.ts`. Switched Fastify logger to structured JSON in `NODE_ENV=production`. Per-request correlation id via `genReqId`, echoed in `x-request-id` response header, logged in `setErrorHandler`/`onResponse` for 5xx. Build clean, 8/8 tests pass.
- **`cost-guards-and-payload`** (W2, on top of W1) — Per-route rate-limit caps applied centrally via `onRoute` hook in `index.ts` without editing forbidden route files: `/analyse` 30/min, `/transcribe` 20/min, `/voice*` 60/min, global default 120/min. Server-side frame cap (`getAnalyseFrameByteCap()` reading `ANALYSE_FRAME_MAX_BYTES`, default 4 MiB) enforced via `preValidation` so oversized `/analyse` POSTs return 413 before the handler. Operator billing-alert recipe added as a new `## Cost guards and billing alerts` section in `DEPLOY.md`. SECURITY.md untouched (it's owned by a sibling — see Notes). Build clean, 8/8 tests, 413/429 behavior verified.
- **`health-and-deploy-docs`** (W3, on top of W2) — `scripts/check-ready.sh` now parses the new `/ready` shape (green/red/yellow per boolean) and surfaces `x-request-id`; added a hard production `/health` check against Render. `render.yaml` keeps `healthCheckPath: /health` with a comment explaining why `/ready` is feature-availability, not liveness. `DEPLOY.md` gained `## Reading production logs` covering Render Dashboard/CLI, Vercel Dashboard/CLI, and `grep -F <request-id>` against the new correlation id. No probe added to `web/vercel.json` (Vercel platform health is implicit; documented).
- **`verify-sre-platform`** — Independently re-ran the full recipe: `npm install`, `npm run build --workspace backend` (exit 0), `cd backend && npm test` (8/8), `bash scripts/check-ready.sh` (no structural errors), local dev + prod-mode boots, captured 13/13 JSON-parseable log lines in production mode, reproduced 413 oversized payload pre-handler, observed `x-ratelimit-limit` headers matching documented caps (30/20/60/120), and confirmed both `https://foreman-phi.vercel.app/api/health` and `https://foreman-api-y31r.onrender.com/health` returned HTTP 200 with no cold-start delay. All SRE acceptance bullets marked **met**.

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- **SECURITY.md was on my forbidden list.** The original suggested split said "billing-alert recipe documented in SECURITY.md/DEPLOY.md" but SECURITY.md is sibling-owned (CISO subtree per the parent's path table). I scoped the billing-alert recipe to `DEPLOY.md` only; the worker also noted in DEPLOY.md that mirroring this to SECURITY.md is owned separately. The parent (CTO/CEO) may want a sibling task to mirror the recipe into SECURITY.md.
- **Verifier-committed file outside my pathsAllowed.** The verifier wrote `.orchestrate/verifier-health-and-deploy-docs.md` to the deliverable branch (commit `32cc474`) for traceability. My subtree's pathsAllowed was `.orchestrate/sre-platform/**`, so this technically lives outside; it's a single ~markdown note with no functional impact. The parent can revert or move it if path discipline matters at integration time.
- **`/ready` requires the API key when `FOREMAN_API_KEY` is set.** External uptime probes can't hit `/ready` directly; `/health` is the public liveness probe (which is the intended split — render.yaml + the script use `/health`). If operators want unauthenticated feature-availability visibility, add `/ready` to `isPublicPath()` in `backend/src/auth.ts` (sibling-owned; flagged by the worker as a follow-up).
- **Cosmetic logger duplication.** The `onResponse` 5xx log passes `{ reqId, ... }` explicitly while pino's child logger already auto-binds `reqId`, producing a duplicated `reqId` key in JSON output. Valid JSON, just cosmetic.
- **`package-lock.json` shows pre-existing unstaged churn** (a libc field drop the moment `npm install` runs in this VM). Every worker and the verifier saw it; none committed it. Not introduced by this subtree.
- **Branch-naming reconciliation.** I had to fix `startingRef` once in plan/state.json: the orchestrate framework names branches `orch/<rootSlug>/<task>` (not `cursor/orch/...`), and worker-to-worker `dependsOn` does not auto-reconcile `startingRef` (only verifier-to-target does). Required a brief loop restart; the framework reattached cleanly via `recoverRunning`. Worth noting for future planners chaining workers serially.
- **Subtree was serialized into one aggregation branch** (W1 → W2 → W3 → verifier) so the deliverable is a single mergeable branch with no fan-in. That trades a bit of wall time for zero merge work at the parent.

## Suggested follow-ups
- Open a sibling task to mirror the `## Cost guards and billing alerts` section from `DEPLOY.md` into `SECURITY.md` (CISO scope).
- Optional small SRE task: extend `isPublicPath()` in `backend/src/auth.ts` to include `/ready` so external uptime probes get feature-availability visibility (sibling-owned path).
- Optional cosmetic SRE task: drop the explicit `reqId` from the `onResponse` 5xx log object since pino's child logger already binds it.
- Optional SRE task: add backend tests for the `/ready` truth-table, the 413 pre-handler frame cap, and the per-route rate-limit override behavior to lock in the regression surface.

Do not open a PR. Parent decides what to do with `orch/sre-platform/health-and-deploy-docs`.