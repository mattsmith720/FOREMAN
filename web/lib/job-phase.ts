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
    hint: "Spot access and roof issues before you quote",
  },
  {
    id: "solar_install",
    label: "Install",
    hint: "Catch safety and quality issues before they become callbacks",
  },
  {
    id: "customer_pitch",
    label: "Pitch",
    hint: "Sharpen your door-knock and close more",
  },
];

export const DEFAULT_JOB_PHASE: JobPhaseId = "solar_install";

export function jobPhaseLabel(id: JobPhaseId): string {
  return JOB_PHASES.find((phase) => phase.id === id)?.label ?? "Job";
}
