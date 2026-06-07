import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateSessionCostUsd } from "./session-cost.js";

describe("estimateSessionCostUsd", () => {
  it("combines frame and transcript estimates", () => {
    const cost = estimateSessionCostUsd(10, 5);
    assert.equal(cost, 0.152);
  });

  it("clamps negative inputs", () => {
    assert.equal(estimateSessionCostUsd(-1, -1), 0);
  });
});
