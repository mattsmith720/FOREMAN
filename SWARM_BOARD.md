# FOREMAN Swarm Board

**Production:** https://foreman-phi.vercel.app · `/demo` · `/welcome`  
**Orchestrator:** integrator-only `main` pushes

## Queue discipline

| Phase | Status |
|-------|--------|
| Phase 0 Trust audit | **CLOSED** — `docs/swarm/TRUST_AUDIT.md` |
| Mega Programs A–D | **PARTIAL** — A closed; B/C/D wave 2 merged — `docs/swarm/MEGA_CLOSURE.md` |
| Factory Programs E–H | **QUEUED** — opens when Mega B2–B5, C3, D2–D3 close OR operator waives |

## Mega A — Prove it (CLOSED)

| Lane | SHA | Metric |
|------|-----|--------|
| A1 fixtures | merged | 10 CER JPEG pairs |
| A2 E2E | merged | Playwright smoke |
| A3 validator | merged | `validate-pack` |
| A4 eval | merged | **11/11** scenarios · **97%** rubric |
| A5 bench | merged | `npm run bench` |

## Mega B/C/D — wave 2 merged

| Lane | Status | Deliverable |
|------|--------|-------------|
| B1 offline | PARTIAL (lib only) | IndexedDB queue + sync |
| C1 demo | merged | `/demo` |
| C2 landing | merged | `/welcome` |
| C4 pitch | merged | `PITCH_KIT.md` |
| D1 observability | PARTIAL (backend) | structured JSON logs |
| D4 backup | merged | `backup-supabase.sh` |

## Mega backlog (blocks Factory)

B2 · B3 · B4 · B5 · C3 · D2 · D3

## Factory (not started)

E1–E4 · F1–F3 · G1–G3 · H1–H7

## Operator-gated

Supabase migrations · OPS_PASSWORD · payments · Sentry · real pilot footage · legal review
