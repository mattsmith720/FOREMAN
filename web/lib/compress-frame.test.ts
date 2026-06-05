import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dataUrlWithinLimit, MAX_DATA_URL_CHARS } from "./compress-frame.js";

describe("dataUrlWithinLimit", () => {
  it("accepts payloads under the Vercel-safe cap", () => {
    const dataUrl = `data:image/jpeg;base64,${"a".repeat(100)}`;
    assert.equal(dataUrlWithinLimit(dataUrl), true);
  });

  it("rejects payloads over the cap", () => {
    const dataUrl = `data:image/jpeg;base64,${"a".repeat(MAX_DATA_URL_CHARS)}`;
    assert.equal(dataUrlWithinLimit(dataUrl), false);
  });
});
