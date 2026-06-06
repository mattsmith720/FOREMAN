<!-- orchestrate handoff
task: verify-sre-platform
branch: `orch/sre-platform/health-and-deploy-docs` (verifier note committed as `32cc474` on top of target tip `c024b57`; no target source touched)
agentId: bc-e2b566e9-dba2-4271-a384-f12c3e6dabb1
runId: run-72eb06a6-e9df-4b4e-a6ec-ce5194014067
resultStatus: finished
finishedAt: 2026-06-06T03:04:52.070Z
-->

Verifier handoff:

## Verification
unit-test-verified

## Target
`health-and-deploy-docs` on branch `orch/sre-platform/health-and-deploy-docs`

## Branch
`orch/sre-platform/health-and-deploy-docs` (verifier note committed as `32cc474` on top of target tip `c024b57`; no target source touched)

## Execution
- `npm install` at repo root → clean (`postinstall` ran `build:shared`).
- `npm run build --workspace backend` → exit 0, no diagnostics.
- `cd backend && npm test` → `# tests 8 / # pass 8 / # fail 0`.
- `bash -n scripts/check-ready.sh` → syntax OK; `bash scripts/check-ready.sh` end-to-end → no bash structural errors. Exit 1 only because legacy `.env` keys missing.
- Recreated upstream verifier’s temp `backend/.env` (then removed): readiness script printed the new `Local /ready breakdown` block — `x-request-id: …` then `✗ anthropic/openai/supabase/transcription not configured` and `○ /ready ok=false`. Production lines: `✓ https://foreman-phi.vercel.app/api/health` and `✓ https://foreman-api-y31r.onrender.com/health`.
- Booted backend in `tsx watch` dev mode: `GET /health` → 200 with `x-request-id`; `GET /ready` → `{"ok":false,"anthropic":false,"openai":false,"supabase":false,"transcription":false}`; oversized 5 MiB base64 `POST /analyse` → HTTP 413 with `Image payload exceeds ANALYSE_FRAME_MAX_BYTES (4194304 bytes)` (handler not entered); tiny `POST /analyse` → HTTP 503 producing a `level:50` JSON log line `request completed with server error` tagged with `reqId`.
- Booted built `dist/` in `NODE_ENV=production` with `FOREMAN_API_KEY`, `SESSION_TOKEN_SECRET`, `CORS_ORIGINS=https://foreman-phi.vercel.app` (passed `assertProductionSecurity`). Captured 13 stdout lines; all 13 parsed by `python3 -c 'import json,sys; json.loads(...)'`. Re-reproduced the 413 path and the 5xx → `level:50` error log with `reqId`.
- Effective rate-limit headers observed at runtime: `/analyse` `x-ratelimit-limit: 30`, `/transcribe` `20`, `/voice/config` `60`, `/health` `120` — matches DEPLOY.md caps.
- Independent live curls: `curl https://foreman-phi.vercel.app/api/health` → HTTP 200 `{"status":"ok"}` in 0.37s; `curl https://foreman-api-y31r.onrender.com/health` → HTTP 200 `{"status":"ok"}` in 0.23s (no cold start observed).
- Diff vs `main`: only `backend/src/{config,index,routes/ready}.ts`, `DEPLOY.md`, `render.yaml`, `scripts/check-ready.sh` (+ pre-existing `package-lock.json` churn; reverted). No forbidden paths touched.

## Findings
Per target `acceptanceCriteria`:
- [x] `scripts/check-ready.sh` parses /ready new shape (`anthropic`/`openai`/`supabase`/`transcription` + optional `elevenlabs`) and surfaces `x-request-id`: confirmed via the captured `Local /ready breakdown` block printing `x-request-id: 51bbdafe-…` followed by per-key red lines. **met**
- [x] Script runs end-to-end without bash structural errors; missing local keys flagged (red, per existing behaviour) and missing prod health would be hard red; here Vercel + Render both green ✓: ran cleanly, exit 1 came only from legacy `.env` check. **met**
- [x] `render.yaml` retains `healthCheckPath: /health` with liveness/feature-availability comment: line 15 comment + line 16 path. **met**
- [x] DEPLOY.md adds `## Reading production logs` covering Render Dashboard/CLI, Vercel Dashboard/CLI, and `x-request-id` grep recipe: found at line 149. **met**
- [x] No `web/vercel.json` probe + DEPLOY.md explains why: `web/vercel.json` has only `installCommand`/`buildCommand`/`framework`; DEPLOY.md line 13 documents Vercel platform-health is implicit. **met**
- [x] `npm run build --workspace backend` clean: exit 0, no output. **met**
- [x] `cd backend && npm test` passes: 8/8. **met**
- [x] `SECURITY.md` / `README.md` / `PHONE_DEMO.md` / `YOUR_ACTIONS.md` not modified (also `PHONE_READY.md` untouched per upstream intent): git diff confirms. **met**

Parent SRE acceptance bullets called out in the verifier prompt:
- [x] (a) `/ready` returns new boolean shape on locally booted backend — confirmed dev + prod mode. **met**
- [x] (b) Fastify logs are structured JSON in `NODE_ENV=production` — confirmed by parsing 13/13 captured stdout lines as JSON. **met**
- [x] (c) 5xx response produces an error-handler log line tagged with `reqId` — confirmed: forcing `/analyse` 503 yielded `{"level":50,…"reqId":"3d6968dd-…","statusCode":503,"msg":"request completed with server error"}` (same `reqId` matches the `x-request-id` header echoed to the client). **met**
- [x] (d) `/analyse` oversized payload returns 413 before handler — 5 MiB base64 returned HTTP 413 with explicit `ANALYSE_FRAME_MAX_BYTES` error; no Claude/analyse code path entered. **met**
- [x] (e) Per-route rate-limit caps documented numerically in DEPLOY.md — 120/30/20/60 per route, matches observed `x-ratelimit-limit` headers. **met**
- [x] (f) `## Cost guards and billing alerts` (line 126) and `## Reading production logs` (line 149) present in DEPLOY.md. **met**
- [x] (g) `render.yaml` `healthCheckPath: /health` with new comment. **met**
- [x] (h) `bash scripts/check-ready.sh` runs without bash structural errors. **met**

Other findings (severity-ordered):
- (low) `backend/src/index.ts` `onResponse` 5xx log call passes `{ reqId: request.id, … }` while pino already auto-binds `reqId` to the child logger, producing a duplicate `reqId` key in the JSON line (e.g. `…"reqId":"3d…","reqId":"3d…",…`). Still valid JSON (last key wins) and parses fine; cosmetic dedupe opportunity only.
- (low) `/ready` requires the API key when `FOREMAN_API_KEY` is set, so external uptime probes can’t hit `/ready` directly — `/health` covers liveness, which is the intended split, but operators should know this. Upstream already flagged this as a follow-up (`isPublicPath` extension).
- (low) `package-lock.json` shows an unrelated `libc` field drop the moment `npm install` runs in this environment; matches upstream verifier note and was not introduced by this subtree (reverted before commit).

## Notes & suggestions
- Target branch is genuinely production-shaped: build clean, tests green, prod-mode JSON logs verified, 413 cap enforced pre-handler, /ready boolean breakdown reproduced via the script, both prod health URLs returning 200. Safe to integrate.
- Suggested follow-up for the planner: have the SRE engineer optionally add `/ready` to `isPublicPath()` so external probes / uptime checks can read feature availability without an operator key, and deduplicate the `reqId` field in the `onResponse` 5xx log payload. Both are cosmetic and out of scope for this worker.
- Verifier artifact committed to the branch for traceability: `.orchestrate/verifier-health-and-deploy-docs.md` (commit `32cc474`). No source files modified.