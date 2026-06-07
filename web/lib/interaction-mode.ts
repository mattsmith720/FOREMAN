import type { JobPhaseId } from "./job-phase";

export type InteractionMode = "scan" | "watch";

/** Install + survey = point-and-verdict (phone in hand). Pitch stays adaptive. */
export function interactionModeForPhase(jobPhase: JobPhaseId): InteractionMode {
  if (jobPhase === "solar_install" || jobPhase === "site_survey") {
    return "scan";
  }
  return "watch";
}
