/**
 * Offline coaching-quality eval harness.
 *
 *   npm run eval-coaching                 # LIVE if ANTHROPIC_API_KEY is set, else OFFLINE
 *   npm run eval-coaching -- --offline    # score committed goldens only (CI, no API)
 *   npm run eval-coaching -- --update-golden   # LIVE + rewrite backend/eval/golden/*.json
 *   npm run eval-coaching -- --strict --min-rate 0.8   # exit 1 if overall < 80%
 *
 * LIVE runs each fixture scenario through the real /analyse pipeline and scores
 * the output against the rubrics (this is what Tier 1.2 iterates the prompt
 * against). OFFLINE re-scores the committed golden outputs so CI gets a
 * deterministic, non-blocking pass-rate report with no API key or spend.
 */
import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { coachingResponseSchema, type CoachingResponse } from "@foreman/shared";
import { analyseImage } from "../src/analyse.js";
import { SCENARIOS, type EvalScenario } from "../src/eval/scenarios.js";
import {
  aggregate,
  scoreScenario,
  type ScenarioScore,
} from "../src/eval/rubrics.js";

const GOLDEN_DIR = path.resolve("eval/golden");

interface Args {
  offline: boolean;
  updateGolden: boolean;
  strict: boolean;
  json: boolean;
  minRate: number;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    offline: false,
    updateGolden: false,
    strict: false,
    json: false,
    minRate: 0.8,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--offline") a.offline = true;
    else if (t === "--update-golden") a.updateGolden = true;
    else if (t === "--strict") a.strict = true;
    else if (t === "--json") a.json = true;
    else if (t === "--verbose") a.verbose = true;
    else if (t === "--min-rate" && argv[i + 1]) a.minRate = Number(argv[++i]);
  }
  return a;
}

function mediaTypeFor(file: string): "image/jpeg" | "image/png" | "image/webp" {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function goldenPath(id: string): string {
  return path.join(GOLDEN_DIR, `${id}.json`);
}

function loadGolden(id: string): CoachingResponse | null {
  const p = goldenPath(id);
  if (!existsSync(p)) return null;
  try {
    const parsed = coachingResponseSchema.safeParse(
      JSON.parse(readFileSync(p, "utf8")),
    );
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function runLive(s: EvalScenario): Promise<CoachingResponse> {
  const base64 = readFileSync(path.resolve(s.frame)).toString("base64");
  return analyseImage({
    base64,
    mediaType: mediaTypeFor(s.frame),
    context: { jobType: s.phase, recentTranscript: s.recentTranscript },
  });
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function pct(rate: number | null): string {
  return rate === null ? "  n/a" : `${Math.round(rate * 100)}%`.padStart(4);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const live = !args.offline && Boolean(process.env.ANTHROPIC_API_KEY);

  if (!args.offline && !process.env.ANTHROPIC_API_KEY) {
    console.log(
      "ANTHROPIC_API_KEY not set — OFFLINE mode (scoring committed goldens).",
    );
  }
  if (args.updateGolden && live) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
  }

  const scores: ScenarioScore[] = [];
  const skipped: string[] = [];

  for (const s of SCENARIOS) {
    let coaching: CoachingResponse | null = null;
    if (live) {
      try {
        coaching = await runLive(s);
        if (args.updateGolden) {
          writeFileSync(
            goldenPath(s.id),
            `${JSON.stringify(coaching, null, 2)}\n`,
          );
        }
      } catch (err) {
        console.error(
          `  ${s.id}: live analyse failed — ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    } else {
      coaching = loadGolden(s.id);
    }
    if (!coaching) {
      skipped.push(s.id);
      continue;
    }
    const score = scoreScenario(s.id, coaching, s.expect);
    scores.push(score);
    if (args.verbose) {
      console.log(`\n[${s.id}] ${s.description}`);
      console.log(`  spokenCue: ${JSON.stringify(coaching.spokenCue ?? null)}`);
      for (const [key, res] of Object.entries(score.results)) {
        if (res) console.log(`  ${res.pass ? "PASS" : "FAIL"} ${key}: ${res.detail}`);
      }
    }
  }

  const { perRubric, overall } = aggregate(scores);

  if (args.json) {
    console.log(JSON.stringify({ mode: live ? "live" : "offline", perRubric, overall, skipped }, null, 2));
  } else {
    console.log(`\n=== Foreman coaching eval (${live ? "LIVE" : "OFFLINE"}) ===`);
    console.log(
      `scenarios scored: ${scores.length}/${SCENARIOS.length}` +
        (skipped.length ? ` (skipped: ${skipped.join(", ")})` : ""),
    );
    console.log("");
    console.log(`${pad("rubric", 42)}${pad("pass/appl", 12)}rate`);
    for (const r of perRubric) {
      console.log(
        `${pad(r.label, 42)}${pad(`${r.passed}/${r.applicable}`, 12)}${pct(r.rate)}`,
      );
    }
    console.log("");
    console.log(
      `${pad("OVERALL", 42)}${pad(`${overall.passed}/${overall.applicable}`, 12)}${pct(overall.rate)}`,
    );
    if (skipped.length && !live) {
      console.log(
        `\nNote: ${skipped.length} scenario(s) had no golden — run \`npm run eval-coaching -- --update-golden\` locally (needs ANTHROPIC_API_KEY) to capture them.`,
      );
    }
  }

  if (args.strict && overall.rate !== null && overall.rate < args.minRate) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
