<!-- orchestrate handoff
task: verify-vp-backend-business-logic
branch: `orch/cto-engineering/vp-backend-business-logic` (no verifier commits added; source untouched)
agentId: bc-611d4d22-7350-4447-90f4-98636a7bdf62
runId: run-56fd99fb-5127-4472-8cf7-f06d3123816a
resultStatus: finished
finishedAt: 2026-06-06T02:51:47.289Z
-->

## Verification
unit-test-verified

## Target
`vp-backend-business-logic` on branch `orch/cto-engineering/vp-backend-business-logic`

## Branch
`orch/cto-engineering/vp-backend-business-logic` (no verifier commits added; source untouched)

## Execution
- `git status` → on `orch/cto-engineering/vp-backend-business-logic`, only unrelated `package-lock.json` dirty in tree (pre-existing, not introduced by HEAD commit `ae3fb94`).
- `git diff --name-only main..HEAD` → only `.orchestrate/...` and `backend/src/{analyse,elevenlabs,parse-coaching,transcribe}.ts(+test)`, `backend/src/routes/{analyse,labels,sessions,transcribe,voice}.ts(+tests)`. No forbidden file touched.
- Forbidden-file filter (`grep -E '(backend/src/(index|config|auth|assert-production-security|require-session-token|session-token|validate-media|validate-media\.test|api-error)\.ts)$'` over the diff) → no matches.
- `npm install` (root) → success; postinstall builds `@foreman/shared`.
- `npm run build --workspace @foreman/shared` → success (tsc clean).
- `npm run build --workspace backend` → success (tsc clean).
- `cd backend && npm test` → TAP output: `tests 10 / pass 10 / fail 0 / cancelled 0` (durations ~3–90 ms each).
  - `POST /analyse returns 413 for oversize image payload` → ok
  - `POST /analyse returns 400 for malformed JSON` → ok
  - `POST /analyse returns clean 5xx when provider throws` → ok (asserts response has no `stack` and does not contain "secret")
  - `POST /sessions/start returns 400 for malformed JSON` → ok
  - `POST /sessions/start returns clean 5xx when storage provider throws` → ok
  - `POST /transcribe returns 413 for oversize audio payload` → ok
  - `POST /transcribe returns 400 for malformed JSON` → ok
  - `POST /transcribe returns clean 5xx when provider throws` → ok
  - `POST /voice/speak returns 400 for malformed JSON` → ok
  - `POST /voice/speak returns clean 5xx when provider throws` → ok
- `cd /workspace/web && npx tsc --noEmit -p tsconfig.json` → success (silent; web compiles against the modified `@foreman/shared`).
- Spot-check of route files (`backend/src/routes/{analyse,transcribe,voice,sessions,labels}.ts`): all five have (1) `bodyLimit` + `preValidation` content-length check returning 413, (2) `errorHandler` normalizing `FST_ERR_CTP_BODY_TOO_LARGE` → 413 and `FST_ERR_CTP_INVALID_JSON_BODY` → 400, (3) dedicated `try/catch (providerErr)` wrapping each upstream call (Anthropic/OpenAI/ElevenLabs/Supabase) and converting via `toClientError` (CISO-owned, untouched).
- Manual run of the root-level test files that `npm test` misses (`npx tsx --test src/analyse.test.ts src/parse-coaching.test.ts src/stuck-summary.test.ts`) → `tests 8 / pass 8 / fail 0` (analyse fallback path, parse-coaching fallback, summary-retry helper all green). `validate-media.test.ts` is CISO-owned and was not touched.

## Findings
Per acceptance criterion:
- [x] All five AI/business routes (analyse, transcribe, voice, sessions, labels) explicitly handle oversize payloads, malformed input, and upstream-provider errors without leaking stack traces: **met**. Each route file has the bodyLimit / preValidation / errorHandler triple plus inner `try/catch (providerErr)` around the upstream call; the analyse provider-error test explicitly asserts the response has no `stack` field and the leaked "secret" string never appears in the body.
- [x] At least one new error-path test exists for each of analyse, transcribe, voice, and sessions; `cd backend && npm test` passes with the new tests included: **met**. 10/10 pass; analyse has 3, transcribe has 3, voice has 2, sessions has 2 (counts verified in TAP).
- [x] Shared `@foreman/shared` still builds and existing consumers (backend + web) compile against it: **met**. `npm run build --workspace @foreman/shared` clean, `npm run build --workspace backend` clean, `npx tsc --noEmit -p tsconfig.json` in `web/` clean.
- [x] No file in `pathsForbidden` modified on the handoff branch: **met**. Diff vs `main` lists 0 forbidden files; HEAD commit `ae3fb94` touches only allowed scoped paths.
- [x] Handoff `## Branch` records the actual cloud-agent branch: **met** (upstream handoff says `orch/cto-engineering/vp-backend-business-logic`, which matches the actual HEAD branch).

Other findings (severity-ordered):
- (med) `backend` test script glob `src/**/*.test.ts` (executed by npm via `tsx --test`) only matches subdirectories in this shell environment, so `npm test` runs the 4 route tests (10 cases) but silently skips the 4 top-level test files added/edited by this task: `src/analyse.test.ts`, `src/parse-coaching.test.ts`, `src/stuck-summary.test.ts`, `src/validate-media.test.ts`. I ran them manually and all 8 cases pass, so behaviour is correct — but the AC's per-route tests are met purely by the route-level tests, and the additional unit-level coverage (analyse fallback, parse-coaching fallback) is currently invisible to CI unless the glob is widened. Pre-existing limitation, not a regression of this task. Suggest changing the script to `tsx --test 'src/**/*.test.ts' 'src/*.test.ts'` or to a runner that walks the tree.
- (low) Labels route has full hardening (413 + 400 + provider try/catch) but no new error-path test for it. The AC does not require one (only analyse/transcribe/voice/sessions); upstream already lists this in suggested follow-ups.
- (low) Voice and sessions error-path tests cover malformed JSON and provider 5xx but not a dedicated oversize 413 case (the underlying `bodyLimit` and notes-size 413 guard are implemented; analyse and transcribe do cover oversize). The AC requires "at least one" error-path test per route, which is met.
- (low) `package-lock.json` is dirty in the working tree but was not committed; consistent with upstream's note.

## Notes & suggestions
- Recommend the planner ask the worker (or a follow-up task) to fix the `backend` `test` glob so the top-level `src/*.test.ts` files are exercised by `npm test`; otherwise the parse-coaching/analyse unit-level safety nets won't fail CI if they regress.
- Recommend a follow-up to add labels error-path tests (mirror voice/sessions structure) so the five-route guarantee is symmetric in test coverage, not just in code.
- Worker's "suggested follow-ups" about a CISO-owned shared payload-limit constant in `backend/src/config.ts` is sensible; route-local fallbacks are clearly commented as temporary.
- No live UI surface for a backend-only change; live-ui-verified not applicable. Did not hit any real provider — all upstream calls in tests are mocked via the injected-dependency seam the worker added, so no credentials were required.