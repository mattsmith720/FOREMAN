import { apiFetch } from "./api-fetch";

/** Fire-and-forget: frame captured → cue audible (ms). Best-effort, non-blocking. */
export function reportCueE2eMs(ms: number): void {
  if (!Number.isFinite(ms) || ms < 0 || ms > 120_000) {
    return;
  }

  void apiFetch("/metrics/cue-e2e", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ms: Math.round(ms) }),
  }).catch(() => undefined);
}
