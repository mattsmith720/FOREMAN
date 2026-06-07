# Program A — Lane A5 handoff (API benchmark)

Branch: `program/a5-bench`

## Delivered

| File | Purpose |
|------|---------|
| `scripts/bench-api.ts` | Sequential latency benchmark (5 runs, p50/p95) |
| `BENCH.md` | Usage, cold-start note, env vars |
| `backend/package.json` | `"bench": "tsx ../scripts/bench-api.ts"` |

## Endpoints benchmarked

1. **GET `/health`** — cold ping (first request) + 5 warm runs
2. **POST `/sessions/start`** — 5 runs with `x-foreman-api-key`
3. **POST `/analyse`** — 5 runs with `scripts/smoke-fixtures/frame.jpg`, fresh session per run

## Run

```bash
# Local (backend on :8080)
FOREMAN_API_KEY=local-smoke npm run bench --workspace backend

# Production Render API
BASE_URL=https://foreman-api-y31r.onrender.com FOREMAN_API_KEY=... npm run bench --workspace backend
```

## Cold-start note

Documented in `BENCH.md` and printed at end of bench output: Render free tier may sleep; first `/health` can be 30–60s. Warm p50/p95 exclude that cold ping.

## Secrets

No keys in repo. `FOREMAN_API_KEY` required via environment only.

## Not in scope

- No commit to `main`, no push
- No web proxy path (`/api/*` on Vercel) — benchmarks backend origin directly via `BASE_URL`
