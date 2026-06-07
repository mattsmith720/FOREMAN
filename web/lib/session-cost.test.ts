import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  DEFAULT_ANALYSE_COST_USD,
  DEFAULT_TRANSCRIBE_COST_USD,
  estimateSessionCostUsd,
  getCostModel,
  setCostModel,
} from "./session-cost.js";

describe("estimateSessionCostUsd", () => {
  afterEach(() => {
    setCostModel({
      analyse_usd: DEFAULT_ANALYSE_COST_USD,
      transcribe_usd: DEFAULT_TRANSCRIBE_COST_USD,
    });
  });

  it("combines frame and transcript estimates with default model", () => {
    const cost = estimateSessionCostUsd(10, 5);
    assert.equal(cost, 0.152);
    assert.equal(getCostModel().analyse_usd, DEFAULT_ANALYSE_COST_USD);
    assert.equal(getCostModel().transcribe_usd, DEFAULT_TRANSCRIBE_COST_USD);
  });

  it("uses active cost model after setCostModel", () => {
    setCostModel({ analyse_usd: 0.02, transcribe_usd: 0.001 });
    assert.equal(estimateSessionCostUsd(10, 5), 0.205);
  });

  it("clamps negative inputs", () => {
    assert.equal(estimateSessionCostUsd(-1, -1), 0);
  });
});
