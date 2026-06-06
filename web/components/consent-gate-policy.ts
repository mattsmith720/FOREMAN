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
