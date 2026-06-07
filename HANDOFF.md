# L3 Compliance Evidence — Lane Handoff

**Lane:** L3 capture (S2a)  
**Branch:** `swarm/l3-compliance`  
**Status:** complete

## What changed

| File | Change |
|------|--------|
| `web/lib/compliance-evidence-handler.ts` | Type-guarded evidence handling; wrong-type rejection; fail-count escalation; `facingModeForShot` / `facingModeForEvidenceType`; `shouldAccelerateCapture`; outcome adds `accelerateCapture` + `facingMode` |
| `web/lib/phone-frame-source.ts` | Configurable `facingMode`; `setFacingMode` / `setFacingForShot` / `setFacingForEvidenceType`; `captureNow({ accelerate })` with 1.4s retake gap |
| `web/lib/geolocation.ts` | `awaitGeoForEvidence`, `geoDeniedVoiceLine`, shared `readGeoFix` timeout helper |
| `web/lib/compliance-evidence-handler.test.ts` | Facing mode, type guard, retake acceleration, escalation, duplicate-ignore coverage |

## Integrator CONTRACT (`camera-coach.tsx`)

Wire these after L3 merges (integrator-only file):

1. **Job start (install):** `await awaitGeoForEvidence()` inside Start tap; on null after prompt, `speakCoachLine(geoDeniedVoiceLine())`.
2. **PhoneFrameSource options:** pass `facingMode: () => facingModeForShot(nextComplianceShot(captured)?.id ?? "meter_box")` or call `setFacingForShot` when target changes.
3. **After `applyComplianceEvidence`:** if `outcome.facingMode` differs from `frameSource.getFacingMode()`, call `setFacingMode(outcome.facingMode)`; on selfie flip optionally speak `selfieCameraVoiceLine(shotId)`.
4. **In analyse `finally`:** `frameSource.captureNow({ accelerate: outcome.accelerateCapture })`.
5. **`Permissions-Policy`:** set `geolocation=(self)` in `next.config.mjs` (L3 did **not** touch this file).

## Exports for integrator

```ts
facingModeForShot(shotId)
facingModeForEvidenceType(evidenceType)
selfieCameraVoiceLine(shotId)
shouldAccelerateCapture(evidence, target)
awaitGeoForEvidence(timeoutMs?)
geoDeniedVoiceLine()
// PhoneFrameSource: setFacingMode, setFacingForShot, setFacingForEvidenceType, captureNow({ accelerate })
// applyComplianceEvidence outcome: { accelerateCapture, facingMode }
```

## Tests

- `npx tsx --test lib/compliance-evidence-handler.test.ts lib/compliance-pack.test.ts` — **13 pass**
- Full `npm test --workspace web`: **49 pass** in L3-owned suites; **3 fail** in `lib/evidence-pack.test.ts` (L4 lane, pre-existing on worktree — not L3 scope)

## Not pushed

Branch committed locally; **not pushed** to `main` per swarm protocol.
