import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  needsSummaryRetry,
  SUMMARISING_PLACEHOLDER,
} from "./stuck-summary.js";

describe("needsSummaryRetry", () => {
  it("retries when session ended but summary is still the placeholder", () => {
    assert.equal(
      needsSummaryRetry({
        ended_at: "2026-06-05T10:00:00Z",
        summary: SUMMARISING_PLACEHOLDER,
      }),
      true,
    );
  });

  it("does not retry when summary is final", () => {
    assert.equal(
      needsSummaryRetry({
        ended_at: "2026-06-05T10:00:00Z",
        summary: "Install completed with minor cable routing note.",
      }),
      false,
    );
  });

  it("does not retry when session is still active", () => {
    assert.equal(
      needsSummaryRetry({
        ended_at: null,
        summary: SUMMARISING_PLACEHOLDER,
      }),
      false,
    );
  });
});
