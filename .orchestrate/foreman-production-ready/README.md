# Orchestrate workspace: `foreman-production-ready`

Layered planner tree for the goal **"Make Foreman production-ready E2E with layered
agents (CEO/CTO/eng) and DoDs at every level."**

Authored by the root planner (cloud agent id `bc-7b000564-637d-4bdc-998c-e825c35542f4`).

## Layers (what the planner published)

| Layer | Task | Type | DoD lives in |
|-------|------|------|--------------|
| CEO   | `foreman-production-ready` (root) | planner | `plan.acceptanceCriteria` — 9 product-readiness bullets |
| CTO   | `cto-readiness` | subplanner | `tasks[0].acceptance` — 8 technical DoD bullets that realise the CEO DoD |
| Eng   | (CTO's children) | workers + verifiers | CTO's own `plan.json` — each worker carries its own engineering DoD |
| CEO verify | `verify-ceo-product-readiness` | verifier | targets `cto-readiness`; signs off the 9 CEO DoD bullets |

The CTO subplanner is authoritative on the engineering decomposition: it reads the orchestrate
skill, decides its own worker breakdown, and publishes child tasks with concrete acceptance
criteria. See `plan.json` for the exact scopedGoals.

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
