<!-- orchestrate handoff
task: docs-truth-sync
branch: orch/foreman-production-ready/docs-truth-sync
agentId: bc-242682f0-09bc-4b9d-a038-e7ae4ffd501d
runId: run-8f90367d-6942-4747-9946-6754bfdd8d97
resultStatus: finished
finishedAt: 2026-06-06T04:02:56.880Z
-->

## Status
success

## Branch
`orch/foreman-production-ready/docs-truth-sync`

## What I did
- **README.md** — Removed stale “scaffold only” claim; added production URLs, cold-start caveat, `check-ready`/`smoke` verify section, and xcodegen macOS TODO per CTO handoff.
- **DEPLOY.md** — Fixed all URLs to `foreman-phi.vercel.app` / `foreman-api-y31r.onrender.com`; synced consent UX (CPO), `/ready` + logging + cost guards (SRE), release smoke (QA); cold-start caveats in Steps 1 and 3.
- **PHONE_DEMO.md** — Synced to CPO truth (AU privacy consent copy, REC badge, status pills, button labels); added empty-frames troubleshooting row; cold-start in “Before you walk in”.
- **SECURITY.md** — Rewrote from CISO handoff (gitleaks, boot guard, middleware, rate-limit tests, file evidence table); updated consent limitation per CPO; production verify curls; cold-start note; cross-ref to DEPLOY cost guards for SRE caps.
- **YOUR_ACTIONS.md** — Synced Step 4 UI expectations to CPO (consent, REC, End job, Job complete); production URLs throughout; smoke + cold-start in Steps 3–4; billing pointer to DEPLOY cost guards.

## Measurements
- Wrong production URLs in target docs (README, DEPLOY, PHONE_DEMO, SECURITY, YOUR_ACTIONS): multiple → 0
- `<!-- TODO: ... -->` markers in target docs: 0 → 1
- Files outside allowed paths in `git diff --name-only main..HEAD`: 0 non-markdown → 0
- Render cold-start caveat present in DEPLOY.md and YOUR_ACTIONS.md: absent/partial → present

## Verification
not-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Docs describe the **integrated** product state backed by upstream handoffs (CPO, CTO, CISO, SRE, QA). `main` still lacks several referenced artifacts (`consent-gate-policy.ts`, `gitleaks.yml`, `scripts/smoke-e2e.sh`, enriched `/ready`, REC badge) until the planner merges sibling branches.
- **Rate-limit caps differ** between CISO (`SECURITY.md`: analyse 20, transcribe 30) and SRE (`DEPLOY.md`: analyse 30, transcribe 20, voice 60). Both are handoff-backed; SECURITY cross-references DEPLOY rather than silently picking one winner pre-merge.
- Single TODO: README native iOS `xcodegen` requires macOS (CTO gap doc in `native/ios/README.md`).
- `package-lock.json` dirty on VM was not committed (pre-existing, unrelated).
- No PR opened per task instructions.

## Suggested follow-ups
- Merge `cursor/cpo-product-ux-0d11`, `orch/cto-engineering/cto-deliverable`, `orch/foreman-production-ready/ciso-security`, `orch/sre-platform/health-and-deploy-docs`, and `orch/qa-release/qa-release`, then reconcile rate-limit documentation to match the integrated `index.ts`.
- Run operator live iPhone pass (YOUR_ACTIONS Step 4) with real keys — only evidence CPO verifier could not produce in-VM.
- Optional: truth-sync `PHONE_TEST.md` and `PHONE_READY.md` (still carry Jarvis/legacy labels on `main`; out of this task’s five-file acceptance set).