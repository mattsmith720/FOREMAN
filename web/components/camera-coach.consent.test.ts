import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  backendStatusMessage,
  canCapture,
  recordingIndicatorVisible,
  type CaptureStatus,
} from "./consent-gate-policy.js";

describe("camera coach consent and recording policy", () => {
  it("consent gate cannot be bypassed", () => {
    assert.equal(canCapture(false), false);
    assert.equal(canCapture(true), true);
  });

  it("recording indicator visible during active session", () => {
    const visible: CaptureStatus[] = ["running", "analysing", "summarising"];
    const hidden: CaptureStatus[] = ["idle", "error"];

    for (const status of visible) {
      assert.equal(recordingIndicatorVisible(status), true);
    }

    for (const status of hidden) {
      assert.equal(recordingIndicatorVisible(status), false);
    }
  });

  it("backend status message guides cold-start UX", () => {
    assert.equal(backendStatusMessage("ready"), null);
    assert.equal(backendStatusMessage("unknown"), null);
    assert.equal(backendStatusMessage("waking"), "Waking Foreman…");
    assert.match(backendStatusMessage("slow") ?? "", /cold start/i);
  });
});
