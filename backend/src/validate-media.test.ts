import assert from "node:assert/strict";
import { test } from "node:test";
import { validateAudioBytes } from "./validate-media.js";

test("validateAudioBytes accepts audio/aac and normalizes to mp4", () => {
  const bytes = Buffer.alloc(2000, 0);
  const result = validateAudioBytes(bytes, "audio/aac");
  assert.equal(result.mimeType, "audio/mp4");
});

test("validateAudioBytes rejects unknown audio types", () => {
  const bytes = Buffer.alloc(2000, 0);
  assert.throws(
    () => validateAudioBytes(bytes, "audio/flac"),
    /Unsupported audio type/,
  );
});
