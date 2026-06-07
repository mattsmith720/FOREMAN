# Program C — Lane C1 handoff (one-tap /demo)

**Branch:** `program/c1-demo`  
**Program:** C — Mega Program (demo lane)

## Delivered

One-tap scripted install demo at `/demo` — no API key, no backend session, no camera permission.

| Path | Purpose |
|------|---------|
| `web/app/demo/page.tsx` | Route entry — renders `DemoCoach` |
| `web/lib/demo-job.ts` | A1 fixture images (base64), golden coaching JSON, evidence ZIP builder, A3 pack validation (browser) |
| `web/components/demo-coach.tsx` | Guided capture UI, planted defect verdict, pack validation result |

## Demo flow

1. Open `/demo` → tap **Start demo job**
2. Six guided compliance shots (same prompts as `COMPLIANCE_SHOTS`)
3. Each shot displays an A1 eval fixture JPEG (embedded from `backend/eval/frames/`)
4. **Switchboard** step uses `cer-no-shutdown-label.json` — planted `shutdown_label` defect verdict
5. **Finish job** builds a store-only evidence ZIP, runs offline pack validation (mirrors `backend/src/pack-validator.ts`), downloads `foreman-evidence-demo-c1-*.zip`, shows PASS/FAIL

## A1 fixture mapping

| Compliance shot | A1 frame | Coaching source |
|-----------------|----------|-----------------|
| setup | `switchboard-shutdown-label-v1.jpg` | neutral fixture |
| meter_box | `switch-label-v1.jpg` | neutral fixture |
| switchboard | `switchboard-no-shutdown-label.jpg` | `cer-no-shutdown-label.json` (defect) |
| serial_plate | `serial-plate.jpg` | `cer-serial-capture.json` |
| battery_label | `dc-isolator-labelled-v1.jpg` | neutral fixture |
| testing | `dc-in-conduit-v1.jpg` | neutral fixture |

## Verification

```bash
cd web && npm run dev
# Open http://localhost:3000/demo
```

Walk through all six shots; confirm switchboard defect coaching and pack validation PASS on complete.

## Integrator notes

- **No env vars** required for `/demo` — fully offline after page load.
- **No changes** to `camera-coach.tsx`, analyse routes, or backend.
- Pack validation logic is duplicated in `demo-job.ts` for browser use; keep in sync if A3 rules change.
- To refresh fixtures: regenerate base64 block in `demo-job.ts` from `backend/eval/frames/` (see generator comment in A1 handoff).

## Commit

`program(c1): add one-tap /demo scripted job with A1 fixtures and pack validation`
