# Phase A recon summary (R1–R10)

Read-only recon completed by parallel agents. Build orders executed in Phase B lanes L1–L10.

| Agent | Lane | Top gaps found |
|-------|------|----------------|
| R1 | L1 | E2E latency only on played cues; HUD/ops cost drift |
| R2 | L2 | Empty visualCallouts; hero ≠ spokenCue; shutdown "here" |
| R3 | L3 | Rear camera only; geolocation blocked; weak type guards |
| R4 | L4 | JSON manifest only — no ZIP endpoint |
| R5 | L5 | eval-coaching in ci.yml only; no CER frames |
| R6 | L6 | No scene-change or spend cap modules |
| R7 | L7 | window.prompt review; retries: 0; no dataset stats |
| R8 | L8 | Stop proxy 15s vs 60s summary; transcribe zero retries |
| R9 | L9 | Swift model missing visualCallouts/evidenceShot |
| R10 | L10 | Stale pilot docs; undersized touch targets |

Integration branch `swarm/integrate-all` merges all lanes + integrator CONTRACT wiring.
