export type ActivityKind =
  | "capture"
  | "analyse"
  | "coaching"
  | "transcript"
  | "voice"
  | "saved"
  | "system";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  message: string;
  ts: number;
}

let counter = 0;

export function createActivity(
  kind: ActivityKind,
  message: string,
): ActivityItem {
  counter += 1;
  return {
    id: `act-${counter}-${Date.now()}`,
    kind,
    message,
    ts: Date.now(),
  };
}

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  capture: "Frame",
  analyse: "AI",
  coaching: "Coach",
  transcript: "Heard",
  voice: "Voice",
  saved: "Saved",
  system: "System",
};
