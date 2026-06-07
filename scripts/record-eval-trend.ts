#!/usr/bin/env npx tsx
/**
 * Append the current offline eval result to backend/ops/eval-trendline.json.
 * Run after eval-coaching in CI or locally: npm run record-eval-trend
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "backend", "ops");
const outPath = join(outDir, "eval-trendline.json");

const raw = execSync("npm run eval-coaching --workspace backend -- --offline --json", {
  cwd: root,
  encoding: "utf8",
});
const report = JSON.parse(raw) as {
  overall: { passed: number; applicable: number; rate: number };
  skipped?: string[];
};

const scenariosTotal = 11;
const scenariosPassed = scenariosTotal - (report.skipped?.length ?? 0);

const point = {
  recordedAt: new Date().toISOString(),
  scenariosPassed,
  scenariosTotal,
  rubricPassed: report.overall.passed,
  rubricApplicable: report.overall.applicable,
  rubricRate: report.overall.rate,
};

let trend: typeof point[] = [];
try {
  trend = JSON.parse(readFileSync(outPath, "utf8")) as typeof point[];
} catch {
  trend = [];
}

trend.push(point);
if (trend.length > 60) {
  trend = trend.slice(-60);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(trend, null, 2)}\n`);
console.log(`Recorded eval trend: ${point.scenariosPassed}/${point.scenariosTotal} scenarios`);
