import type { CoachingResponse } from "@foreman/shared";
import type { JobPhaseId } from "./job-phase";
import { pickSpokenCue, type SpokenCue } from "./pick-spoken-cue";

export interface VerdictCuePlan {
  cue: SpokenCue;
  isNewHero: boolean;
}

/** Lane L2 — spoken verdict selection (pure; voice playback stays in coach-voice). */
export function planVerdictCue(
  coaching: CoachingResponse,
  jobPhase: JobPhaseId,
  lastHeroText: string,
): VerdictCuePlan | null {
  const cue = pickSpokenCue(coaching, jobPhase);
  if (!cue || cue.text === lastHeroText) {
    return null;
  }
  return { cue, isNewHero: true };
}
