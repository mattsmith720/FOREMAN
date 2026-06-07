"use client";

import {
  DEFAULT_JOB_PHASE,
  MAINTENANCE_JOB_PHASES,
  type JobPhaseId,
} from "../lib/job-phase";

interface JobPhasePickerProps {
  value: JobPhaseId;
  onChange: (phase: JobPhaseId) => void;
  disabled?: boolean;
}

/** Maintenance-only compact picker for field techs. */
export function JobPhasePicker({
  value,
  onChange,
  disabled = false,
}: JobPhasePickerProps) {
  return (
    <div
      className="job-phase-picker job-phase-picker--simple"
      role="group"
      aria-label="Job type"
    >
      {MAINTENANCE_JOB_PHASES.map((phase) => (
        <button
          key={phase.id}
          type="button"
          className={`job-phase-option ${value === phase.id ? "active" : ""}`}
          disabled={disabled}
          aria-pressed={value === phase.id}
          onClick={() => onChange(phase.id)}
        >
          {phase.label}
        </button>
      ))}
    </div>
  );
}

export { DEFAULT_JOB_PHASE };
