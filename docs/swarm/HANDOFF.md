# Program A — Lane A1 handoff (CER eval fixtures)

**Branch:** `program/a1-fixtures`  
**Scope:** Synthetic JPEG fixtures + manifest for offline CER defect eval (no live API required to activate scenarios).

## Delivered

| Path | Purpose |
|------|---------|
| `backend/eval/frames/*.jpg` | 10 versioned mock images (5 defect classes × fail/pass) |
| `backend/eval/frames/manifest.json` | Frame registry: `id`, `defectClass`, `compliant`, `path`, `usedByScenarios[]` |
| `scripts/generate-cer-fixtures.ts` | Regenerate fixtures with `sharp` (ephemeral install — not a repo dep) |

## Defect classes (v1)

| defectClass | Fail frame (scenario) | Pass frame |
|-------------|----------------------|------------|
| `shutdown_label` | `switchboard-no-shutdown-label.jpg` (`cer-no-shutdown-label`) | `switchboard-shutdown-label-v1.jpg` |
| `missing_switch_label` | `missing-signage.jpg` (`cer-missing-signage`) | `switch-label-v1.jpg` |
| `dc_isolator` | `isolator-unlabelled.jpg` (`cer-isolator-unlabelled`) | `dc-isolator-labelled-v1.jpg` |
| `dc_conduit` | `dc-not-in-conduit.jpg` (`cer-dc-not-in-conduit`) | `dc-in-conduit-v1.jpg` |
| `serial_plate` | `serial-plate.jpg` (`cer-serial-capture`) | `serial-plate-clear-v1.jpg` |

Fail-frame paths match `backend/src/eval/scenarios.ts` so `eval-coaching` no longer skips CER scenarios for missing files.

## Regenerate

```bash
npm install sharp --no-save
npx tsx scripts/generate-cer-fixtures.ts
git checkout -- package-lock.json   # sharp is not committed
```

## Verification

```bash
cd backend && npm test   # 79/79 pass
```

## Downstream (A4 / integrator)

- **A4 vision eval:** Run `npm run eval-coaching -- --update-golden` locally with `ANTHROPIC_API_KEY` to capture goldens for the five CER scenarios; then offline CI can score them.
- **Pass-pair scenarios:** Compliant frames are in the manifest with empty `usedByScenarios[]` — add `cer-*-pass` scenarios in A4 if negative control scoring is needed.
- **Not in scope:** No changes to `scenarios.ts`, golden JSON, or prompt — frames only unblock live eval.

## Commit

`program(a1): add CER eval frame fixtures and manifest`
