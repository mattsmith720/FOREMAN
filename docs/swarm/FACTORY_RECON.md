# Factory Programs E–H — recon-delta (wave 1)

Mega A–D closed. Factory opens with this delta against current `main`.

## E — Self-improving intelligence

| Lane | Baseline | Gap |
|------|----------|-----|
| E1 Prompt factory | Static prompt in `backend/src/prompts/` | No variant rounds, lineage archive, or promotion gate |
| E2 Few-shot retrieval | Eval fixtures only | No labelled-frame retrieval into `/analyse` |
| E3 Cost engine | Per-route rate limits + session cost HUD | No cheap pre-filter, prompt caching, or resolution ladder |
| E4 Regression sentinel | `eval-coaching.yml` + E2E on PR | No nightly cron, bisect, or auto board item |

## F — Rules as data

| Lane | Baseline | Gap |
|------|----------|-----|
| F1 Compliance → config | Hard-coded `compliance-pack.ts` + CER strings in prompt | Not versioned schema-checked config consumed by capture/verdict/pack/validator |
| F2 Second vertical proof | Solar install only | No flagged electrical switchboard kit |
| F3 Rule-to-config trace | `TRUST_AUDIT.md` claims | No CER requirement → config key map doc |

## G — True hands-free

| Lane | Baseline | Gap |
|------|----------|-----|
| G1 Voice commands | Tap pause/resume/stop | No Web Speech API grammar |
| G2 Audio UX | `coach-voice.ts` TTS | No severity earcons, ducking, or site-noise phrasing pass |
| G3 Launch friction | Worker profile + consent remember | No QR/preset cold-open metric; not under 10s measured |

## H — Ship like a company

| Lane | Baseline | Gap |
|------|----------|-----|
| H1 Feature flags | Env vars ad hoc | No documented flag lifecycle |
| H2 Release engineering | Git tags informal | No CHANGELOG generator or rollback runbook |
| H3 Seat + metering | Ops cost estimate | No per-seat usage persistence for Blake |
| H4 Second-customer onboarding | Single pilot org | No self-serve org flow (flagged) |
| H5 Repo constitution | `CLAUDE.md` | No `AGENTS.md` + setup script |
| H6 Chaos + soak | Golden-path E2E | No hostile network/backend-kill profiles |
| H7 Competitor dossier | — | `COMPETITORS.md` not written |

## Recommended wave 1 build order (≤8 lanes)

H5 · H1 · F1 · E4 · G1 · G3 · H6 · H7 (if web access)
