# Program D — Lane D1 handoff (observability)

**Branch:** `program/d1-observability`  
**Scope:** Structured JSON logging primitives + minimal backend request lifecycle hooks. No Sentry.

## Delivered

| Path | Purpose |
|------|---------|
| `backend/src/structured-log.ts` | Request/session context helpers; `http.request.start` / `http.request.complete` events via Fastify/pino |
| `web/lib/structured-log.ts` | Browser-side JSON log helper + `x-request-id` extraction from API responses |
| `backend/src/index.ts` | Wired `onRequest` / `onResponse` hooks (integrator-owned file — see CONTRACT) |

## Log shape (backend)

Every request emits two pino JSON lines in production (`NODE_ENV=production` uses raw JSON, no pino-pretty):

```json
{
  "level": 30,
  "time": 1710000000000,
  "requestId": "uuid",
  "sessionId": "uuid",
  "event": "http.request.start",
  "method": "POST",
  "url": "/analyse",
  "msg": "request started"
}
```

```json
{
  "level": 30,
  "time": 1710000001000,
  "requestId": "uuid",
  "sessionId": "uuid",
  "event": "http.request.complete",
  "method": "POST",
  "url": "/analyse",
  "statusCode": 200,
  "responseTimeMs": 842,
  "msg": "request completed"
}
```

- **`requestId`**: Fastify `genReqId` (UUID); echoed on `x-request-id` response header.
- **`sessionId`**: Best-effort from route param `id`, JSON body `sessionId`, or `/sessions/:id` URL segment. Omitted when unknown (e.g. `/health`).
- **5xx**: `http.request.complete` logged at `error` level with same correlation fields.

## Log shape (web)

`structuredLog(level, msg, fields)` prints one JSON line to the browser console:

```json
{
  "ts": "2026-06-07T12:00:00.000Z",
  "level": "error",
  "msg": "analyse failed",
  "requestId": "uuid-from-x-request-id",
  "sessionId": "uuid",
  "event": "api.analyse.error",
  "status": 502
}
```

## Verification

```bash
cd backend && npm test
cd backend && npm run build
```

Spot-check locally:

```bash
cd backend && npm run dev
curl -s -D - http://127.0.0.1:8080/health   # x-request-id header + JSON log lines
```

Render production logs: Dashboard → `foreman-api-y31r` → Logs (structured JSON, filter by `requestId` or `sessionId`).

## Integrator CONTRACT (not done in D1)

Apply on merge to `main` (or integrator branch):

- [ ] **`web/lib/api-fetch.ts`** — On non-OK responses, call `structuredLog("warn"|"error", …)` with `getRequestIdFromResponse(response)` and active `sessionId` when available.
- [ ] **`web/lib/proxy-backend.ts`** — Log proxy failures with `requestId` from upstream `x-request-id` when present.
- [ ] **`web/components/camera-coach.tsx`** — Pass `sessionIdRef.current` into client log context for capture/analyse/transcribe errors (debug/support only; no PII in fields).
- [ ] **`DEPLOY.md`** — Document where to read Render API logs and Vercel function logs; note correlation via `x-request-id` / `requestId`.
- [ ] **Error handler alignment** — Optionally refactor `backend/src/index.ts` `setErrorHandler` to use `getRequestLogContext(request)` instead of bare `reqId` (cosmetic consistency).
- [ ] **Do not add Sentry** — observability stays log-based for this program.

## Not in scope

- Sentry or third-party APM
- `/ready` changes (separate SRE lane)
- Web proxy wiring (CONTRACT above)
- DEPLOY.md edits (CONTRACT above)
- Push to `main`

## Commit

`program(d1): add structured JSON logging with request and session IDs`
