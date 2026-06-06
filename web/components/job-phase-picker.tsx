"use client";

import {
  DEFAULT_JOB_PHASE,
  JOB_PHASES,
  type JobPhaseId,
} from "../lib/job-phase";

interface JobPhasePickerProps {
  value: JobPhaseId;
  onChange: (phase: JobPhaseId) => void;
  disabled?: boolean;
}

export function JobPhasePicker({
  value,
  onChange,
  disabled = false,
}: JobPhasePickerProps) {
  return (
    <div className="job-phase-picker" role="group" aria-label="Job phase">
      {JOB_PHASES.map((phase) => (
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
  );
}

export { DEFAULT_JOB_PHASE };
