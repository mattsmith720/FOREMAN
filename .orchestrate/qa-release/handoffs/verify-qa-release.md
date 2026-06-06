<!-- orchestrate handoff
task: verify-qa-release
branch: `orch/qa-release/qa-release` (no verifier commits authored — only ran `npm install` which touched `package-lock.json`; not committed per "Do NOT modify target source files")
agentId: bc-14f24947-93d8-41f4-9624-1cedf0f5e9d4
runId: run-b96cedba-1a15-4284-b3cc-abb1d68d4744
resultStatus: finished
finishedAt: 2026-06-06T02:54:13.368Z
-->

Backend logs confirm the smoke script actually reached `POST /sessions/start` and the backend returned 503 due to missing Supabase config — exactly matching the plan's documented gotcha (env gap, not a slice failure). All evidence collected.

## Verification
unit-test-verified

## Target
`merge-qa-release` on branch `orch/qa-release/qa-release`

## Branch
`orch/qa-release/qa-release` (no verifier commits authored — only ran `npm install` which touched `package-lock.json`; not committed per "Do NOT modify target source files")

## Execution
- `git branch --show-current` → `orch/qa-release/qa-release`
- `git log --merges -1 --format='%H %P %s'` → `9875f7301dcb7e920799757d4f32023f46e6476c c3a3433281b1ca3a2e893fb917ea90ff085eefd2 e4b345241f432ab07772a92502fb3c286057a218 merge: consolidate qa-release subtree` (two parents recorded)
- `git show --stat 9875f7301dcb…` → `Merge: c3a3433 e4b3452` confirmed; parents = `release-recipe` (c3a3433 = `Wire npm run smoke and document Release smoke in DEPLOY.md`) and `test-suite-green` (e4b3452 = `orch: qa-release test-suite-green pending -> running`)
- `test -x scripts/smoke-e2e.sh` → exit 0 (executable, mode `-rwxr-xr-x`)
- `grep '"smoke"' package.json` → `"smoke": "bash scripts/smoke-e2e.sh"` present
- `grep '## Release smoke' DEPLOY.md` → 1 hit at line 124; section names `scripts/smoke-e2e.sh`, `BASE_URL`, `FOREMAN_API_KEY`, and states "exits non-zero on any failure"
- `npm install` → exit 0 (postinstall built `@foreman/shared`)
- `(cd backend && npm test)` → exit 0; final TAP: `# tests 8 # pass 8 # fail 0`
- `(cd web && npm test)` → exit 0; final TAP: `# tests 2 # pass 2 # fail 0`
- `FOREMAN_API_KEY= npm run smoke; echo exit=$?` → script exit `2`; output: `ERROR: FOREMAN_API_KEY is required.` then summary `overall: FAIL` (4 SKIPPED)
- Booted backend in tmux: `PORT=8080 FOREMAN_API_KEY=local-smoke ./node_modules/.bin/tsx backend/src/index.ts` → `Server listening at http://127.0.0.1:8080`; `curl /health` → `200 {"status":"ok"}`
- `BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=local-smoke npm run smoke; echo exit=$?` → script exit `1`; smoke logged `>> request: POST http://127.0.0.1:8080/sessions/start`, then `sessions/start: FAIL - HTTP 503: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`
- Backend log cross-check (`/tmp/backend.log`) → confirms `POST /sessions/start` request hit the server and returned `statusCode: 503`. The smoke script DID reach the endpoint; the 503 is environment-driven, not a wiring/contract failure.

## Findings

### Per parent QA-Release acceptance criterion
- [x] **Merge commit exists with both parents (release-recipe + test-suite-green)**: `git log --merges -1` shows merge SHA `9875f7301dc…` with parents `c3a3433` (release-recipe tip — "Wire npm run smoke …") and `e4b3452` (test-suite-green tip). Subject: `merge: consolidate qa-release subtree`. **(met)**
- [x] **Backend and web `npm test` both pass**: backend `# tests 8 # pass 8 # fail 0 # duration_ms 221.83`; web `# tests 2 # pass 2 # fail 0 # duration_ms 162.29`. **(met)**
- [~] **Smoke contract**: `FOREMAN_API_KEY=` → exit 2 with explicit `ERROR: FOREMAN_API_KEY is required.` message. **(met for missing-key half.)** Green-path with locally booted backend → exit 1 (HTTP 503 from `/sessions/start` because `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are unset in this VM). The verification plan's "Gotchas" explicitly classifies this as a test-environment gap, not a slice failure — the script actually reached `POST /sessions/start` (confirmed in backend logs), proving the wiring contract. **(contract-met; full green-path env-gapped.)**
- [x] **Artifacts present**: `scripts/smoke-e2e.sh` exists and is executable (`-rwxr-xr-x`); `DEPLOY.md` contains `## Release smoke` section that names `scripts/smoke-e2e.sh`, `BASE_URL`, `FOREMAN_API_KEY`, and the non-zero-exit contract; `package.json` `scripts.smoke` = `bash scripts/smoke-e2e.sh`. **(met)**

### Per verifier-specific criteria
- [x] Per-bullet evidence for each of the 4 QA Release ACs is above with command-level outputs.
- [x] Backend and web tests independently re-run; final TAP summary lines pasted.
- [x] `npm run smoke` independently re-run with and without `FOREMAN_API_KEY`; observed exit codes are `2` (no key) and `1` (with key, no Supabase) — pasted verbatim above.
- [x] `## Verification` uses a prescribed value: `unit-test-verified`.
- [x] Downgrade explanation: not `live-ui-verified` because the slice has no UI surface; not lifting beyond `unit-test-verified` because the green-path smoke could not produce HTTP 201 from `/sessions/start` (Supabase not configured locally) — the contract was verified (script reaches the endpoint with the correct headers/payload), but the end-to-end green path was env-blocked exactly as the plan's gotcha predicted.

### Other findings
- (med) **`/sessions/start` requires Supabase even for smoke**: in this dev VM, no `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` means the green-path smoke can never exit 0 locally. Acceptance criterion #3 says "exits 0 (or with documented configured-pass notes only)" — the smoke script does have a `CONFIGURED_PASS` branch for `analyse` (ANTHROPIC_API_KEY missing) and `transcribe` (OPENAI_API_KEY missing), but **not** for `/sessions/start` Supabase 503. Consider extending the smoke to treat `503: Supabase is not configured` on `/sessions/start` as `CONFIGURED_PASS` so CI-without-Supabase produces a clean signal. Until then, the local green path requires real Supabase creds; production smoke against `https://foreman-phi.vercel.app/api` (per DEPLOY.md) should be the authoritative end-to-end check.
- (low) `npm install` left a modified `package-lock.json` in the working tree (one new transitive package); not authored by the merge itself. No action needed for verification, but planner may want to commit a clean lockfile in a follow-up.
- (low) `tsx` is not on `PATH`; the backend boot path used `./node_modules/.bin/tsx`. The smoke script itself does not need `tsx`, but if any future smoke wiring boots the backend via `tsx` directly (as the upstream worker noted) it should standardize on `npx tsx` or the local bin.

## Notes & suggestions
- The upstream handoff was honest about the Supabase gap and the verification recipe explicitly anticipated it; the consolidation merge is structurally correct and unit/contract evidence is fully green. I treat this slice as **passing** per the plan's stated rules ("treat the contract test … as the primary signal").
- Suggested follow-ups for the planner: (a) provision Supabase creds (or a sqlite/in-memory fallback) so a future verifier can confirm exit 0 end-to-end; (b) optionally add a `CONFIGURED_PASS` branch in `scripts/smoke-e2e.sh` for `/sessions/start` HTTP 503 with `Supabase is not configured`, mirroring the existing analyse/transcribe configured-pass logic.
- Backend tmux session `foreman-backend` is left running on port 8080 (per "NEVER kill applications or services you were testing").
- No verifier commits authored; planner owns integration.