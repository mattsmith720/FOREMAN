import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_JOB_PHASE,
  INSTALL_JOB_PHASES,
  MAINTENANCE_JOB_PHASES,
  isMaintenancePhase,
  jobPhaseLabel,
  JOB_PHASES,
} from "./job-phase.js";

test("DEFAULT_JOB_PHASE is panel clean for maintenance pilot", () => {
  assert.equal(DEFAULT_JOB_PHASE, "panel_clean");
});

test("jobPhaseLabel returns human label", () => {
  assert.equal(jobPhaseLabel("panel_clean"), "Panel clean");
  assert.equal(jobPhaseLabel("pigeon_proofing"), "Pigeon proofing");
  assert.equal(jobPhaseLabel("customer_pitch"), "Pitch");
});

test("JOB_PHASES includes maintenance and install modes", () => {
  assert.equal(JOB_PHASES.length, 8);
  assert.equal(MAINTENANCE_JOB_PHASES.length, 5);
  assert.equal(INSTALL_JOB_PHASES.length, 3);
});

test("isMaintenancePhase identifies maintenance job types", () => {
  assert.equal(isMaintenancePhase("panel_clean"), true);
  assert.equal(isMaintenancePhase("thermal_scan"), true);
  assert.equal(isMaintenancePhase("solar_install"), false);
  assert.equal(isMaintenancePhase(undefined), false);
});

test("every job phase has a non-empty label and hint", () => {
  for (const phase of JOB_PHASES) {
    assert.ok(phase.label.length > 0, `${phase.id} label`);
    assert.ok(phase.hint.length > 0, `${phase.id} hint`);
    assert.equal(jobPhaseLabel(phase.id), phase.label);
  }
});
