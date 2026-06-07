# L1 Instrumentation — Lane Handoff

**Lane:** L1 instrument (S0 Δ)  
**Branch:** `swarm/l1-instrument`  
**Status:** complete

## What changed

| File | Change |
|------|--------|
| `web/lib/cue-metrics.ts` | `reportSpokenCueAttemptMs` — records frame→spoken-cue-attempt E2E (not play-audible-only) |
| `web/lib/frame-instrumentation.ts` | `onCueAttempt` + `spokenCueAttempt` auto-report; `ensureCostModelSynced` on debug frames |
| `web/lib/session-cost.ts` | Runtime cost model (`getCostModel` / `setCostModel` / `ensureCostModelSynced`); defaults mirror `backend/src/config.ts` |
| `backend/src/routes/metrics.ts` | `GET /metrics/cost-model` — same rates as `/ops` `costModel` |
| `backend/src/metrics.ts` | Cue E2E metric documented as spoken-cue-attempt semantics |
| `web/app/ops/page.tsx` | Displays `costModel` ($/frame, $/chunk) and relabels cue latency as attempt-based |
| `web/components/capture-health.tsx` | HUD label: "Cue attempt" |

## Integrator CONTRACT (`camera-coach.tsx`)

Wire after L1 merges (integrator-only file):

1. **Spoken-cue-attempt latency (R1):** Move `frameInstrumentation` to after `planVerdictCue`, pass `spokenCueAttempt: verdict !== null`, call `onCueAttempt()` at attempt time — remove `onAudible` metric hook from `speakCoachLine`.
2. **HUD session cost:** Call `void ensureCostModelSynced()` once on job start (or rely on debug-mode auto-sync in `frameInstrumentation`).
3. **API proxy:** Add `web/app/api/metrics/cost-model/route.ts` proxying `GET /metrics/cost-model` so same-origin clients sync rates without `NEXT_PUBLIC_*` env drift.

```ts
// After planVerdictCue:
const verdict = planVerdictCue(result.coaching, jobPhaseRef.current, lastHeroRef.current);
const postAnalyseInstrumentation = frameInstrumentation({
  debugMode,
  frameKb,
  analyseMs,
  startedAt,
  framesCaptured: framesCapturedRef.current,
  transcriptChunkCount: transcriptRef.current.length,
  spokenCueAttempt: verdict !== null,
});
if (verdict) {
  lastHeroRef.current = verdict.cue.text;
  const cueE2eMs = postAnalyseInstrumentation.onCueAttempt();
  if (debugMode && cueE2eMs > 0) {
    setHealthStats((current) => ({ ...current, cueE2eMs, ... }));
  }
  void speakCoachLine(verdict.cue.text, verdict.cue.severity);
}
```

## Env alignment (optional without proxy)

Set matching values on Render (backend) and Vercel (web):

- `ANALYSE_COST_USD` / `NEXT_PUBLIC_ANALYSE_COST_USD`
- `TRANSCRIBE_COST_USD` / `NEXT_PUBLIC_TRANSCRIBE_COST_USD`

## Tests

- `npm test --workspace backend` — 60 pass (includes `routes/metrics.test.ts`)
- `npm test --workspace web` — 44 pass (includes `frame-instrumentation`, `cue-metrics`, `session-cost` tests)

## Not pushed

Branch committed locally; **not pushed** to `main` per swarm protocol.
