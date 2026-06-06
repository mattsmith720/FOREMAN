export type CaptureStatus =
  | "idle"
  | "running"
  | "analysing"
  | "summarising"
  | "error";

export function canCapture(hasConsented: boolean): boolean {
  return hasConsented;
}

export function recordingIndicatorVisible(status: CaptureStatus): boolean {
  return (
    status === "running" ||
    status === "analysing" ||
    status === "summarising"
  );
}

export type BackendStatus = "unknown" | "waking" | "ready" | "slow";

/**
 * Cold-start status line for the boot screen. null = render nothing
 * (ready, or not yet checked). "slow" prompts the worker to retry/wait.
 */
export function backendStatusMessage(status: BackendStatus): string | null {
  switch (status) {
    case "waking":
      return "Waking Foreman…";
    case "slow":
      return "Still waking — a server cold start can take 30–60s. Tap Retry.";
    case "ready":
    case "unknown":
    default:
      return null;
  }
}
