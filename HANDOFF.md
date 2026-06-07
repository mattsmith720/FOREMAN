# L7 Post-Job Review — Lane Handoff

**Lane:** L7 data (S4)  
**Branch:** `swarm/l7-review`  
**Status:** complete

## What changed

| File | Change |
|------|--------|
| `web/components/post-job-review.tsx` | Replaced `window.prompt` with inline textarea + Confirm correction / Cancel (van-proof, no modal) |
| `web/lib/review.ts` | `confirmLabel` now passes `retry: { retries: 1, allowUnsafe: true }` for flaky van networks |
| `backend/src/db/ops.ts` | Added `getDatasetStats()` + `DatasetStats` type with integrator CONTRACT comment |

## Verification

```bash
npm test --workspace backend
npm test --workspace web
```

Both suites green: backend 58 pass, web 40 pass.

## Integrator notes (CONTRACT REQUEST)

### `backend/src/routes/ops.ts`

Import and call `getDatasetStats` from `../db/ops.js` when Supabase is configured:

```typescript
const dataset = await getDatasetStats();
// merge into GET /ops/sessions response as:
// { sessions, totals, latency, costModel, dataset: { sessions, labels, frames } }
```

Or expose `GET /ops/dataset` returning `{ sessions, labels, frames }`. Errors throw — catch with `toClientError` like other /ops routes.

### `web/app/ops/page.tsx`

Read `dataset` from `/api/ops/sessions` (or dedicated endpoint) and render a moat readout section (sessions / labels / frames counts).

### Optional CSS (`web/app/globals.css`, L10)

`.review-correct` grid override is inline today; L10 may promote to a class if the correction row needs polish.

## Out of scope (integrator-only)

`backend/src/routes/labels.ts`, `web/app/api/**`, `web/app/ops/page.tsx`, `web/app/globals.css`.
