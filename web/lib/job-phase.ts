export type JobPhaseId = "site_survey" | "solar_install" | "customer_pitch";

export interface JobPhaseOption {
  id: JobPhaseId;
  label: string;
  hint: string;
}

export const JOB_PHASES: JobPhaseOption[] = [
  {
    id: "site_survey",
    label: "Survey",
    hint: "Walk the site and assess the roof",
  },
  {
    id: "solar_install",
    label: "Install",
    hint: "On-roof quality, safety, and pacing",
  },
  {
    id: "customer_pitch",
    label: "Pitch",
    hint: "Door-knock and customer conversation",
  },
];

export const DEFAULT_JOB_PHASE: JobPhaseId = "solar_install";

export function jobPhaseLabel(id: JobPhaseId): string {
  return JOB_PHASES.find((phase) => phase.id === id)?.label ?? "Job";
}
