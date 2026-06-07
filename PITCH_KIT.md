# Foreman — Investor one-pager (Blake)

**Live pilot:** [foreman-phi.vercel.app](https://foreman-phi.vercel.app)  
**Audit baseline:** 2026-06-07 · [docs/swarm/TRUST_AUDIT.md](docs/swarm/TRUST_AUDIT.md)

---

## The problem

Solar installers lose margin on rework, compliance gaps, and weak door-to-door pitches. Managers cannot be on every roof or every knock. Field teams need a coach in their pocket — and every job should leave a queryable record, not a camera roll nobody reviews.

## What Foreman is

An **AI coaching layer for field work** — camera and mic on the job, live structured coaching (safety, quality, pitch, pacing), and automatic job logging to Postgres. Clients are thin (iPhone Safari today; Meta smart glasses later). The **analysis engine and dataset live in the backend** — the data is the moat.

## What ships today (trust-audited)

| Capability | Audit verdict | Notes |
|------------|---------------|-------|
| Production deploy (web + API) | **VERIFIED** | Prod smoke **PASS** |
| Live vision coaching + job logging | **VERIFIED** | Clean-room gate: build, lint, **73** backend + **65** web tests |
| Install compliance — six guided shots + geo stamp | **VERIFIED** | **6** guided compliance shots |
| Evidence pack (ZIP on end job) | **VERIFIED** | Stamped JPEGs + manifest |
| Scan mode + CER spoken verdicts | **VERIFIED** | 5/5 fixture spoken lines |
| Ops export provenance | **VERIFIED** | `label_source` in session export (post-audit fix) |

**Measured quality (scored eval subset):** **6/11** scenarios scored (**54.5%** coverage); **31/31** rubric pass on scored scenarios (**100%** on what we grade today). Full CER golden coverage is Program A work — not claimed as shipped.

**Honest partials (do not oversell):** cue latency HUD and $/session cost model are wired (`analyse_usd` **0.015** in prod) but ops latency readout is operator-gated. Scene-change skip has no prod counter yet. iOS models updated; native build unverified in audit.

**Not shipped (audit FALSE — Program B):** PDF deliverable, serial OCR check, four-stage attendance selfies (code has **2** selfies today).

## Why it wins

1. **Every job compounds.** Frames, transcripts, coaching events, and labels land in Supabase — proprietary training data competitors cannot buy.
2. **Swap the camera, keep the brain.** Same backend whether the feed is phone browser or glasses.
3. **Australian pilot fit.** Consent gate, CER install flow, geo-stamped evidence pack — built for compliance-heavy solar, not generic “AI wrapper.”

## The ask

Pilot with one installer crew on real jobs → tighten eval coverage → Blake-facing dashboard (Program B) → scale data flywheel.

**5-minute live walk:** [DEMO_SCRIPT_5MIN.md](DEMO_SCRIPT_5MIN.md) · URL: `/` (root — dedicated `/demo` route not merged yet).

---

*All counts and verdicts above are cited from [docs/swarm/TRUST_AUDIT.md](docs/swarm/TRUST_AUDIT.md) only (audit date 2026-06-07).*
