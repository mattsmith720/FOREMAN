<!-- orchestrate handoff
task: cto-readiness
branch: orch/foreman-production-ready/cto-readiness
agentId: bc-2ee35033-fd4b-4a52-a8c7-b5eaf99c7515
runId: run-9b577a65-19c3-4d18-b934-6f96c18b8c4b
resultStatus: error
finishedAt: 2026-06-06T02:08:11.394Z
-->

> ⚠️ Run ended with `status=error`. No structured handoff produced — the content below is the worker's raw output up to the point of failure.

Now I'll write the plan.json.Now I'll author the `plan.json`. Each worker is broad (multi-file, multi-step) and paired with a verifier; a final merge worker consolidates.