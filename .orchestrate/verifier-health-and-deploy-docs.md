# Verifier notes — `orch/sre-platform/health-and-deploy-docs`

Verified on commit `c024b57` (target branch tip). All checks below were executed
end-to-end against a locally booted backend and the live production endpoints.

## Repo state
- `git diff main --name-only` → `backend/src/config.ts`, `backend/src/index.ts`,
  `backend/src/routes/ready.ts`, `DEPLOY.md`, `package-lock.json`, `render.yaml`,
  `scripts/check-ready.sh`. No forbidden paths modified.
- `package-lock.json` shows an unrelated `libc` field drop (npm version churn),
  matching the upstream handoff note. Not introduced by this subtree.

## Build & tests
- `npm install` (repo root) → clean (`postinstall` ran `build:shared`).
- `npm run build --workspace backend` → exit 0, no diagnostics.
- `cd backend && npm test` → `# tests 8 / # pass 8 / # fail 0`.

## Live backend smoke
Booted backend in two modes; raw log lines + responses captured under `/tmp`.

### NODE_ENV=development (tsx watch)
- `curl -i /health` → 200, response has `x-request-id`.
- `curl -i /ready` → 200, body `{"ok":false,"anthropic":false,"openai":false,
  "supabase":false,"transcription":false}`.
- `POST /analyse` with 5 MiB base64 image → HTTP 413, body
  `{"error":"Image payload exceeds ANALYSE_FRAME_MAX_BYTES (4194304 bytes)"}`.
- `POST /analyse` with tiny image → HTTP 503 (`ANTHROPIC_API_KEY not set`).
  Backend stdout shows two log lines for that reqId — one `level:50` "request
  completed with server error" (carries `reqId`, `statusCode:503`), plus the
  normal access log. Confirms 5xx error path tags `reqId`.

### NODE_ENV=production (`npm start` on built `dist/`)
Started with `FOREMAN_API_KEY=test-verify-key`, `SESSION_TOKEN_SECRET`,
`CORS_ORIGINS=https://foreman-phi.vercel.app`. `assertProductionSecurity`
accepted those values.
- 13/13 stdout lines parsed as JSON via `python3 -c 'import json,sys; ...'`.
- Same 413 oversized-payload behaviour reproduced.
- 503 path still emits `level:50` JSON log with `reqId` and `statusCode:503`.
- Effective `x-ratelimit-limit` headers observed: `/analyse`=30, `/transcribe`=20,
  `/voice/config`=60, `/health`=120 — matches DEPLOY.md caps.

## Readiness script
- `bash -n scripts/check-ready.sh` → syntax OK.
- `bash scripts/check-ready.sh` (no `.env`) → ran end-to-end without bash
  structural errors. Exit 1 only because the legacy `.env` block flagged missing
  keys, not because of script-level breakage.
- With a temporary `backend/.env` containing
  `FOREMAN_API_KEY=test-verify-key` and a running prod-mode backend:
  - `Local /ready breakdown` block printed
    `x-request-id: …` then per-key
    `✗ anthropic not configured`, `✗ openai not configured`,
    `✗ supabase not configured`, `✗ transcription not configured`, and
    `○ /ready ok=false (one or more features unavailable)`.
  - `Production (Vercel) … /api/health` → green ✓ 200.
  - `Production (Render) … /health` → green ✓ 200.
- `.env` was created for verification only and deleted before commit (matches
  upstream verifier note; never committed).

## Live production probes (independent of script)
- `curl https://foreman-phi.vercel.app/api/health` → `HTTP 200`,
  body `{"status":"ok"}`, `time=0.37s`.
- `curl https://foreman-api-y31r.onrender.com/health` → `HTTP 200`,
  body `{"status":"ok"}`, `time=0.23s` (no cold start observed).

## Docs audit
- `DEPLOY.md` headings: includes `## Cost guards and billing alerts` (line 126)
  and `## Reading production logs` (line 149).
- Rate-limit caps documented numerically: global 120/min, /analyse 30/min,
  /transcribe 20/min, /voice/* 60/min.
- 413 behaviour documented: "If a `/analyse` request exceeds
  `ANALYSE_FRAME_MAX_BYTES`, the API returns `413 Payload Too Large` before the
  analyse handler runs."
- Vercel platform-health note present at line 13 explaining why no
  `healthCheckPath` is configured for Next.js on Vercel.
- `## Reading production logs` covers Render Dashboard + `render logs` CLI,
  Vercel Dashboard + `vercel logs` CLI, and the `x-request-id` grep recipe.

## render.yaml
- Line 15: `# /health = liveness (process up). /ready = feature availability …`
- Line 16: `healthCheckPath: /health` — unchanged, as required.

## web/vercel.json
- Unchanged; contains only install/build/framework, no probe field.
- No root `vercel.json` exists.

## Forbidden paths
- `SECURITY.md`, `README.md`, `PHONE_DEMO.md`, `YOUR_ACTIONS.md`, `PHONE_READY.md`,
  `backend/src/routes/{analyse,transcribe,voice,sessions,labels}.ts`, `web/**`
  — all untouched on this branch vs `main`.
