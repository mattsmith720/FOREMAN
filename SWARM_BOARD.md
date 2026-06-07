# FOREMAN Swarm Board

**Product:** https://foreman-phi.vercel.app  
**Marketing (canonical):** https://landing-lac-mu.vercel.app

## Phase status

| Phase | Status |
|-------|--------|
| Mega A–D | **CLOSED** |
| Factory E–H | **QUEUED** (recon at `docs/swarm/FACTORY_RECON.md`) |
| **Landing strike (LP1–LP6)** | **DEPLOYED** — `docs/landing/LP6_REPORT.md` |
| **Landing LP31** | **CLOSED** — FAQ + mobile nav + hybrid pricing + truth audit · `docs/landing/TRUTH_AUDIT.md` |
| **Landing LP30 swarm** | **SUPERSEDED** — install-era · `docs/landing/swarm/LP30_MANIFEST.md` |
| **Visual V0** | **CLOSED** — `docs/visual/DR1`–`DR5` |
| **Visual VF1** | **MERGED pending** — tokens + UI primitives on `visual/vf1-foundation` |
| **Visual VF2** | **PARTIAL** — boot + welcome geometry specs; matrix in CI |
| **Visual VS1–VS8** | **QUEUED** |

## VF1 contract (integrator-owned)

| File | Purpose |
|------|---------|
| `web/styles/tokens.css` | Color, type, space, z-index, motion |
| `web/styles/ui-primitives.css` | fm-button, banner, pill, sheet… |
| `web/components/ui/*` | React wrappers |

**Accent:** safety orange `#ff6b00` · **Type:** Barlow Condensed + IBM Plex Sans

## VQ harness

`web/e2e/visual/` · `scripts/lint-no-raw-hex.sh` · `.github/workflows/visual-qa.yml`

Hex lint: **soft fail** until VS lanes migrate `globals.css` (59 → 0).

## Operator-gated

Unchanged — migrations · OPS_PASSWORD · payments · pilot footage
