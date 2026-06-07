import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coachingResponseSchema } from "@foreman/shared";
import {
  applyComplianceEvidence,
  createComplianceSessionState,
} from "./compliance-evidence-handler.js";

describe("applyComplianceEvidence", () => {
  it("records a good meter_box shot on install phase", () => {
    const coaching = coachingResponseSchema.parse({
      observations: ["Meter box"],
      installQualityFlags: [],
      salesPitchFeedback: [],
      timeOnTaskNote: "x",
      nextSteps: ["y"],
      visualCallouts: [],
      evidenceShot: { type: "meter_box", isGoodEvidence: true },
    });

    const outcome = applyComplianceEvidence(
      coaching,
      "solar_install",
      createComplianceSessionState(),
      { lat: -33.8, lng: 151.2, accuracyM: 5, capturedAt: "t" },
      "2026-06-06T00:00:00.000Z",
    );

    assert.ok(outcome.state.captured.has("meter_box"));
    assert.equal(outcome.state.records.length, 1);
    assert.ok(outcome.voiceLines.length > 0);
  });
});
