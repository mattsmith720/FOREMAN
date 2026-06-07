import type { JobPhaseId } from "./job-phase";
import { AUTO_JOB_PHASE, isMaintenancePhase } from "./job-phase";

export type InteractionMode = "scan" | "watch";

/** Auto-detect and pitch = continuous watch. Other phases = point-and-verdict. */
export function interactionModeForPhase(jobPhase: JobPhaseId): InteractionMode {
  if (jobPhase === AUTO_JOB_PHASE || jobPhase === "customer_pitch") {
    return "watch";
  }
  if (
    jobPhase === "solar_install" ||
    jobPhase === "site_survey" ||
    isMaintenancePhase(jobPhase)
  ) {
    return "scan";
  }
  return "watch";
}
