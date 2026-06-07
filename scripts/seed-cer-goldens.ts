/**
 * Seed offline eval goldens for CER scenarios from backend/fixtures/cer-*.json.
 * Run: npx tsx scripts/seed-cer-goldens.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { coachingResponseSchema } from "@foreman/shared";

const ROOT = path.resolve(import.meta.dirname, "..");
const FIXTURES = path.join(ROOT, "backend/fixtures");
const GOLDEN_DIR = path.join(ROOT, "backend/eval/golden");

const MAP: Record<string, string> = {
  "cer-no-shutdown-label": "cer-shutdown-label.json",
  "cer-dc-not-in-conduit": "cer-dc-conduit.json",
  "cer-isolator-unlabelled": "cer-dc-isolator.json",
  "cer-missing-signage": "cer-missing-label.json",
  "cer-serial-capture": "cer-serial-mismatch.json",
};

mkdirSync(GOLDEN_DIR, { recursive: true });

for (const [scenarioId, fixtureFile] of Object.entries(MAP)) {
  const raw = JSON.parse(
    readFileSync(path.join(FIXTURES, fixtureFile), "utf8"),
  );
  const parsed = coachingResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`${fixtureFile}: ${parsed.error.message}`);
  }
  const out = path.join(GOLDEN_DIR, `${scenarioId}.json`);
  writeFileSync(out, `${JSON.stringify(parsed.data, null, 2)}\n`);
  console.log(`wrote ${path.relative(ROOT, out)}`);
}
