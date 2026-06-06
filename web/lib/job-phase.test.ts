import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_JOB_PHASE,
  jobPhaseLabel,
  JOB_PHASES,
} from "./job-phase.js";

test("DEFAULT_JOB_PHASE is install", () => {
  assert.equal(DEFAULT_JOB_PHASE, "solar_install");
});

test("jobPhaseLabel returns human label", () => {
  assert.equal(jobPhaseLabel("customer_pitch"), "Pitch");
  assert.equal(jobPhaseLabel("site_survey"), "Survey");
});

test("JOB_PHASES includes all field modes", () => {
  assert.equal(JOB_PHASES.length, 3);
});
