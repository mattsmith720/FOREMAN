<!-- orchestrate handoff
task: merge-qa-release
branch: orch/qa-release/qa-release
agentId: bc-5a6f7a43-8665-4fb8-89a2-3da03b51ae7e
runId: run-647a706c-485d-4091-9a39-6a7461dd62fb
resultStatus: finished
finishedAt: 2026-06-06T02:50:30.273Z
-->

## Status
blocked

## Branch
`orch/qa-release/qa-release`

## What I did
- Started from `orch/qa-release/release-recipe` and confirmed `scripts/smoke-e2e.sh` exists and is executable.
- Created deliverable branch `orch/qa-release/qa-release`.
- Fetched and merged dependency branch `orch/qa-release/test-suite-green` using `git merge --no-ff orch/qa-release/test-suite-green` (it was already an ancestor, so no file-level conflicts occurred).
- Created the required consolidation merge commit with two parents and exact message: `merge: consolidate qa-release subtree` (SHA: `9875f7301dcb7e920799757d4f32023f46e6476c`).
- Ran the required acceptance commands in order, captured outputs/exit codes, and pushed `orch/qa-release/qa-release` to origin.

## Measurements
- `git log --merges -1 --format='%H %P %s'`: `9875f7301dcb7e920799757d4f32023f46e6476c c3a3433281b1ca3a2e893fb917ea90ff085eefd2 e4b345241f432ab07772a92502fb3c286057a218 merge: consolidate qa-release subtree` == recorded
- `scripts/smoke-e2e.sh executable check (test -x) exit`: `0 == 0`
- `package.json scripts.smoke occurrences ("smoke": "bash scripts/smoke-e2e.sh")`: `1 == 1`
- `DEPLOY.md "## Release smoke" heading count`: `1 == 1`
- `npm install exit code`: `0 == 0`
- `(cd backend && npm test) exit code`: `0 == 0`
- `(cd web && npm test) exit code`: `0 == 0`
- `FOREMAN_API_KEY= npm run smoke; echo exit=$?`: `2 != 0` (expected missing-key failure)
- `BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=local-smoke npm run smoke; echo exit=$?`: `1 != 0` (blocked by missing Supabase config in local env)

## Verification
unit-test-verified

## Notes, concerns, deviations, findings, thoughts, feedback
- Verbatim output (`npm install`):
```text

> foreman@0.0.0 postinstall
> npm run build:shared

> foreman@0.0.0 build:shared
> npm run build --workspace @foreman/shared

> @foreman/shared@0.0.0 build
> tsc -p tsconfig.json

up to date, audited 156 packages in 2s

36 packages are looking for funding
  run `npm fund` for details

2 vulnerabilities (1 moderate, 1 high)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

- Verbatim output (`(cd backend && npm test)`):
```text

> backend@0.0.0 test
> tsx --test src/**/*.test.ts

TAP version 13
# Subtest: parseCoachingResponse accepts valid JSON
ok 1 - parseCoachingResponse accepts valid JSON
  ---
  duration_ms: 1.684467
  ...
# Subtest: parseCoachingResponse strips markdown fences
ok 2 - parseCoachingResponse strips markdown fences
  ---
  duration_ms: 0.458545
  ...
# Subtest: parseCoachingResponse rejects invalid shape
ok 3 - parseCoachingResponse rejects invalid shape
  ---
  duration_ms: 0.499425
  ...
# Subtest: needsSummaryRetry
    # Subtest: retries when session ended but summary is still the placeholder
    ok 1 - retries when session ended but summary is still the placeholder
      ---
      duration_ms: 0.399475
      ...
    # Subtest: does not retry when summary is final
    ok 2 - does not retry when summary is final
      ---
      duration_ms: 0.079245
      ...
    # Subtest: does not retry when session is still active
    ok 3 - does not retry when session is still active
      ---
      duration_ms: 0.067913
      ...
    1..3
ok 4 - needsSummaryRetry
  ---
  duration_ms: 1.140726
  type: 'suite'
  ...
# Subtest: validateAudioBytes accepts audio/aac and normalizes to mp4
ok 5 - validateAudioBytes accepts audio/aac and normalizes to mp4
  ---
  duration_ms: 0.56799
  ...
# Subtest: validateAudioBytes rejects unknown audio types
ok 6 - validateAudioBytes rejects unknown audio types
  ---
  duration_ms: 0.321567
  ...
1..6
# tests 8
# suites 1
# pass 8
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 214.767135
```

- Verbatim output (`(cd web && npm test)`):
```text

> web@0.0.0 test
> tsx --test lib/**/*.test.ts

TAP version 13
# Subtest: dataUrlWithinLimit
    # Subtest: accepts payloads under the Vercel-safe cap
    ok 1 - accepts payloads under the Vercel-safe cap
      ---
      duration_ms: 0.611715
      ...
    # Subtest: rejects payloads over the cap
    ok 2 - rejects payloads over the cap
      ---
      duration_ms: 0.159353
      ...
    1..2
ok 1 - dataUrlWithinLimit
  ---
  duration_ms: 1.593671
  type: 'suite'
  ...
1..1
# tests 2
# suites 1
# pass 2
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 148.983051
```

- Verbatim output (`FOREMAN_API_KEY= npm run smoke; echo exit=$?`):
```text

> foreman@0.0.0 smoke
> bash scripts/smoke-e2e.sh

ERROR: FOREMAN_API_KEY is required.
Example: FOREMAN_API_KEY=local-smoke BASE_URL=http://127.0.0.1:8080 bash scripts/smoke-e2e.sh

=== Smoke E2E summary ===
sessions/start: SKIPPED - missing FOREMAN_API_KEY
analyse: SKIPPED - missing FOREMAN_API_KEY
transcribe: SKIPPED - missing FOREMAN_API_KEY
sessions/stop: SKIPPED - missing FOREMAN_API_KEY
overall: FAIL
exit=2
```

- Verbatim output (`BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=local-smoke npm run smoke; echo exit=$?`), with locally booted backend:
```text

> foreman@0.0.0 smoke
> bash scripts/smoke-e2e.sh

>> request: POST http://127.0.0.1:8080/sessions/start

=== Smoke E2E summary ===
sessions/start: FAIL - HTTP 503: Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
analyse: SKIPPED - sessions/start failed
transcribe: SKIPPED - sessions/start failed
sessions/stop: SKIPPED - sessions/start failed
overall: FAIL
exit=1
```

- I had to start backend with `npx tsx backend/src/index.ts` (plain `tsx` was unavailable in PATH in this environment).

## Suggested follow-ups
- Provide local Supabase configuration (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) in verifier environment, then rerun:
  - `BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=local-smoke npm run smoke; echo exit=$?`
- If desired, update smoke semantics to classify `/sessions/start` missing-Supabase as explicit configured-pass (currently treated as fail, which keeps strict non-zero behavior).

BLOCKED: local green-path smoke (`BASE_URL=http://127.0.0.1:8080 FOREMAN_API_KEY=local-smoke npm run smoke`) exited `1` because backend returned `503 Supabase is not configured`, so not all requested verification steps passed in this environment.