import { readFile } from "node:fs/promises";
import {
  formatPackValidationReport,
  validateEvidencePackZip,
} from "../src/pack-validator.js";

const zipPath = process.argv[2];

if (!zipPath) {
  console.error("Usage: npm run validate-pack -- <path-to-zip>");
  process.exit(1);
}

let zipBytes: Buffer;
try {
  zipBytes = await readFile(zipPath);
} catch (err) {
  console.error(
    err instanceof Error ? err.message : `Failed to read ZIP at ${zipPath}`,
  );
  process.exit(1);
}

const report = validateEvidencePackZip(zipBytes);
console.log(formatPackValidationReport(report));
process.exit(report.ok ? 0 : 1);
