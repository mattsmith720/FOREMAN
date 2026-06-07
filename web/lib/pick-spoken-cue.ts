import type { CoachingResponse } from "@foreman/shared";

export interface SpokenCue {
  text: string;
  severity: "info" | "warning" | "critical";
}

/**
 * The single line Foreman should SAY for this frame — safety-first, and the
 * same selection the hero card shows (spoken == shown). Returns null when there
 * is nothing worth interrupting a hands-free worker for (observations are never
 * spoken). Prefers the model's ear-first `spokenCue` when present (Wave 2).
 */
export function pickSpokenCue(
  coaching: CoachingResponse | null,
  jobPhase?: string,
): SpokenCue | null {
  if (!coaching) {
    return null;
  }

  // Ear-first field from the backend (optional — added to the coaching schema).
  const spoken = (
    coaching as unknown as {
      spokenCue?: { say?: string; severity?: string; speak?: boolean };
    }
  ).spokenCue;
  if (spoken) {
    if (spoken.speak === false) {
      return null;
    }
    if (spoken.say && spoken.say.trim()) {
      return {
        text: spoken.say.trim(),
        severity: (spoken.severity as SpokenCue["severity"]) ?? "info",
      };
    }
  }

  const callouts = coaching.visualCallouts ?? [];

  const criticalFlag = coaching.installQualityFlags.find(
    (f) => f.severity === "critical",
  );
  if (criticalFlag) {
    return { text: criticalFlag.message, severity: "critical" };
  }
  const criticalCallout = callouts.find((c) => c.severity === "critical");
  if (criticalCallout) {
    return { text: criticalCallout.message, severity: "critical" };
  }

  const warningFlag = coaching.installQualityFlags.find(
    (f) => f.severity === "warning",
  );
  if (warningFlag) {
    return { text: warningFlag.message, severity: "warning" };
  }
  const warningCallout = callouts.find((c) => c.severity === "warning");
  if (warningCallout) {
    return { text: warningCallout.message, severity: "warning" };
  }

  if (jobPhase === "customer_pitch" && coaching.salesPitchFeedback[0]) {
    const pitch = coaching.salesPitchFeedback[0];
    return { text: pitch.message, severity: pitch.severity };
  }

  if (coaching.nextSteps[0]) {
    return { text: coaching.nextSteps[0], severity: "info" };
  }

  // Suppress plain observations from being spoken — they're noise on glasses.
  return null;
}
