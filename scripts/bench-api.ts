import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RUNS = 5;
const DEFAULT_BASE_URL = "http://127.0.0.1:8080";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const imageFixturePath = resolve(scriptDir, "smoke-fixtures/frame.jpg");

interface BenchResult {
  endpoint: string;
  runs: number;
  latenciesMs: number[];
  p50Ms: number;
  p95Ms: number;
  statusCodes: number[];
  errors: string[];
}

interface ColdPingResult {
  latencyMs: number;
  status: number;
  ok: boolean;
  error?: string;
}

function usage(): never {
  console.error("Usage: npm run bench --workspace backend");
  console.error("");
  console.error("Environment:");
  console.error("  BASE_URL          API origin (default: http://127.0.0.1:8080)");
  console.error("  FOREMAN_API_KEY   Required for /sessions/start and /analyse");
  console.error("");
  console.error("Examples:");
  console.error("  FOREMAN_API_KEY=local-smoke npm run bench --workspace backend");
  console.error(
    "  BASE_URL=https://foreman-api-y31r.onrender.com FOREMAN_API_KEY=... npm run bench --workspace backend",
  );
  process.exit(1);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function summarize(endpoint: string, latenciesMs: number[], statusCodes: number[], errors: string[]): BenchResult {
  const sorted = [...latenciesMs].sort((a, b) => a - b);
  return {
    endpoint,
    runs: latenciesMs.length,
    latenciesMs: sorted,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    statusCodes,
    errors,
  };
}

async function timedFetch(
  url: string,
  init?: RequestInit,
): Promise<{ latencyMs: number; status: number; body: string }> {
  const start = performance.now();
  const response = await fetch(url, init);
  const body = await response.text();
  const latencyMs = performance.now() - start;
  return { latencyMs, status: response.status, body };
}

async function benchHealth(baseUrl: string): Promise<{ cold: ColdPingResult; warm: BenchResult }> {
  const coldUrl = `${baseUrl}/health`;
  let cold: ColdPingResult;
  try {
    const result = await timedFetch(coldUrl);
    cold = {
      latencyMs: Math.round(result.latencyMs),
      status: result.status,
      ok: result.status === 200,
    };
  } catch (error) {
    cold = {
      latencyMs: 0,
      status: 0,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const latenciesMs: number[] = [];
  const statusCodes: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < RUNS; i++) {
    try {
      const result = await timedFetch(coldUrl);
      latenciesMs.push(Math.round(result.latencyMs));
      statusCodes.push(result.status);
      if (result.status !== 200) {
        errors.push(`run ${i + 1}: HTTP ${result.status}`);
      }
    } catch (error) {
      errors.push(`run ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { cold, warm: summarize("GET /health", latenciesMs, statusCodes, errors) };
}

async function benchSessionsStart(baseUrl: string, apiKey: string): Promise<BenchResult> {
  const url = `${baseUrl}/sessions/start`;
  const latenciesMs: number[] = [];
  const statusCodes: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < RUNS; i++) {
    try {
      const result = await timedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-foreman-api-key": apiKey,
        },
        body: JSON.stringify({ jobType: "bench" }),
      });
      latenciesMs.push(Math.round(result.latencyMs));
      statusCodes.push(result.status);
      if (result.status !== 201) {
        errors.push(`run ${i + 1}: HTTP ${result.status}`);
      }
    } catch (error) {
      errors.push(`run ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return summarize("POST /sessions/start", latenciesMs, statusCodes, errors);
}

async function startSession(
  baseUrl: string,
  apiKey: string,
): Promise<{ sessionId: string; token: string } | null> {
  const result = await timedFetch(`${baseUrl}/sessions/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-foreman-api-key": apiKey,
    },
    body: JSON.stringify({ jobType: "bench" }),
  });

  if (result.status !== 201) {
    return null;
  }

  try {
    const parsed = JSON.parse(result.body) as {
      session?: { id?: string };
      token?: string;
    };
    const sessionId = parsed.session?.id;
    const token = parsed.token;
    if (!sessionId || !token) {
      return null;
    }
    return { sessionId, token };
  } catch {
    return null;
  }
}

function loadImageFixture(): string {
  const raw = readFileSync(imageFixturePath);
  return `data:image/jpeg;base64,${raw.toString("base64")}`;
}

async function benchAnalyse(baseUrl: string, apiKey: string, image: string): Promise<BenchResult> {
  const url = `${baseUrl}/analyse`;
  const latenciesMs: number[] = [];
  const statusCodes: number[] = [];
  const errors: string[] = [];

  for (let i = 0; i < RUNS; i++) {
    const session = await startSession(baseUrl, apiKey);
    if (!session) {
      errors.push(`run ${i + 1}: failed to create session for analyse`);
      continue;
    }

    try {
      const result = await timedFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-foreman-api-key": apiKey,
          "x-session-token": session.token,
        },
        body: JSON.stringify({
          image,
          sessionId: session.sessionId,
          context: { jobType: "bench", notes: "API latency benchmark" },
        }),
      });
      latenciesMs.push(Math.round(result.latencyMs));
      statusCodes.push(result.status);

      if (result.status !== 200 && result.status !== 503) {
        errors.push(`run ${i + 1}: HTTP ${result.status}`);
      } else if (result.status === 503 && !result.body.includes("ANTHROPIC_API_KEY is not set")) {
        errors.push(`run ${i + 1}: HTTP 503 (unexpected)`);
      }
    } catch (error) {
      errors.push(`run ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return summarize("POST /analyse", latenciesMs, statusCodes, errors);
}

function printBenchResult(result: BenchResult): void {
  console.log(`  runs:     ${result.runs}`);
  console.log(`  latencies: ${result.latenciesMs.join(", ")} ms`);
  console.log(`  p50:      ${result.p50Ms} ms`);
  console.log(`  p95:      ${result.p95Ms} ms`);
  console.log(`  status:   ${result.statusCodes.join(", ") || "(none)"}`);
  if (result.errors.length > 0) {
    console.log(`  errors:   ${result.errors.join("; ")}`);
  }
}

function printReport(
  baseUrl: string,
  health: { cold: ColdPingResult; warm: BenchResult },
  sessionsStart: BenchResult,
  analyse: BenchResult,
): void {
  console.log("");
  console.log("=== Foreman API bench ===");
  console.log(`target:   ${baseUrl}`);
  console.log(`fixture:  ${imageFixturePath}`);
  console.log(`mode:     ${RUNS} sequential runs per endpoint`);
  console.log("");

  console.log("GET /health (cold ping — first request to target)");
  if (health.cold.error) {
    console.log(`  cold:     FAIL — ${health.cold.error}`);
  } else {
    console.log(`  cold:     ${health.cold.latencyMs} ms (HTTP ${health.cold.status})`);
  }
  console.log("GET /health (warm sequential)");
  printBenchResult(health.warm);

  console.log("");
  console.log("POST /sessions/start");
  printBenchResult(sessionsStart);

  console.log("");
  console.log("POST /analyse");
  printBenchResult(analyse);

  console.log("");
  console.log("Cold-start note:");
  console.log(
    "  Render free tier sleeps after ~15 min idle. The cold /health ping above is the first",
  );
  console.log(
    "  request to BASE_URL in this process — expect 30–60s if the instance was asleep.",
  );
  console.log(
    "  Warm p50/p95 exclude that cold ping; /analyse includes Claude inference (often 15–45s).",
  );
  console.log("");
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
  }

  const baseUrl = (process.env.BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  const apiKey = process.env.FOREMAN_API_KEY?.trim();

  if (!apiKey) {
    console.error("ERROR: FOREMAN_API_KEY is required.");
    console.error("");
    console.error("Usage: npm run bench --workspace backend");
    console.error("  BASE_URL          API origin (default: http://127.0.0.1:8080)");
    console.error("  FOREMAN_API_KEY   Required for /sessions/start and /analyse");
    process.exit(2);
  }

  try {
    readFileSync(imageFixturePath);
  } catch {
    console.error(`ERROR: image fixture missing at ${imageFixturePath}`);
    process.exit(1);
  }

  const image = loadImageFixture();

  const health = await benchHealth(baseUrl);
  const sessionsStart = await benchSessionsStart(baseUrl, apiKey);
  const analyse = await benchAnalyse(baseUrl, apiKey, image);

  printReport(baseUrl, health, sessionsStart, analyse);

  const failed =
    !health.cold.ok ||
    health.warm.errors.length > 0 ||
    sessionsStart.errors.length > 0 ||
    analyse.latenciesMs.length === 0;

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
