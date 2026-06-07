import type { JobPhaseId } from "./job-phase";
import { isMaintenancePhase } from "./job-phase";

export type InteractionMode = "scan" | "watch";

/** Maintenance + install + survey = point-and-verdict (phone in hand). Pitch stays adaptive. */
export function interactionModeForPhase(jobPhase: JobPhaseId): InteractionMode {
  if (
    jobPhase === "solar_install" ||
    jobPhase === "site_survey" ||
    isMaintenancePhase(jobPhase)
  ) {
    return "scan";
  }
  return "watch";
}
