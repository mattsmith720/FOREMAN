# L2 defect-coach handoff

**Branch:** `swarm/l2-defect-coach` (from `main`)  
**Lane:** L2 — S1 CER point-and-verdict fixtures + prompt pairing  
**Status:** Complete, tests green. Not pushed.

## What shipped

### Fail fixtures (5) — `backend/fixtures/cer-*.json`

Each defect fixture now has:

- **1 `visualCallout`** — `category: quality`, valid normalized x/y (0–1), shape aligned to subject
- **`spokenCue`** — ≤12 words, action-verb first, no deictics (`here`/`there`)
- **`cer-shutdown-label.json`** — fixed spoken line: `"Affix the shutdown procedure label now."` (removed `"here"`)

| Fixture | Callout label | spokenCue |
|---------|---------------|-----------|
| `cer-shutdown-label.json` | Missing shutdown label | Affix the shutdown procedure label now. |
| `cer-missing-label.json` | Missing switch label | Add the solar supply main switch label now. |
| `cer-dc-isolator.json` | DC isolator gap | Fit and label the rooftop DC isolator. |
| `cer-dc-conduit.json` | Exposed DC run | Run that exposed DC in conduit now. |
| `cer-serial-mismatch.json` | Serial glare | Retake the serial plate — hold steady. |

### Pass fixtures (5) — `backend/fixtures/cer-*-pass.json`

Compliant-shot examples for each defect:

- Empty `installQualityFlags`
- `spokenCue.say`: `"Shot looks compliant"`, **`speak: false`**
- No callouts (nothing to point at)

### Prompt delta — `backend/src/prompts/analysis-phases.ts`

Added CER callout pairing instruction in `solar_install` block:

> For each CER defect in view, add exactly one visualCallout (category: quality) whose message matches the spokenCue intent.

### Tests — `backend/src/prompts/cer-fixtures.test.ts`

Extended to assert per fail fixture:

- Schema parse
- `installQualityFlags.length > 0`
- `spokenCue.speak === true`, ≤12 words, no `here`/`there`
- Exactly **1** callout, `category: quality`, coords in bounds
- Keyword presence (aligned with `eval/scenarios.ts` `mustMention` sets)

Pass fixtures assert: no flags, `speak: false`, no deictics.

## Verification

```bash
npm run test --workspace backend
# 63 pass, 0 fail
```

## Out of scope (needs other lanes)

| Item | Owner | Notes |
|------|-------|-------|
| Hero card uses `spokenCue` not flag text | Integrator | `coach-overlay.pickHeroCue` still prefers callouts then flags |
| `evidenceShot` on CER fixtures | L2 optional / L3 | Not in this lane scope |
| Eval frames + goldens | L5 | `backend/eval/frames/` still empty; scenarios skip live |
| Rubric `spoken_callout_align` | L5 | Could reuse `cer-fixtures.test.ts` keyword helper |

## CONTRACT requests for integrator

1. **`web/components/coach-overlay.tsx`** — wire hero to `pickSpokenCue` so spoken == shown on phone
2. No schema changes required

## Next steps for L5

1. Drop mock photos at paths in `backend/src/eval/scenarios.ts` (`eval/frames/*.jpg`)
2. Run `npm run eval-coaching -- --update-golden` for CER scenarios
3. Wire CI non-blocking eval report (see R5 spec)

## Files touched

```
backend/fixtures/cer-shutdown-label.json
backend/fixtures/cer-missing-label.json
backend/fixtures/cer-dc-isolator.json
backend/fixtures/cer-dc-conduit.json
backend/fixtures/cer-serial-mismatch.json
backend/fixtures/cer-shutdown-label-pass.json
backend/fixtures/cer-missing-label-pass.json
backend/fixtures/cer-dc-isolator-pass.json
backend/fixtures/cer-dc-conduit-pass.json
backend/fixtures/cer-serial-mismatch-pass.json
backend/src/prompts/cer-fixtures.test.ts
backend/src/prompts/analysis-phases.ts
HANDOFF.md
```
