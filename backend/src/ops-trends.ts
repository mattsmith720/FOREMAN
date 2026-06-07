import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export interface EvalTrendPoint {
  recordedAt: string;
  scenariosPassed: number;
  scenariosTotal: number;
  rubricPassed: number;
  rubricApplicable: number;
  rubricRate: number;
}

const TREND_PATH = join(process.cwd(), "ops", "eval-trendline.json");

export function loadEvalTrendline(): EvalTrendPoint[] {
  if (!existsSync(TREND_PATH)) {
    return [];
  }
  try {
    const raw = readFileSync(TREND_PATH, "utf8");
    const parsed = JSON.parse(raw) as EvalTrendPoint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
