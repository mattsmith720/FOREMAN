import type { CoachingResponse } from "@foreman/shared";
import { isLiveCoachActive, sendLiveVisionContext } from "./coach-live";
import { formatVisionContext } from "./format-live-vision";

export function syncLiveVisionContext(input: {
  coaching: CoachingResponse | null;
  recentTranscript: string[];
}): boolean {
  if (!isLiveCoachActive()) {
    return false;
  }

  const text = formatVisionContext(input);
  if (!text) {
    return false;
  }

  return sendLiveVisionContext(text);
}
