import type { CoachingCategory, CoachingResponse } from "@foreman/shared";

export interface CoachingEventInsert {
  session_id: string;
  ts: string;
  category: CoachingCategory;
  message: string;
  severity: "info" | "warning" | "critical";
}

function isSafetyMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("safety") ||
    lower.includes("harness") ||
    lower.includes("fall") ||
    lower.includes("ppe") ||
    lower.includes("arc flash") ||
    lower.includes("isolation")
  );
}

export function coachingToEvents(
  sessionId: string,
  coaching: CoachingResponse,
  ts: Date,
): CoachingEventInsert[] {
  const iso = ts.toISOString();
  const events: CoachingEventInsert[] = [];

  for (const flag of coaching.installQualityFlags) {
    events.push({
      session_id: sessionId,
      ts: iso,
      category: isSafetyMessage(flag.message) ? "safety" : "quality",
      message: flag.message,
      severity: flag.severity,
    });
  }

  for (const item of coaching.salesPitchFeedback) {
    events.push({
      session_id: sessionId,
      ts: iso,
      category: "pitch",
      message: item.message,
      severity: item.severity,
    });
  }

  if (coaching.timeOnTaskNote) {
    events.push({
      session_id: sessionId,
      ts: iso,
      category: "time",
      message: coaching.timeOnTaskNote,
      severity: "info",
    });
  }

  for (const step of coaching.nextSteps) {
    events.push({
      session_id: sessionId,
      ts: iso,
      category: "quality",
      message: step,
      severity: "info",
    });
  }

  return events;
}

export function coachingToLabels(
  sessionId: string,
  coaching: CoachingResponse,
): Array<{ session_id: string; key: string; value: string }> {
  const labels: Array<{ session_id: string; key: string; value: string }> = [];

  for (const observation of coaching.observations) {
    labels.push({
      session_id: sessionId,
      key: "observation",
      value: observation,
    });
  }

  for (const step of coaching.nextSteps) {
    labels.push({
      session_id: sessionId,
      key: "next_step",
      value: step,
    });
  }

  return labels;
}
