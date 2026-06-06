<!-- orchestrate failure handoff
task: cto-readiness
branch: orch/foreman-production-ready/cto-readiness
agentId: bc-2ee35033-fd4b-4a52-a8c7-b5eaf99c7515
runId: run-9b577a65-19c3-4d18-b934-6f96c18b8c4b
failureMode: unknown
terminatedAt: 2026-06-06T02:08:11.394Z
-->

# cto-readiness failure handoff

Status: error (cloud agent terminated without writing a handoff)
Failure mode: unknown
Cloud agent: bc-2ee35033-fd4b-4a52-a8c7-b5eaf99c7515
Started: 2026-06-06T01:35:55.768Z
Terminated: 2026-06-06T02:08:11.394Z
Duration: 1935626ms
Last activity: 2026-06-06T02:08:11.213Z - manual reset: prior 2 spawn attempts hit (1) invalid_model on default subplanner slug then (2) resume-from-nonexistent-placeholder-branch; attempts zeroed so the first new attempt starts from `main`.
Last tool call: todo_write
Branch: orch/foreman-production-ready/cto-readiness
SDK error: (none recorded)

## Suggested next steps
- Retry as-is (treat as transient)
- Retry with smaller scope if this repeats
- Retry with different model if the same tool keeps failing
- Abandon: skip task, replan around it
