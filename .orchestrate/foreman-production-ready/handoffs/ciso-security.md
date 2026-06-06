<!-- orchestrate handoff
task: ciso-security
branch: orch/foreman-production-ready/ciso-security
agentId: bc-8eb9a4f0-1229-4ee6-be1b-f0e4549ca5aa
runId: run-af27c216-eb9f-41b0-b34c-ecdd5da236c3
resultStatus: finished
finishedAt: 2026-06-06T03:53:39.042Z
-->

Per task spec, I am NOT to open a PR — the planner owns integration. Branch is pushed. Final handoff below.

## Status
success

## Branch
`orch/foreman-production-ready/ciso-security`

## What I did
- **Gitleaks audit + CI**: Installed gitleaks v8.18.4, scanned working tree + git history (37 commits including the new branch). Found one alert that turned out to be a public ElevenLabs voice ID (`Charlie`, `IKne3meq5aSn9XLyUdCD`) tripping generic-api-key entropy. Wrote `.gitleaks.toml` extending the default ruleset with a narrow allowlist for that public ID, the public Anthropic model slug, and the public Supabase project URL — no real secrets allowlisted. Final scan: zero leaks.
- **`.github/workflows/gitleaks.yml`**: Added a dedicated workflow that runs on push (all branches) and pull_request, installs the v8.18.4 binary, and scans full git history with `--config .gitleaks.toml`. Removed the old `secret-scan.yml` to avoid duplicate scans.
- **`backend/src/assert-production-security.test.ts`** (9 cases): No-op outside production; throws when `FOREMAN_API_KEY` missing; throws when `CORS_ORIGINS` missing; rejects wildcard CORS; passes when both required envs are set; `getCorsOrigins` returns the explicit list and refuses to fall back to wildcard. Two cases spawn a real Node child process with `--import tsx` to confirm the module exits non-zero on import in production with missing envs (a true boot-time guard, not just a unit-level throw).
- **`web/middleware.ts` tightening + `web/middleware.test.ts`** (10 cases): Replaced substring matching of `.vercel.app` and the `host` header with proper `URL` parsing on `Origin`/`Referer`. Tests cover: missing/foreign origin → 403; explicit allowed origin or referer → pass; `/api/health` exempt; non-`/api` not gated; **two new bypass-attempt cases** (`Referer: https://attacker/?ref=foo.vercel.app` and `Referer: https://attacker/foreman-phi.vercel.app/`) → 403; same-project `*.vercel.app` preview origin → pass. Updated `web/package.json` test glob to pick up `middleware.test.ts` at the package root.
- **`backend/src/rate-limit.test.ts`** (5 cases): Builds a Fastify app registering the real `@fastify/rate-limit` plugin and the real `registerAnalyseRoutes` / `registerTranscribeRoutes` / `registerVoiceRoutes`. Hammers each endpoint at `cap + 1` per IP and asserts the over-cap call returns 429 (under-cap calls return 503 from the real handlers since AI keys are unset). Caps proven: `/analyse=20/min`, `/transcribe=30/min`, `/voice/speak=30/min`, `/voice/advice=15/min`. Final case pins `X-Forwarded-For` to two distinct client IPs and asserts a separate IP is not penalized — proving the `keyGenerator` extracts the forwarded IP.
- **No-client-secrets sweep**: `rg 'NEXT_PUBLIC_(FOREMAN_API_KEY|ANTHROPIC|OPENAI|SUPABASE_SERVICE_ROLE|SUPABASE_URL)' web/` returns zero matches. The only `NEXT_PUBLIC_*` reference under `web/` is `NEXT_PUBLIC_API_URL` (the Vercel proxy URL — not a secret) and the explicit warning text in `web/.env.local.example`.
- **`SECURITY.md` rewrite**: Every control row now points at concrete files and tests on this branch. Added the boot guard, rate-limit integration test, and tightened middleware. Added a `Verify locally` block with the exact commands a verifier can run. Acknowledged the `*.vercel.app` preview allowance as a known limitation rather than dressing it up.

## Measurements
- `gitleaks detect --no-banner --redact -s . on HEAD + history: 1 finding (false-positive ELEVENLABS_VOICE_ID, public) → 0 findings`
- `gitleaks workflow files: 1 (secret-scan.yml, push-to-main only) → 1 (gitleaks.yml, push + pull_request, all branches)`
- `cd backend && npm test: 7 passing → 22 passing (+15 security tests across boot guard + rate-limit)`
- `cd web && npm test: 2 passing → 12 passing (+10 middleware origin-gate tests)`
- `rg 'NEXT_PUBLIC_(FOREMAN_API_KEY|ANTHROPIC|OPENAI|SUPABASE_SERVICE_ROLE|SUPABASE_URL)' web/: 0 matches == 0 matches`
- `web/middleware.ts: substring-bypass attack accepted → rejected`
- `SECURITY.md control rows backed by concrete code on this branch: ~7/13 → 13/13`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- The single gitleaks "high-severity" alert was a false positive: `ELEVENLABS_VOICE_ID=IKne3meq5aSn9XLyUdCD` is the public voice identifier for the "Charlie" voice in the ElevenLabs catalogue — it is meant to be shared and is not a secret. Documented in `.gitleaks.toml` so future scans don't re-flag it. No real secrets were allowlisted.
- I deleted `.github/workflows/secret-scan.yml` and replaced it with `.github/workflows/gitleaks.yml`. Two reasons: (a) the spec requires the workflow at that exact path, (b) the old file used `gitleaks/gitleaks-action@v2` which would not have respected our `.gitleaks.toml` consistently and only ran on `main`. The new workflow runs on every branch's push + every PR.
- The "may MODIFY" path list in the task spec did not include the test files I was explicitly required to create (`backend/src/assert-production-security.test.ts`, `backend/src/rate-limit.test.ts`, `web/middleware.test.ts`) or `web/package.json` (which I had to touch so the new web test would actually run). I treated the explicit "WRITE this test file" instructions as authorization. The only non-test write outside the listed files was `web/package.json`'s test script glob.
- I tightened `web/middleware.ts` (in the may-modify list) instead of just adding tests against the existing loose substring matches, because the existing implementation accepted `Referer: https://attacker.example/?from=foreman.vercel.app` as a valid app origin. The tightened version still allows same-project preview deployments via the `*.vercel.app` hostname check.
- The rate-limit test is genuinely an integration test against the real route registrations — it doesn't mock the rate-limit plugin or the route handlers. The handlers return 503 (no AI keys set in the test env) but `@fastify/rate-limit` fires before them, so the (cap+1)th call still returns 429.
- The boot-guard test includes a child-process spawn so it covers actual *boot*, not just function invocation. The unit tests already covered the throw, but the spawn test catches a regression where someone could refactor `index.ts` to swallow the throw.
- I did not modify `backend/src/auth.ts`, `backend/src/require-session-token.ts`, `backend/src/session-token.ts`, `backend/src/validate-media.ts`, `backend/src/api-error.ts`, or `SECURITY_INCIDENT.md` — they were already in good shape and the task didn't require touching them.
- The `*.vercel.app` allowance in `web/middleware.ts` is a known soft spot: anyone with a Vercel project can host a frontend that calls our `/api/*` proxy, and we'd have to trust the `FOREMAN_API_KEY` (held server-side on Vercel only) to backstop that. Documented in SECURITY.md. Tightening this further would break preview deployments without an environment-aware check.

## Suggested follow-ups
- Replace the `*.vercel.app` substring allowance with an explicit environment-aware check: e.g. only accept `*.vercel.app` when `process.env.VERCEL_ENV === 'preview'`. This kills the residual cross-tenant trust surface without breaking previews.
- Add a CI step that runs `rg 'NEXT_PUBLIC_(FOREMAN_API_KEY|ANTHROPIC|OPENAI|SUPABASE_SERVICE_ROLE|SUPABASE_URL)' web/` and fails the build on any match. Today the gitleaks workflow catches *committed values* but not *references that someone could later set via Vercel env*.
- Add a real production-mode boot smoke test in CI that runs `NODE_ENV=production node --import tsx backend/src/index.ts` with empty envs and asserts a non-zero exit — the unit-level child-process test in `assert-production-security.test.ts` is a good proxy but a CI-level smoke would catch any future regression where someone moves the assert.
- Convert `SECURITY_INCIDENT.md` from "rotate this" instructions into a closed incident report once the planner confirms the JWT has actually been rotated in Render and Supabase, and update SECURITY.md to drop the prominent rotation banner.
- Consider adding a `.github/CODEOWNERS` so changes to `backend/src/auth.ts`, `backend/src/assert-production-security.ts`, `web/middleware.ts`, `.github/workflows/gitleaks.yml`, and `.gitleaks.toml` require explicit security review.