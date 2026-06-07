export type MaintenanceJobPhaseId =
  | "panel_clean"
  | "pigeon_proofing"
  | "thermal_scan"
  | "exterior_clean"
  | "commercial_clean";

export type InstallJobPhaseId =
  | "site_survey"
  | "solar_install"
  | "customer_pitch";

export type JobPhaseId = MaintenanceJobPhaseId | InstallJobPhaseId;

export interface JobPhaseOption {
  id: JobPhaseId;
  label: string;
  hint: string;
  group: "maintenance" | "install";
}

export const MAINTENANCE_JOB_PHASES: JobPhaseOption[] = [
  {
    id: "panel_clean",
    label: "Panel clean",
    hint: "Scrub, rinse, and document before/after on every array",
    group: "maintenance",
  },
  {
    id: "pigeon_proofing",
    label: "Pigeon proofing",
    hint: "Nest removal, mesh, and sign-off while still on the roof",
    group: "maintenance",
  },
  {
    id: "thermal_scan",
    label: "Thermal scan",
    hint: "Hotspots, inverter display, and report-ready captures",
    group: "maintenance",
  },
  {
    id: "exterior_clean",
    label: "Exterior clean",
    hint: "Gutters, soft wash, and property care on site",
    group: "maintenance",
  },
  {
    id: "commercial_clean",
    label: "Commercial",
    hint: "Larger arrays, team coordination, and visit records",
    group: "maintenance",
  },
];

export const INSTALL_JOB_PHASES: JobPhaseOption[] = [
  {
    id: "site_survey",
    label: "Survey",
    hint: "Spot access and roof issues before you quote",
    group: "install",
  },
  {
    id: "solar_install",
    label: "Install",
    hint: "Catch safety and quality issues before they become callbacks",
    group: "install",
  },
  {
    id: "customer_pitch",
    label: "Pitch",
    hint: "Sharpen your door-knock and close more",
    group: "install",
  },
];

/** Maintenance first for the pilot; install phases kept for other crews. */
export const JOB_PHASES: JobPhaseOption[] = [
  ...MAINTENANCE_JOB_PHASES,
  ...INSTALL_JOB_PHASES,
];

export const DEFAULT_JOB_PHASE: JobPhaseId = "panel_clean";

const MAINTENANCE_PHASE_IDS = new Set<string>(
  MAINTENANCE_JOB_PHASES.map((p) => p.id),
);

export function isMaintenancePhase(id?: string): boolean {
  return id != null && MAINTENANCE_PHASE_IDS.has(id);
}

export function jobPhaseLabel(id: JobPhaseId): string {
  return JOB_PHASES.find((phase) => phase.id === id)?.label ?? "Job";
}
