# Swarm integration handoff

Merged lanes L1–L10 on `swarm/integrate-all`. Integrator CONTRACT items applied in this branch.

## Integrator wiring checklist

- [x] `coach-overlay.tsx` — hero uses `pickSpokenCue` (spoken == shown)
- [x] `web/app/api/sessions/[id]/stop/route.ts` — `timeoutMs: 55_000`
- [x] `web/next.config.mjs` — `geolocation=(self)`
- [x] `backend/src/index.ts` — register evidence-pack routes
- [x] `web/app/api/sessions/[id]/evidence-pack/route.ts` — ZIP proxy
- [x] `backend/src/routes/ops.ts` — `dataset` stats from `getDatasetStats`
- [x] `web/app/api/metrics/cost-model/route.ts` — cost model proxy
- [ ] `camera-coach.tsx` — L1 attempt metrics, L3 facing/geo, L4 ZIP download, L6 spend cap (partial — see lane HANDOFFs)

## Lane summaries

See individual lane branches for full detail. Key commits:

| Lane | Branch | Focus |
|------|--------|-------|
| L1 | swarm/l1-instrument | Cue-attempt E2E metrics, cost model sync |
| L2 | swarm/l2-defect-coach | CER fixtures + visualCallouts |
| L3 | swarm/l3-compliance | Front camera, evidence guards |
| L4 | swarm/l4-evidence-pack | ZIP evidence pack endpoint |
| L5 | swarm/l5-eval | eval-coaching.yml workflow |
| L6 | swarm/l6-efficiency | Scene-change gate, spend cap |
| L7 | swarm/l7-review | Van-proof review UX, dataset stats |
| L8 | swarm/l8-reliability | Analyse/transcribe retries |
| L9 | swarm/l9-ios | Swift model sync |
| L10 | swarm/l10-polish | Docs truth + touch targets |
