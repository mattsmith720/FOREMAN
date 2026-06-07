import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SOFT_CAP_WARNING_USD,
  SessionSpendCap,
} from "./session-spend-cap.js";

describe("SessionSpendCap", () => {
  it("defaults soft warning to $0.50", () => {
    const cap = new SessionSpendCap();
    assert.equal(cap.warningThresholdUsd(), DEFAULT_SOFT_CAP_WARNING_USD);
  });

  it("fires consumeWarning once when threshold crossed", () => {
    const cap = new SessionSpendCap({ warningUsd: 0.03 });
    for (let i = 0; i < 2; i++) {
      cap.recordAnalyse();
    }
    assert.equal(cap.consumeWarning(), true);
    assert.equal(cap.consumeWarning(), false);
  });

  it("includes transcript cost in spend estimate", () => {
    const cap = new SessionSpendCap({ warningUsd: 0.001 });
    cap.recordTranscribe();
    cap.recordTranscribe();
    assert.equal(cap.isWarningThresholdReached(), true);
  });
});
