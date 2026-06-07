# L8 Reliability — Lane Handoff

**Lane:** L8 reliability (S5)  
**Branch:** `swarm/l8-reliability`  
**Status:** complete

## What changed

| File | Change |
|------|--------|
| `web/lib/analyse.ts` | Per-attempt `AbortController` inside `withRetry`; 12s total deadline; 1 retry on 5xx/network (no retry on timeout) |
| `web/lib/transcribe.ts` | 1 retry on 5xx/network via `allowUnsafe: true` |
| `web/lib/retry.ts` | Optional `deadline` skips further retries once elapsed; retry predicates receive `attempt` index |
| `backend/src/transcribe.ts` | 2 retries (3 attempts) with 500ms backoff on Whisper 5xx/network failures |

## Verification

```bash
npm test --workspace backend
npm test --workspace web
```

Both suites green: backend 58 pass, web 40 pass.

## Integrator notes

- Analyse retries moved from `apiFetch` to `analyseFrame` so each attempt gets a fresh abort signal bounded by remaining budget inside the 12s cap.
- Transcribe POST is session-mutating but duplicate Whisper calls on short mic chunks are acceptable; `allowUnsafe` opts into one retry.
- Backend Whisper retry is local to `transcribeAudio`; route handler unchanged.

## Out of scope (integrator-only)

`web/lib/api-fetch.ts`, `backend/src/routes/transcribe.ts`, tests outside lane write list.
