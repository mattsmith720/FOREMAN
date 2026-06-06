# CTO Engineering subtree

Orchestrate workspace for the CTO engineering subplanner under
`foreman-production-ready`. The CTO owns the technical backbone that is NOT
owned by the other C-suite siblings (CISO/SRE/QA/CPO/docs-truth-sync):

- backend non-security business logic (analyse, transcribe, summarise, voice,
  db, prompts, routes other than `/ready`)
- shared zod schemas + `FrameSource` interface
- web client platform code (`web/lib/**`, `web/app/api/**`,
  `web/next.config.mjs`)
- the iOS / Meta-glasses scaffold (CEO DoD #9)

## Tasks

| Name | Type | Purpose |
|------|------|---------|
| `vp-backend-business-logic` | worker | Harden backend AI routes + error-path tests |
| `verify-vp-backend-business-logic` | verifier | Verifies the backend hardening |
| `vp-web-platform` | worker | Harden web `lib` + `api` proxy routes; type-clean |
| `verify-vp-web-platform` | verifier | Verifies the web platform hardening |
| `vp-native-mobile` | worker | `xcodegen` sanity + DAT 0.7 confirmation + gap list |
| `merge-cto-deliverable` | worker | Consolidate the three branches into one deliverable |
| `verify-cto-engineering` | verifier | Final verification of merged deliverable |

## Notes

- The CTO planner branch is `cursor/cto-engineering-9334` (the cloud-agent
  branch this planner was spawned on). Merge children stack on top of it.
- Models are restricted to `claude-opus-4-7`, `gpt-5.3-codex-high-fast`, and
  `composer-2-fast` -- the only slugs accepted by the active CURSOR_API_KEY.
- Do NOT open PRs from inside this subtree; the parent (foreman-production-ready)
  owns merge to `main`.
