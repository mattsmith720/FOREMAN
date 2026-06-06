import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { coachingResponseSchema } from "@foreman/shared";
import { maxCalloutsForPhase, phaseGuidance } from "./analysis-phases.js";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(path.join(fixturesDir, name), "utf8"));
}

test("phaseGuidance returns phase-specific text for known phases", () => {
  assert.match(phaseGuidance("site_survey") ?? "", /SURVEY/);
  assert.match(phaseGuidance("solar_install") ?? "", /SAFETY FIRST/);
  assert.match(phaseGuidance("customer_pitch") ?? "", /PITCH/);
  assert.equal(phaseGuidance("unknown"), null);
  assert.equal(phaseGuidance(undefined), null);
});

test("maxCalloutsForPhase keeps install quieter than survey/pitch", () => {
  assert.equal(maxCalloutsForPhase("solar_install"), 2);
  assert.equal(maxCalloutsForPhase("site_survey"), 3);
  assert.equal(maxCalloutsForPhase("customer_pitch"), 3);
  assert.equal(maxCalloutsForPhase(undefined), 3);
});

test("phase coaching fixtures match the coaching schema", () => {
  for (const name of [
    "coaching-site-survey.json",
    "coaching-solar-install.json",
    "coaching-customer-pitch.json",
  ]) {
    const result = coachingResponseSchema.safeParse(loadFixture(name));
    assert.ok(
      result.success,
      `${name} should match schema${
        result.success ? "" : `: ${JSON.stringify(result.error.issues)}`
      }`,
    );
  }
});

test("fixtures reflect phase priorities", () => {
  const install = coachingResponseSchema.parse(
    loadFixture("coaching-solar-install.json"),
  );
  assert.ok(
    install.installQualityFlags.some((flag) => flag.severity === "critical"),
    "install fixture leads with a critical safety flag",
  );

  const pitch = coachingResponseSchema.parse(
    loadFixture("coaching-customer-pitch.json"),
  );
  assert.ok(
    pitch.salesPitchFeedback.length > 0,
    "pitch fixture critiques the conversation",
  );
});
