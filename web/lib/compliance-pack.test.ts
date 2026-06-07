import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COMPLIANCE_SHOTS,
  complianceProgress,
  nextComplianceShot,
  shotForEvidenceType,
} from "./compliance-pack.js";

describe("compliance pack", () => {
  it("guides shots in order", () => {
    const captured = new Set<typeof COMPLIANCE_SHOTS[number]["id"]>();
    const first = nextComplianceShot(captured);
    assert.equal(first?.id, "setup");
    captured.add("setup");
    const second = nextComplianceShot(captured);
    assert.equal(second?.id, "meter_box");
  });

  it("maps evidence types to guided shots", () => {
    const shot = shotForEvidenceType("meter_box");
    assert.equal(shot?.id, "meter_box");
  });

  it("reports progress", () => {
    const progress = complianceProgress(new Set(["setup", "meter_box"]));
    assert.equal(progress.done, 2);
    assert.equal(progress.total, COMPLIANCE_SHOTS.length);
  });
});
