# Lane A2 — Playwright E2E handoff

Branch: `program/a2-e2e`  
Scope: scaffold browser E2E for the phone web client; one passing smoke spec.

## Delivered

| Path | Purpose |
|------|---------|
| `web/playwright.config.ts` | Chromium project, fake camera/mic flags, dev server auto-start |
| `web/e2e/golden-path.spec.ts` | Smoke: `/` shows consent button copy |
| `web/package.json` | `@playwright/test` devDependency + `test:e2e` script |
| `.github/workflows/e2e.yml` | CI stub on PR/push to `main` |

## Run locally

```bash
npm install
cd web && npx playwright install chromium
npm run test:e2e --workspace web
```

## Chromium flags

`--use-fake-device-for-media-stream` and `--use-fake-ui-for-media-stream` are set in `playwright.config.ts` so later specs can exercise camera/mic without real hardware.

## Next lanes (not in A2)

- Click consent → session start → coaching overlay visible
- End job → summary / review screen
- Mock backend or test doubles for `/api` routes in CI
- Wire `e2e.yml` as required check once flake budget is known

## Verification

```bash
npm run test:e2e --workspace web
# expect: 1 passed (home shows consent before coaching)
```
