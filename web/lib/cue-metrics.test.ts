import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reportSpokenCueAttemptMs } from "./cue-metrics.js";

describe("reportSpokenCueAttemptMs", () => {
  it("returns 0 for invalid startedAt deltas", () => {
    assert.equal(reportSpokenCueAttemptMs(Number.NaN), 0);
  });

  it("returns rounded ms for a recent startedAt", () => {
    const ms = reportSpokenCueAttemptMs(performance.now() - 25);
    assert.ok(ms >= 20 && ms <= 100);
  });
});
