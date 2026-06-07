import { apiFetch } from "./api-fetch";

function roundCueE2eMs(ms: number): number | null {
  if (!Number.isFinite(ms) || ms < 0 || ms > 120_000) {
    return null;
  }
  return Math.round(ms);
}

/** Fire-and-forget: frame captured → spoken cue attempt (ms). Best-effort, non-blocking. */
export function reportCueE2eMs(ms: number): void {
  const rounded = roundCueE2eMs(ms);
  if (rounded === null) {
    return;
  }

  void apiFetch("/metrics/cue-e2e", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ms: rounded }),
  }).catch(() => undefined);
}

/** Frame capture timestamp → spoken cue attempt latency (ms). Returns rounded ms or 0. */
export function reportSpokenCueAttemptMs(startedAt: number): number {
  const ms = roundCueE2eMs(performance.now() - startedAt) ?? 0;
  if (ms > 0) {
    reportCueE2eMs(ms);
  }
  return ms;
}
