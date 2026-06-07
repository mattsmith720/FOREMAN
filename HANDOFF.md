# L5 Eval — Lane Handoff

**Branch:** `swarm/l5-eval`  
**Lane:** L5 (S3 eval-coaching harness)  
**Spec:** R5

## Shipped

- **`.github/workflows/eval-coaching.yml`** — standalone offline coaching eval workflow (PR + main push + manual dispatch). Runs `npm run eval-coaching --workspace backend -- --offline --json`, prints human summary, uploads `coaching-eval-report` artifact (30-day retention). Non-blocking (`continue-on-error` on eval step).
- **`backend/eval/frames/.gitkeep`** — placeholder for CER detection photos (activates the five pending scenarios in `scenarios.ts` once frames land).

## Verified

```bash
npm run eval-coaching --workspace backend -- --offline
# 6/11 scenarios scored (5 CER frames pending), OVERALL 31/31 (100%)
```

## Deferred (needs assets or L2 goldens)

| Item | Blocker |
|------|---------|
| `install-compliant` scenario with `expect.speak: false` | Needs compliant frame + golden with `spokenCue.speak: false` |
| CER detection goldens (`cer-no-shutdown-label`, etc.) | Drop labelled photos into `backend/eval/frames/`, run `--update-golden` locally |
| `criticalSafety` scenario | Needs harness/PPE defect frame + golden with critical severity |

## Integrator notes

- R5 prefers **single source** for CI eval: consider removing the duplicate non-blocking step from `.github/workflows/ci.yml` once this workflow is merged.
- L5 did **not** modify `scenarios.ts`, prompts, or shared schema (lane boundary).
- No push to `main`.
