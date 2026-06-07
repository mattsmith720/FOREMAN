import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLatencyMetrics,
  recordAnalyseMs,
  recordCueE2eMs,
} from "./metrics.js";

describe("metrics", () => {
  it("records analyse and cue E2E percentiles independently", () => {
    recordAnalyseMs(Number.NaN);
    recordCueE2eMs(-1);

    for (let i = 1; i <= 10; i++) {
      recordAnalyseMs(i * 100);
      recordCueE2eMs(i * 100 + 500);
    }

    const metrics = getLatencyMetrics();
    assert.ok(metrics.analyse.sampleCount >= 10);
    assert.ok(metrics.cueE2e.sampleCount >= 10);
    assert.ok(metrics.analyse.p50Ms > 0);
    assert.ok(metrics.cueE2e.p50Ms > metrics.analyse.p50Ms);
  });
});
