import type {
  CoachingCategory,
  CoachingResponse,
  VisualCallout,
} from "@foreman/shared";

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

function calloutToCategory(
  category: VisualCallout["category"],
): CoachingCategory {
  switch (category) {
    case "safety":
      return "safety";
    case "pitch":
    case "upsell":
      return "pitch";
    case "time":
      return "time";
    default:
      // quality, cleanliness, damage
      return "quality";
  }
}

export function coachingToEvents(
  sessionId: string,
  coaching: CoachingResponse,
  ts: Date,
): CoachingEventInsert[] {
  const iso = ts.toISOString();
  const events: CoachingEventInsert[] = [];
  const seen = new Set<string>();

  const push = (
    category: CoachingCategory,
    message: string,
    severity: "info" | "warning" | "critical",
  ) => {
    if (seen.has(message)) {
      return;
    }
    seen.add(message);
    events.push({ session_id: sessionId, ts: iso, category, message, severity });
  };

  for (const flag of coaching.installQualityFlags) {
    push(
      isSafetyMessage(flag.message) ? "safety" : "quality",
      flag.message,
      flag.severity,
    );
  }

  for (const item of coaching.salesPitchFeedback) {
    push("pitch", item.message, item.severity);
  }

  // Visual callouts carry the model's own category (including 'safety'/'damage'),
  // so persist them as events too — otherwise on-frame safety calls never reach
  // coaching_events or the post-job review. De-duped against flags by message.
  for (const callout of coaching.visualCallouts ?? []) {
    push(calloutToCategory(callout.category), callout.message, callout.severity);
  }

  if (coaching.timeOnTaskNote) {
    push("time", coaching.timeOnTaskNote, "info");
  }

  // nextSteps are intentionally NOT events: they persist as labels
  // (coachingToLabels) and the prompt requires one every frame, so emitting them
  // as info events would flood coaching_events with noise.

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
