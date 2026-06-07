# A3 — Evidence pack validator (lane handoff)

**Branch:** `program/a3-pack-validator`  
**Program:** A — Prove it

## Delivered

CLI validator for Foreman CER evidence ZIP archives:

```bash
npm run validate-pack --workspace backend -- /path/to/foreman-evidence-*.zip
```

Exit `0` = PASS, `1` = FAIL.

## Files

| Path | Role |
|------|------|
| `backend/src/pack-validator.ts` | ZIP reader + manifest/JPEG validation |
| `backend/src/pack-validator.test.ts` | Unit tests (mock ZIP via `evidence-pack` helpers) |
| `backend/scripts/validate-pack.ts` | CLI entrypoint |
| `backend/package.json` | `"validate-pack"` script |

## Validation rules

1. ZIP must contain `manifest.json` parseable as `EvidencePackManifest`.
2. Each manifest record must have `shotId` ∈ `GUIDED_COMPLIANCE_SHOT_IDS`, non-empty `capturedAt`, and `zipEntry` basename matching `shotId`.
3. Each record’s `zipEntry` JPEG must exist in the archive and start with JPEG magic bytes.
4. Reports `presentShots` / `missingShots` against all six guided IDs.
5. Reports per-shot stamp metadata: `capturedAt` present, GPS (`lat`/`lng`) when available.

## Integrator notes

- Reuses `GUIDED_COMPLIANCE_SHOT_IDS` and manifest types from `backend/src/evidence-pack.ts` — no duplicate shot list.
- ZIP reader supports store-only archives from `createZipArchive` (same format as live evidence-pack endpoint).
- Safe to run in CI against fixture ZIPs from `buildEvidencePackZip` mocks.

## Test

```bash
npm test --workspace backend
```

Adds 6 cases in `pack-validator.test.ts` (backend count +6 vs pre-A3 baseline).
