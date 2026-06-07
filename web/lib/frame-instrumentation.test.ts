import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { frameInstrumentation } from "./frame-instrumentation.js";

describe("frameInstrumentation", () => {
  it("records spoken-cue-attempt E2E when spokenCueAttempt is true", () => {
    const result = frameInstrumentation({
      debugMode: false,
      frameKb: 120,
      analyseMs: 900,
      startedAt: performance.now() - 42,
      framesCaptured: 3,
      transcriptChunkCount: 1,
      spokenCueAttempt: true,
    });

    const ms = result.onCueAttempt();
    assert.ok(ms >= 40 && ms <= 200);
    assert.equal(result.onCueAudible(), ms);
  });

  it("patches debug health with synced cost estimate", () => {
    const result = frameInstrumentation({
      debugMode: true,
      frameKb: 80,
      analyseMs: 500,
      startedAt: performance.now(),
      framesCaptured: 2,
      transcriptChunkCount: 4,
    });

    assert.equal(result.healthPatch.frameKb, 80);
    assert.equal(result.healthPatch.analyseMs, 500);
    assert.equal(result.healthPatch.persistQueued, true);
    assert.equal(result.healthPatch.estCostUsd, 0.032);
  });
});
