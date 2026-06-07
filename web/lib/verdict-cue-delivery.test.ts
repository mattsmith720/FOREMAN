import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planVerdictCue } from "./verdict-cue-delivery.js";

describe("planVerdictCue", () => {
  it("returns null when hero text unchanged", () => {
    const plan = planVerdictCue(
      {
        observations: [],
        installQualityFlags: [
          { message: "Add label now", severity: "warning" },
        ],
        salesPitchFeedback: [],
        timeOnTaskNote: "x",
        nextSteps: ["y"],
        visualCallouts: [],
        spokenCue: { say: "Add label now", severity: "warning", speak: true },
      },
      "solar_install",
      "Add label now",
    );
    assert.equal(plan, null);
  });
});
