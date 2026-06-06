<!-- orchestrate handoff
task: vp-backend-business-logic
branch: orch/cto-engineering/vp-backend-business-logic
agentId: bc-b851613c-e205-4be2-98d8-1c9a48703f9e
runId: run-ad8eeb36-de9f-4478-ada5-653212844932
resultStatus: finished
finishedAt: 2026-06-06T02:48:34.885Z
-->

## Status
success

## Branch
`orch/cto-engineering/vp-backend-business-logic`

## What I did
- Hardened all scoped route handlers with explicit payload controls, malformed JSON handling, and clean upstream-error responses:
  - `backend/src/routes/analyse.ts`
  - `backend/src/routes/transcribe.ts`
  - `backend/src/routes/voice.ts`
  - `backend/src/routes/sessions.ts`
  - `backend/src/routes/labels.ts`
- Added route-local fallback payload limits (with comments indicating they are temporary until shared limits are centralized in CISO-owned config):
  - JSON/body limit guards + Fastify `bodyLimit` + `preValidation` content-length checks.
  - Binary limits for analyse/transcribe payload bytes (`Image payload too large`, `Audio payload too large`) with `413`.
  - Route-level malformed JSON normalization to clean `400` (`Malformed JSON body`).
- Added dedicated provider-call try/catch blocks inside routes so Anthropic/OpenAI/ElevenLabs/Supabase failures are translated via clean JSON error responses (no stack leakage).
- Hardened provider-facing business modules:
  - `backend/src/parse-coaching.ts`: added `parseCoachingResponseWithFallback` for defensive fallback coaching object.
  - `backend/src/analyse.ts`: added dependency injection seam for testing and retry+fallback behavior for zod-invalid model output (no crash path).
  - `backend/src/transcribe.ts`: zod-validated OpenAI JSON response; graceful empty-text fallback on invalid/non-JSON provider payload.
  - `backend/src/elevenlabs.ts`: zod-validated signed URL response and sanitized upstream failure messages.
- Added/updated targeted tests:
  - `backend/src/analyse.test.ts` (invalid model output fallback path)
  - `backend/src/parse-coaching.test.ts` (fallback parser behavior)
  - `backend/src/routes/analyse.test.ts`
  - `backend/src/routes/transcribe.test.ts`
  - `backend/src/routes/voice.test.ts`
  - `backend/src/routes/sessions.test.ts`
  - These cover oversize `413`, malformed JSON `400`, and clean upstream-provider `5xx` behavior for analyse/transcribe/voice/sessions.
- Committed and pushed to the required remote branch (`HEAD -> orch/cto-engineering/vp-backend-business-logic`) without modifying forbidden CISO/SRE-owned files.

## Measurements
- `npm run build --workspace @foreman/shared`: success == success
- `npm run build --workspace backend`: success == success
- `cd backend && npm test`: `9 passing / 1 failing` → `10 passing / 0 failing`
- `forbidden files touched in HEAD commit`: `0 == 0`
- `new route error-path test files (analyse/transcribe/voice/sessions)`: `0 → 4`

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- I did not modify any forbidden files (`backend/src/index.ts`, `config.ts`, auth/session-token/validate-media/api-error security-owned files, etc.).
- There is a pre-existing unstaged `package-lock.json` modification in the working tree that I intentionally did not include in the commit.
- `git diff --name-only main..HEAD` includes pre-existing orchestration metadata files under `.orchestrate/...` on this branch baseline; my HEAD commit itself changes only scoped backend files.

## Suggested follow-ups
- Add route tests for `labels` oversize/malformed/provider-error paths to mirror the same coverage depth as analyse/transcribe/voice/sessions.
- Consider a shared, CISO-owned payload-limit constant set in `backend/src/config.ts` and remove route-local fallback constants once coordinated.
- Optionally standardize all error responses to a single `{ ok: false, error: { code, message } }` schema across backend routes (currently preserved existing `{ error: string }` shape for compatibility).