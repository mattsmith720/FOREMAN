# Orchestrate workspace: `foreman-production-ready`

Layered planner tree for the goal **"Make Foreman production-ready E2E with layered
agents (CEO/CTO/eng) and DoDs at every level."**

Authored by the root planner (cloud agent id `bc-7b000564-637d-4bdc-998c-e825c35542f4`).

## Layers (what the planner published)

Full C-suite org. The root is the CEO; five C-suite subplanners own one CEO DoD cluster each;
a docs worker reconciles documentation; a merge worker ships a single deliverable branch; the
CEO verifier signs off all 9 CEO DoD bullets.

| Layer | Task | Type | DoD lives in |
|-------|------|------|--------------|
| CEO   | `foreman-production-ready` (root) | planner | `plan.acceptanceCriteria` — 9 product-readiness bullets |
| CPO   | `cpo-product-ux` | subplanner | own plan.json under `.orchestrate/cpo-product-ux/`; covers CEO DoD #2 (phone E2E walk) and #4 (consent + recording indicator + AU privacy copy) |
| CTO   | `cto-engineering` | subplanner | own plan.json under `.orchestrate/cto-engineering/`; covers CEO DoD #9 (iOS scaffold) + technical backbone (backend business logic, web platform, shared, native) |
| CISO  | `ciso-security` | subplanner | own plan.json under `.orchestrate/ciso-security/`; covers CEO DoD #3 (gitleaks, prod boot refusal, CORS, rate limits, Vercel origin gate) |
| SRE   | `sre-platform` | subplanner | own plan.json under `.orchestrate/sre-platform/`; covers CEO DoD #1 (URL health), #5 (cost guards), #6 (/ready booleans + structured logs + log docs) |
| QA    | `qa-release` | subplanner | own plan.json under `.orchestrate/qa-release/`; covers CEO DoD #7 (build + tests + smoke-e2e + readiness scripts) |
| Docs  | `docs-truth-sync` + `verify-docs-truth-sync` | worker + verifier | covers CEO DoD #8 (docs match reality); depends on all five subplanners |
| Merge | `merge-production-ready` | worker | merges all six upstream branches into a single deliverable; depends on docs + all five subplanners |
| CEO verify | `verify-ceo-product-readiness` | verifier | targets `merge-production-ready`; evidences all 9 CEO DoD bullets |

Each subplanner is authoritative on its own engineering decomposition: it reads the orchestrate
skill, decides its own worker breakdown, and publishes child tasks (workers + verifiers) with
concrete engineering acceptance criteria.

## Running the loop

```bash
cd <path-to-orchestrate-skill>/scripts
bun cli.ts run --root /workspace/.orchestrate/foreman-production-ready
```

Exit `0` = clean. Exit `100` = checkpoint restart, rerun the same command. Exit `1` with a
non-empty error set = a worker died; the script wrote a synthetic
`handoffs/<task>-failure.md` and the root planner makes the next decision.

Inspect with:

```bash
bun cli.ts tree    /workspace/.orchestrate/foreman-production-ready
bun cli.ts list    /workspace/.orchestrate/foreman-production-ready
bun cli.ts status  /workspace/.orchestrate/foreman-production-ready
```

## Required environment

The root planner cannot spawn child cloud agents without these:

| Env var | Source | Required? |
|---------|--------|-----------|
| `CURSOR_API_KEY` | [Cursor Dashboard > Integrations](https://cursor.com/dashboard/integrations) (must be a personal/user key, **not** a team key) | **Yes** — without it `bun cli.ts run` exits 2 with `CURSOR_API_KEY required` |
| `SLACK_BOT_TOKEN` | Slack app with the scopes listed in `orchestrate/references/planner.md` | Optional — Slack visibility only; correctness unchanged |
| `SLACK_CHANNEL_ID` | Slack channel where the run thread lives | Optional, paired with `SLACK_BOT_TOKEN` (or use `--slack-channel`) |

For Cursor Cloud agents, set these via **Cursor Dashboard → Cloud Agents → Secrets** so they
are injected into every new cloud-agent VM.

## What is *not* on this planner's plate

- Rotating ANTHROPIC / OPENAI / Supabase / ElevenLabs API keys — those are operator-owned and
  any DoD item depending on them is escalated by the CTO into the handoff `## Notes` instead
  of being failed.
- iPhone hardware testing — done by the operator from their own device against
  https://foreman-phi.vercel.app.
