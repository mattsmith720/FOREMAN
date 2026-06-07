# API latency benchmark

Measures sequential latency for the Foreman backend API: `/health`, `/sessions/start`, and `/analyse`.

## Run

From the repo root with the backend running locally:

```bash
FOREMAN_API_KEY=local-smoke npm run bench --workspace backend
```

Against production (Render API directly):

```bash
BASE_URL=https://foreman-api-y31r.onrender.com \
FOREMAN_API_KEY=<your-key> \
npm run bench --workspace backend
```

Do not commit API keys. Pass `FOREMAN_API_KEY` via env or shell history-safe export.

## What it measures

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/health` | GET | One **cold ping** (first request in process), then 5 warm sequential runs |
| `/sessions/start` | POST | 5 sequential runs, `jobType: "bench"` |
| `/analyse` | POST | 5 sequential runs using `scripts/smoke-fixtures/frame.jpg` (tiny JPEG). Each run starts a fresh session. |

Output reports per-endpoint latencies (ms), **p50**, and **p95** from the 5 warm runs.

## Cold start

Render free tier sleeps after ~15 minutes idle. The script’s first `/health` request is a **cold ping** and may take **30–60 seconds** if the instance was asleep. That value is printed separately; p50/p95 for `/health` use the five warm requests that follow.

`/analyse` latency includes Claude vision inference (typically **15–45s** when `ANTHROPIC_API_KEY` is set). A **503** with `ANTHROPIC_API_KEY is not set` is treated as configured wiring (same as smoke tests) and still records latency.

## Fixture

Image: `scripts/smoke-fixtures/frame.jpg` — shared with `scripts/smoke-e2e.sh`.

## Exit codes

- `0` — all endpoints returned expected status codes
- `1` — network error, missing fixture, or unexpected HTTP status
- `2` — missing `FOREMAN_API_KEY` (usage)
