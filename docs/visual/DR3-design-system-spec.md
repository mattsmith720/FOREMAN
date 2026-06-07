# DR3 — Design system spec

## Direction

**Industrial / utilitarian, safety-coded.** Asphalt charcoal neutrals + **hi-vis safety orange** (`#ff6b00`) as the single brand accent.

Severity palette (semantic only — never decorative):

| Token | Use |
|-------|-----|
| `--color-severity-critical` | Recording fault, safety cue, error banner |
| `--color-severity-warning` | Quality cue, offline queue, paused state |
| `--color-severity-pass` | Success, debug HUD ok, stamped shot |

## Typography

| Role | Face | Token |
|------|------|-------|
| Display | Barlow Condensed 600/700 | `--font-display` |
| Body | IBM Plex Sans 400–700 | `--font-body` |
| Mono | IBM Plex Mono | `--font-mono` |

**Banned:** Inter, Roboto, Arial, system-ui as primary.

In-job cue hero: `--text-cue-hero` (clamp 18–22px), label caps at `--text-cue-label`.

## Theme

**One dark theme** for all app surfaces. Marketing may add texture/gradient overlays using token neutrals only — no purple SaaS gradients.

## Component inventory

| Component | Class prefix | File |
|-----------|--------------|------|
| Button | `fm-button` | `web/components/ui/button.tsx` |
| Pill | `fm-pill` | `pill.tsx` |
| Banner | `fm-banner` | `banner.tsx` |
| SeverityBadge | `fm-severity-badge` | `severity-badge.tsx` |
| StatCard | `fm-stat-card` | `stat-card.tsx` |
| Sheet | `fm-sheet` | `sheet.tsx` |
| ProgressRing | `fm-progress-ring` | `progress-ring.tsx` |

Legacy `.button`, `.coach-card` etc. migrate in surface lanes — **do not delete until lane passes VQ**.

## Z-index scale (token)

```
video(1) < annotations(2) < overlay(3) < recording(4) = debug(4) < toolbar(8) < sheet-bd(9) < controls(10) < banner(11) < summary(12) < modal(20) < toast(30)
```

## Motion

- `prefers-reduced-motion`: zero duration
- `[data-coaching-live="true"]`: zero animation during live session
- Marketing: one load reveal max (VS7)

## Token source

**Contract file:** `web/styles/tokens.css` (integrator-owned)  
**Primitives:** `web/styles/ui-primitives.css`
