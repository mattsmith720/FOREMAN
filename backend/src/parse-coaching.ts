import {
  coachingResponseSchema,
  type CoachingResponse,
} from "@foreman/shared";

const JSON_BLOCK_RE = /```(?:json)?\s*([\s\S]*?)```/i;

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
