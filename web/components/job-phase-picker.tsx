"use client";

import {
  DEFAULT_JOB_PHASE,
  INSTALL_JOB_PHASES,
  MAINTENANCE_JOB_PHASES,
  type JobPhaseId,
} from "../lib/job-phase";

interface JobPhasePickerProps {
  value: JobPhaseId;
  onChange: (phase: JobPhaseId) => void;
  disabled?: boolean;
}

function PhaseGroup({
  legend,
  phases,
  value,
  onChange,
  disabled,
}: {
  legend: string;
  phases: typeof MAINTENANCE_JOB_PHASES;
  value: JobPhaseId;
  onChange: (phase: JobPhaseId) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="job-phase-group">
      <legend>{legend}</legend>
      <div className="job-phase-picker" role="group" aria-label={legend}>
        {phases.map((phase) => (
          <button
            key={phase.id}
            type="button"
            className={`job-phase-option ${value === phase.id ? "active" : ""}`}
            disabled={disabled}
            aria-pressed={value === phase.id}
            onClick={() => onChange(phase.id)}
          >
            <span className="job-phase-label">{phase.label}</span>
            <span className="job-phase-hint">{phase.hint}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function JobPhasePicker({
  value,
  onChange,
  disabled = false,
}: JobPhasePickerProps) {
  return (
    <div className="job-phase-picker-wrap">
      <PhaseGroup
        legend="Maintenance"
        phases={MAINTENANCE_JOB_PHASES}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      <PhaseGroup
        legend="Install"
        phases={INSTALL_JOB_PHASES}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export { DEFAULT_JOB_PHASE };
