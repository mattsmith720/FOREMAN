# L10 Polish — Lane Handoff

**Branch:** `swarm/l10-polish`  
**Lane:** L10 — pilot doc truth sync + touch targets  
**Status:** Complete, tests green. Not pushed.

## Shipped

- **PILOT_HANDOFF.md** — synced to current UI: one-tap **I understand — start coaching**, pause/resume, post-job review, Install evidence pack.
- **PHONE_DEMO.md** — 90s demo script updated to match boot screen, pause/resume, review, evidence JSON.
- **YOUR_ACTIONS.md** — replaced stale deploy blockers with production-ready status; Step 4 iPhone walk matches live UI.
- **`web/app/globals.css`** — `min-height: 2.75rem` on `.callout-chip` and `.coach-detail-close` (gloved-hand touch targets).

## Verified

```bash
npm run lint --workspace web   # ✔ no warnings
npm test --workspace web       # 40 pass, 0 fail
```

## UI truth anchors (from `camera-coach.tsx`)

| Element | Label / behaviour |
|---------|-------------------|
| Consent + start | **I understand — start coaching** (first visit); **Start install/survey/pitch** (return) |
| Pause / resume | **Pause job** / **Resume job**; badge **PAUSED** (amber) |
| End flow | **End job** → **Job complete** → **Was the coaching right?** |
| Install evidence | Six CER voice prompts; `foreman-evidence-*.json` on end |

## Integrator notes

- Docs-only + CSS touch targets; no schema or API changes.
- No push to `main`.
