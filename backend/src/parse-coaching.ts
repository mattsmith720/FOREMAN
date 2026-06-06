import {
  coachingResponseSchema,
  type CoachingResponse,
} from "@foreman/shared";

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/i;

function fallbackCoaching(note: string): CoachingResponse {
  return {
    observations: ["Could not parse coaching response for this frame."],
    installQualityFlags: [],
    salesPitchFeedback: [],
    timeOnTaskNote: note,
    nextSteps: ["Capture another frame and try again."],
    visualCallouts: [],
  };
}

export function extractJsonText(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(JSON_BLOCK_RE);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
}

export function parseCoachingResponse(raw: string): CoachingResponse {
  const jsonText = extractJsonText(raw);
  const parsed: unknown = JSON.parse(jsonText);
  return coachingResponseSchema.parse(parsed);
}

export function parseCoachingResponseWithFallback(raw: string): {
  coaching: CoachingResponse;
  usedFallback: boolean;
} {
  try {
    return {
      coaching: parseCoachingResponse(raw),
      usedFallback: false,
    };
  } catch {
    return {
      coaching: fallbackCoaching(
        "Coaching unavailable for this frame due to invalid model output.",
      ),
      usedFallback: true,
    };
  }
}
