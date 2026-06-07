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

const DEICTIC = /\b(here|there)\b/i;

const FAIL_KEYWORDS: Record<string, string[]> = {
  "cer-shutdown-label.json": ["shutdown", "label", "procedure"],
  "cer-missing-label.json": ["label", "switch", "main"],
  "cer-dc-isolator.json": ["isolator", "label", "dc"],
  "cer-dc-conduit.json": ["conduit", "dc", "cable", "exposed"],
  "cer-serial-mismatch.json": ["serial", "plate", "photo"],
};

function loadFixture(name: string) {
  return coachingResponseSchema.parse(
    JSON.parse(readFileSync(join(fixturesDir, name), "utf8")),
  );
}

function allText(coaching: ReturnType<typeof loadFixture>): string {
  const parts = [
    ...coaching.observations,
    ...coaching.installQualityFlags.map((f) => f.message),
    coaching.spokenCue?.say ?? "",
    ...coaching.visualCallouts.flatMap((c) => [c.label, c.message]),
  ];
  return parts.join(" ").toLowerCase();
}

describe("CER defect fixtures", () => {
  const failFiles = Object.keys(FAIL_KEYWORDS);
  const passFiles = readdirSync(fixturesDir).filter(
    (name) => name.startsWith("cer-") && name.endsWith("-pass.json"),
  );

  for (const file of failFiles) {
    it(`fail ${file}: spoken verdict, callout, keywords`, () => {
      const coaching = loadFixture(file);
      assert.ok(coaching.installQualityFlags.length > 0);

      const spoken = coaching.spokenCue;
      assert.ok(spoken?.say);
      assert.ok(spoken.say.split(/\s+/).length <= 12);
      assert.equal(spoken.speak, true);
      assert.ok(!DEICTIC.test(spoken.say), `deictic in spokenCue: ${spoken.say}`);

      assert.equal(coaching.visualCallouts.length, 1);
      const callout = coaching.visualCallouts[0];
      assert.equal(callout.category, "quality");
      assert.ok(callout.x >= 0 && callout.x <= 1);
      assert.ok(callout.y >= 0 && callout.y <= 1);

      const text = allText(coaching);
      for (const keyword of FAIL_KEYWORDS[file]) {
        assert.ok(
          text.includes(keyword),
          `${file} missing keyword "${keyword}" in coaching text`,
        );
      }
    });
  }

  for (const file of passFiles) {
    it(`pass ${file}: quiet compliant verdict`, () => {
      const coaching = loadFixture(file);
      assert.equal(coaching.installQualityFlags.length, 0);

      const spoken = coaching.spokenCue;
      assert.ok(spoken?.say);
      assert.equal(spoken.speak, false);
      assert.ok(!DEICTIC.test(spoken.say), `deictic in spokenCue: ${spoken.say}`);
    });
  }
});
