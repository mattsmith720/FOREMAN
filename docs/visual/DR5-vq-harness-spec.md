# DR5 — Visual QA harness spec

## Architecture

```
web/e2e/visual/
  matrix.ts           — viewport + surface definitions
  helpers/geometry.ts — bbox intersection, overflow, tap targets
  boot-geometry.spec.ts
  welcome-geometry.spec.ts
  (VS lanes add per-surface specs)
```

Playwright config: fake media stream for `/`, `reducedMotion: reduce` in tests, fonts loaded via layout before capture.

## Viewport matrix

| Key | Size | Surfaces |
|-----|------|----------|
| androidMid | 360×800 | in-job |
| iphoneSe | 375×667 | in-job |
| iphone14 | 390×844 | all |
| iphone14ProMax | 430×932 | in-job |
| tablet | 768×1024 | ops, dashboard |
| desktop | 1280×800 | ops, welcome |

## State matrix

Reproduce via:

- `/` — boot (default), `?debug` — HUD
- `/demo` — scripted states (no API)
- `/ops`, `/dashboard` — login shell (deterministic)
- Future: `?vq=stress` fixture flag for long names / max callouts

## Assertions (programmatic)

| Assertion | Helper | Enforced |
|-----------|--------|----------|
| No intersecting interactives | `findIntersectingPairs` | boot ✓ |
| No horizontal overflow | `assertNoHorizontalOverflow` | boot ✓ |
| Tap ≥48/44px, gap ≥8px | `assertTapTargets` | boot ✓ |
| Safe-area / viewport clip | `assertInViewport` | VS1 |
| Text zoom 100/130/160% | Playwright `page.evaluate` zoom | Phase V3 |
| axe serious/critical = 0 | `@axe-core/playwright` | boot ✓ |
| `toHaveScreenshot` baselines | boot visual baseline | CI soft |
| Z-index stacking | token audit script | Phase V3 |
| Raw hex outside tokens | `scripts/lint-no-raw-hex.sh` | CI soft |

## CI

`.github/workflows/visual-qa.yml` — hex lint + geometry + functional gate.

**Lane exit:** surface passes full matrix locally + all functional tests green.

## Content stress fixtures (Phase V3)

| Fixture | Data |
|---------|------|
| Long worker | `Abcdefghijklmnopqrstuvwxyz Installer` |
| Long address | 80-char AU street |
| Max callouts | 6 simultaneous annotations |
| Ops empty / 200 jobs | mock API or seed |
