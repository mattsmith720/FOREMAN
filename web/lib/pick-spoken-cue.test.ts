import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { coachingResponseSchema } from "@foreman/shared";
import { pickSpokenCue } from "./pick-spoken-cue.js";

const fixturesDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../backend/fixtures",
);

function loadFixture(name: string) {
  const raw = readFileSync(join(fixturesDir, name), "utf8");
  return coachingResponseSchema.parse(JSON.parse(raw));
}

describe("pickSpokenCue CER install defects", () => {
  const cases = [
    ["cer-missing-label.json", "label"],
    ["cer-dc-isolator.json", "isolator"],
    ["cer-dc-conduit.json", "conduit"],
    ["cer-shutdown-label.json", "shutdown"],
    ["cer-serial-mismatch.json", "serial"],
  ] as const;

  for (const [file, keyword] of cases) {
    it(`surfaces verdict for ${keyword} from ${file}`, () => {
      const coaching = loadFixture(file);
      const cue = pickSpokenCue(coaching, "solar_install");
      assert.ok(cue);
      assert.ok(cue.text.length <= 80);
      assert.ok(cue.text.split(/\s+/).length <= 12);
    });
  }

  it("prefers critical safety over CER warning", () => {
    const coaching = loadFixture("coaching-solar-install.json");
    const cue = pickSpokenCue(coaching, "solar_install");
    assert.ok(cue);
    assert.equal(cue.severity, "critical");
  });
});
