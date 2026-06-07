import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { coachingResponseSchema } from "@foreman/shared";
import {
  applyComplianceEvidence,
  createComplianceSessionState,
  facingModeForEvidenceType,
  facingModeForShot,
  RETAKE_ESCALATION_THRESHOLD,
  shouldAccelerateCapture,
} from "./compliance-evidence-handler.js";

function baseCoaching(
  overrides: Partial<ReturnType<typeof coachingResponseSchema.parse>> = {},
) {
  return coachingResponseSchema.parse({
    observations: ["x"],
    installQualityFlags: [],
    salesPitchFeedback: [],
    timeOnTaskNote: "x",
    nextSteps: ["y"],
    visualCallouts: [],
    ...overrides,
  });
}

describe("facingModeForShot", () => {
  it("uses front camera for selfie shots", () => {
    assert.equal(facingModeForShot("setup"), "user");
    assert.equal(facingModeForShot("testing"), "user");
    assert.equal(facingModeForShot("meter_box"), "environment");
  });

  it("maps evidence types to facing mode", () => {
    assert.equal(facingModeForEvidenceType("setup"), "user");
    assert.equal(facingModeForEvidenceType("meter_box"), "environment");
  });
});

describe("shouldAccelerateCapture", () => {
  it("accelerates on same-target bad evidence", () => {
    const target = { id: "setup" as const, prompt: "Selfie", evidenceType: "setup" };
    assert.equal(
      shouldAccelerateCapture(
        { type: "setup", isGoodEvidence: false },
        target,
      ),
      true,
    );
    assert.equal(
      shouldAccelerateCapture(
        { type: "meter_box", isGoodEvidence: false },
        target,
      ),
      false,
    );
  });
});

describe("applyComplianceEvidence", () => {
  const geo = { lat: -33.8, lng: 151.2, accuracyM: 5, capturedAt: "t" };
  const capturedAt = "2026-06-06T00:00:00.000Z";

  it("records a good meter_box shot on install phase", () => {
    let state = createComplianceSessionState();
    state.captured.add("setup");

    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "meter_box", isGoodEvidence: true },
      }),
      "solar_install",
      state,
      geo,
      capturedAt,
    );

    assert.ok(outcome.state.captured.has("meter_box"));
    assert.equal(outcome.state.records.length, 1);
    assert.ok(outcome.voiceLines.length > 0);
    assert.equal(outcome.accelerateCapture, false);
  });

  it("rejects wrong-type evidence and preserves order", () => {
    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "meter_box", isGoodEvidence: true },
      }),
      "solar_install",
      createComplianceSessionState(),
      geo,
      capturedAt,
    );

    assert.equal(outcome.state.captured.size, 0);
    assert.match(outcome.voiceLines[0]?.text ?? "", /not the setup/i);
    assert.equal(outcome.accelerateCapture, false);
  });

  it("accelerates retake on bad evidence for the current target", () => {
    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "setup", isGoodEvidence: false },
      }),
      "solar_install",
      createComplianceSessionState(),
      geo,
      capturedAt,
    );

    assert.equal(outcome.state.captured.size, 0);
    assert.equal(outcome.state.failCounts.setup, 1);
    assert.equal(outcome.accelerateCapture, true);
    assert.match(outcome.voiceLines[0]?.text ?? "", /hold steady/i);
  });

  it("escalates after consecutive failures", () => {
    let state = createComplianceSessionState();
    state.failCounts.setup = RETAKE_ESCALATION_THRESHOLD - 1;

    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "setup", isGoodEvidence: false },
      }),
      "solar_install",
      state,
      geo,
      capturedAt,
    );

    assert.match(outcome.voiceLines[0]?.text ?? "", /move closer/i);
    assert.equal(
      outcome.state.failCounts.setup,
      RETAKE_ESCALATION_THRESHOLD,
    );
  });

  it("ignores duplicate credit for an already captured shot", () => {
    let state = createComplianceSessionState();
    state.captured.add("setup");

    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "setup", isGoodEvidence: true },
      }),
      "solar_install",
      state,
      geo,
      capturedAt,
    );

    assert.equal(outcome.state.records.length, 0);
    assert.equal(outcome.voiceLines.length, 0);
  });

  it("skips compliance on non-install phases", () => {
    const outcome = applyComplianceEvidence(
      baseCoaching({
        evidenceShot: { type: "setup", isGoodEvidence: true },
      }),
      "sales_pitch",
      createComplianceSessionState(),
      geo,
      capturedAt,
    );

    assert.equal(outcome.state.captured.size, 0);
    assert.equal(outcome.voiceLines.length, 0);
  });

  it("reports front facing mode for setup target", () => {
    const outcome = applyComplianceEvidence(
      baseCoaching(),
      "solar_install",
      createComplianceSessionState(),
      geo,
      capturedAt,
    );

    assert.equal(outcome.facingMode, "user");
  });
});
