import type { CoachingResponse } from "@foreman/shared";

export function formatVisionContext(input: {
  coaching: CoachingResponse | null;
  recentTranscript: string[];
}): string | null {
  const parts: string[] = [];

  if (input.coaching?.observations[0]) {
    parts.push(`Scene: ${input.coaching.observations[0]}`);
  }

  for (const callout of input.coaching?.visualCallouts?.slice(0, 4) ?? []) {
    parts.push(
      `Visible — ${callout.label} (${callout.category}): ${callout.message}`,
    );
  }

  for (const flag of input.coaching?.installQualityFlags?.slice(0, 2) ?? []) {
    parts.push(`Quality/safety (${flag.severity}): ${flag.message}`);
  }

  const pitch = input.coaching?.salesPitchFeedback[0];
  if (pitch) {
    parts.push(`Pitch coaching: ${pitch.message}`);
  }

  const next = input.coaching?.nextSteps[0];
  if (next) {
    parts.push(`Next step on site: ${next}`);
  }

  if (input.coaching?.timeOnTaskNote) {
    parts.push(`Pacing: ${input.coaching.timeOnTaskNote}`);
  }

  const heard = input.recentTranscript.slice(-2).join(" | ");
  if (heard) {
    parts.push(`Recent audio on site: "${heard}"`);
  }

  return parts.length > 0 ? parts.join(". ") : null;
}
