# cpo-product-ux

CPO subplanner for `foreman-production-ready`. Owns CEO DoD #2 (full phone end-to-end customer walk) and #4 (privacy + consent UX).

## Decomposition

1. `consent-and-recording-ux` (worker, gpt-5.3-codex-high-fast) — structural consent gate in `web/components/camera-coach.tsx`, visible recording indicator, AU privacy / sensitive-data copy in the consent overlay, web test for both contracts. Extends `web/package.json` test glob to also pick up `components/**/*.test.{ts,tsx}`.
2. `phone-walk-polish` (worker, composer-2-fast, depends on W1) — empty/error-state polish across the camera-coach UI, iPhone Safari viewport fit, screen-recording artifact of the full walk (or UI states if API keys / camera are unavailable inside the VM).
3. `demo-script-truth-sync` (worker, composer-2-fast, depends on W1) — PHONE_DEMO.md, YOUR_ACTIONS.md, PHONE_TEST.md updated so every selector text / button label / status badge matches the UI on this branch.
4. `verify-cpo-product-ux` (verifier, claude-opus-4-7, depends on W1+W2+W3) — runs `cd web && npm test`, `npm run build --workspace web`, reads the source for the structural consent guard, spot-checks the docs against the UI, and reports per-acceptance-criterion evidence.

## Branches

The CPO subplanner runs on `cursor/cpo-product-ux-0d11`. Each child task spawns its own orchestrate-managed branch under `orch/cpo-product-ux/<task-name>`. The final handoff branch is `phone-walk-polish` (which has both `consent-and-recording-ux` and `phone-walk-polish` changes; the verifier merges `demo-script-truth-sync` on top before reporting).

## Constraints

- `tasks[].model` is one of `claude-opus-4-7`, `gpt-5.3-codex-high-fast`, or `composer-2-fast` (the active `CURSOR_API_KEY` rejects others as `invalid_model`).
- No child opens a PR — the root planner aggregates and decides.
- `web/lib/**`, `web/app/api/**`, `web/middleware.ts`, `web/next.config.mjs`, `web/vercel.json`, and the parent's `.orchestrate/foreman-production-ready/**` are off-limits.
