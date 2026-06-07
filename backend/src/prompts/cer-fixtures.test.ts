import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { coachingResponseSchema } from "@foreman/shared";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../fixtures",
);

describe("CER defect fixtures", () => {
  const files = readdirSync(fixturesDir).filter((name) => name.startsWith("cer-"));

  for (const file of files) {
    it(`parses ${file} and has a spoken verdict`, () => {
      const coaching = coachingResponseSchema.parse(
        JSON.parse(readFileSync(join(fixturesDir, file), "utf8")),
      );
      assert.ok(coaching.installQualityFlags.length > 0);
      const spoken = coaching.spokenCue;
      assert.ok(spoken?.say);
      assert.ok(spoken.say.split(/\s+/).length <= 12);
      assert.equal(spoken.speak, true);
    });
  }
});
