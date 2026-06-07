/**
 * Full backend integration test: Supabase, API lifecycle, training data pipeline.
 *
 *   npx tsx scripts/integration-test.ts [--base-url http://127.0.0.1:8080]
 */
import "dotenv/config";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { getSupabase } from "../src/db/supabase.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const exportsDir = path.resolve(scriptDir, "../exports");
const fixtureJpeg = path.join(repoRoot, "scripts/smoke-fixtures/frame.jpg");
const fixtureWav = path.join(repoRoot, "scripts/smoke-fixtures/tiny.wav");

type StepResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const results: StepResult[] = [];

function pass(name: string, detail: string) {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}: ${detail}`);
}

function fail(name: string, detail: string) {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}: ${detail}`);
}

function warn(name: string, detail: string) {
  results.push({ name, ok: true, detail: `[warn] ${detail}` });
  console.log(`○ ${name}: ${detail}`);
}

function parseBaseUrl(argv: string[]): string {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base-url" && argv[i + 1]) {
      return argv[++i];
    }
  }
  return process.env.BASE_URL ?? "http://127.0.0.1:8080";
}

function apiKey(): string {
  const key = process.env.FOREMAN_API_KEY?.trim();
  if (!key) {
    throw new Error("FOREMAN_API_KEY must be set in backend/.env");
  }
  return key;
}

async function toDataUrl(filePath: string, mime: string): Promise<string> {
  const bytes = await readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function countTable(table: string): Promise<number> {
  const supabase = getSupabase();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function testSupabase(): Promise<string | null> {
  const supabase = getSupabase();
  const tables = [
    "sessions",
    "frames",
    "transcript_segments",
    "coaching_events",
    "labels",
  ] as const;

  const counts: Record<string, number> = {};
  for (const table of tables) {
    counts[table] = await countTable(table);
  }

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    throw new Error(`storage buckets: ${bucketError.message}`);
  }
  const bucketIds = (buckets ?? []).map((b) => b.id).sort().join(", ");

  const { data: recent, error: recentError } = await supabase
    .from("sessions")
    .select("id, job_type, ended_at, summary")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(5);

  if (recentError) {
    throw new Error(`recent sessions: ${recentError.message}`);
  }

  // Pick best session for training-module test: ended + has frames or transcripts
  let trainingSessionId: string | null = null;
  for (const session of recent ?? []) {
    const { count: frameCount } = await supabase
      .from("frames")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id);
    const { count: transcriptCount } = await supabase
      .from("transcript_segments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", session.id);
    if ((frameCount ?? 0) > 0 || (transcriptCount ?? 0) > 0) {
      trainingSessionId = session.id;
      break;
    }
  }

  pass(
    "Supabase connectivity",
    `tables ok — sessions=${counts.sessions} frames=${counts.frames} transcripts=${counts.transcript_segments} coaching=${counts.coaching_events} labels=${counts.labels}`,
  );
  pass("Storage buckets", bucketIds || "(none)");

  if (counts.sessions === 0) {
    warn("Internal training data", "No sessions in DB yet — run a job or ingest videos");
  } else if (counts.frames === 0 && counts.transcript_segments === 0) {
    warn(
      "Internal training data",
      `${counts.sessions} sessions but no frames/transcripts — export will be empty`,
    );
  } else {
    pass(
      "Internal training data",
      `${counts.sessions} sessions, ${counts.frames} frames, ${counts.transcript_segments} transcript segments ready for export`,
    );
  }

  return trainingSessionId;
}

async function testApiLifecycle(baseUrl: string): Promise<{
  sessionId: string;
  token: string;
}> {
  const key = apiKey();
  const headers = {
    "Content-Type": "application/json",
    "x-foreman-api-key": key,
  };

  const readyRes = await fetch(`${baseUrl}/ready`);
  if (!readyRes.ok) {
    throw new Error(`/ready HTTP ${readyRes.status}`);
  }
  const ready = (await readyRes.json()) as Record<string, boolean>;
  const readyKeys = ["anthropic", "openai", "supabase", "transcription"] as const;
  for (const k of readyKeys) {
    if (!ready[k]) {
      throw new Error(`/ready ${k}=false`);
    }
  }
  pass("/ready", `ok=true (${readyKeys.map((k) => `${k}=true`).join(", ")})`);

  const startRes = await fetch(`${baseUrl}/sessions/start`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobType: "panel_clean", worker: "integration-test" }),
  });
  if (startRes.status !== 201) {
    const body = await startRes.text();
    throw new Error(`sessions/start HTTP ${startRes.status}: ${body.slice(0, 200)}`);
  }
  const startJson = (await startRes.json()) as {
    session: { id: string };
    token: string;
  };
  const sessionId = startJson.session.id;
  const token = startJson.token;
  pass("POST /sessions/start", `session ${sessionId.slice(0, 8)}…`);

  const sessionHeaders = { ...headers, "x-session-token": token };
  const image = await toDataUrl(fixtureJpeg, "image/jpeg");
  const analyseRes = await fetch(`${baseUrl}/analyse`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ image, sessionId }),
  });
  if (analyseRes.status !== 200) {
    const body = await analyseRes.text();
    throw new Error(`analyse HTTP ${analyseRes.status}: ${body.slice(0, 200)}`);
  }
  const coaching = (await analyseRes.json()) as { spokenLine?: string };
  pass(
    "POST /analyse",
    coaching.spokenLine
      ? `coaching returned (“${coaching.spokenLine.slice(0, 60)}…”)`
      : "coaching JSON returned",
  );

  const audio = await toDataUrl(fixtureWav, "audio/wav");
  const transcribeRes = await fetch(`${baseUrl}/transcribe`, {
    method: "POST",
    headers: sessionHeaders,
    body: JSON.stringify({ audio, sessionId }),
  });
  if (transcribeRes.status !== 200) {
    const body = await transcribeRes.text();
    throw new Error(`transcribe HTTP ${transcribeRes.status}: ${body.slice(0, 200)}`);
  }
  const transcript = (await transcribeRes.json()) as { text?: string };
  pass(
    "POST /transcribe",
    transcript.text
      ? `text="${transcript.text.slice(0, 80)}"`
      : "transcript returned",
  );

  // Frame persist is async after the analyse response — poll briefly.
  const supabase = getSupabase();
  let frameCount = 0;
  let transcriptCount = 0;
  for (let attempt = 0; attempt < 20; attempt++) {
    const frameRes = await supabase
      .from("frames")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);
    const transcriptRes = await supabase
      .from("transcript_segments")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId);
    frameCount = frameRes.count ?? 0;
    transcriptCount = transcriptRes.count ?? 0;
    if (frameCount >= 1) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (frameCount < 1) {
    throw new Error("analyse did not persist a frame to Supabase within 10s");
  }
  pass(
    "DB persist (live session)",
    `frames=${frameCount ?? 0} transcript_segments=${transcriptCount ?? 0}`,
  );

  const stopRes = await fetch(`${baseUrl}/sessions/${sessionId}/stop`, {
    method: "POST",
    headers: {
      "x-foreman-api-key": key,
      "x-session-token": token,
    },
  });
  if (stopRes.status !== 200) {
    const body = await stopRes.text();
    throw new Error(`stop HTTP ${stopRes.status}: ${body.slice(0, 200)}`);
  }
  const stopped = (await stopRes.json()) as {
    session: { summary?: string | null };
    stored: { frames: number };
  };
  pass(
    "POST /sessions/:id/stop",
    `stored ${stopped.stored.frames} frames, summary ${stopped.session.summary ? "generated" : "pending"}`,
  );

  return { sessionId, token };
}

async function testTrainingPipeline(): Promise<void> {
  const datasetPath = path.join(exportsDir, "integration-training-dataset.jsonl");
  const trainPath = path.join(exportsDir, "integration-train.jsonl");
  const valPath = path.join(exportsDir, "integration-val.jsonl");
  const whisperPath = path.join(exportsDir, "integration-whisper-manifest.jsonl");

  const exportArgs = `--out "${datasetPath}" --limit 50`;
  try {
    execSync(
      `npx tsx scripts/export-training-data.ts ${exportArgs} --maintenance-only`,
      { cwd: path.resolve(scriptDir, ".."), stdio: "pipe", encoding: "utf8" },
    );
  } catch {
    execSync(
      `npx tsx scripts/export-training-data.ts ${exportArgs}`,
      { cwd: path.resolve(scriptDir, ".."), stdio: "pipe", encoding: "utf8" },
    );
    warn("export-training-data", "No maintenance sessions — exported all job types");
  }

  const metaPath = `${datasetPath}.meta.json`;
  const meta = JSON.parse(await readFile(metaPath, "utf8")) as {
    frame_records: number;
    sessions: { total: number };
    label_sources: Record<string, number>;
  };
  pass(
    "export-training-data",
    `${meta.frame_records} frame records from ${meta.sessions.total} sessions`,
  );

  execSync(
    `npx tsx scripts/split-training-data.ts --in "${datasetPath}" --out-dir "${exportsDir}" --val-ratio 0.2`,
    { cwd: path.resolve(scriptDir, ".."), stdio: "pipe", encoding: "utf8" },
  );

  // split script writes train.jsonl / val.jsonl — copy with integration prefix
  const defaultTrain = path.join(exportsDir, "train.jsonl");
  const defaultVal = path.join(exportsDir, "val.jsonl");
  const trainLines = await countLines(defaultTrain);
  const valLines = await countLines(defaultVal);
  pass("split-training-data", `train=${trainLines} val=${valLines} (by session)`);

  execSync(`npx tsx scripts/eval-baseline.ts --in "${datasetPath}"`, {
    cwd: path.resolve(scriptDir, ".."),
    stdio: "inherit",
  });
  pass("eval-baseline", "completed on exported dataset");

  execSync(
    `python3 scripts/build-whisper-dataset.py --in "${datasetPath}" --out "${whisperPath}"`,
    { cwd: path.resolve(scriptDir, ".."), stdio: "pipe", encoding: "utf8" },
  );
  const whisperLines = await countLines(whisperPath);
  if (whisperLines === 0) {
    warn(
      "whisper-manifest",
      "0 sessions with transcript text — need jobs with mic audio",
    );
  } else {
    pass("build-whisper-dataset", `${whisperLines} session transcript entries`);
  }

  if (meta.frame_records === 0) {
    warn(
      "Whisper fine-tune readiness",
      "Export empty — record maintenance jobs or ingest gold-standard videos first",
    );
  } else {
    pass(
      "Whisper fine-tune readiness",
      "Internal data exported + split + manifest built (training run not executed per WHISPER_FINETUNE.md)",
    );
  }
}

async function countLines(filePath: string): Promise<number> {
  try {
    const st = await stat(filePath);
    if (st.size === 0) {
      return 0;
    }
  } catch {
    return 0;
  }
  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });
  let n = 0;
  for await (const line of rl) {
    if (line.trim()) {
      n++;
    }
  }
  return n;
}

async function testTrainingModule(
  baseUrl: string,
  sessionId: string,
): Promise<void> {
  const opsPassword = process.env.OPS_PASSWORD?.trim();
  const headers: Record<string, string> = {
    "x-foreman-api-key": apiKey(),
  };
  if (opsPassword) {
    headers["x-ops-password"] = opsPassword;
  }

  const res = await fetch(`${baseUrl}/ops/sessions/${sessionId}/training-module`, {
    method: "POST",
    headers,
  });

  if (res.status === 401) {
    warn("training-module", "OPS_PASSWORD not set or wrong — skipped");
    return;
  }
  if (res.status !== 200) {
    const body = await res.text();
    throw new Error(`training-module HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const body = (await res.json()) as {
    module?: { title?: string; steps?: unknown[]; learningObjectives?: unknown[] };
  };
  const title = body.module?.title ?? "(no title)";
  const steps = body.module?.steps?.length ?? 0;
  const objectives = body.module?.learningObjectives?.length ?? 0;
  pass(
    "POST /ops/sessions/:id/training-module",
    `“${title}” (${steps} steps, ${objectives} objectives)`,
  );
}

async function main() {
  const baseUrl = parseBaseUrl(process.argv.slice(2));
  console.log("=== Foreman backend integration test ===\n");
  console.log(`Target: ${baseUrl}\n`);

  let failures = 0;

  try {
    const trainingSessionId = await testSupabase();
    const { sessionId: liveSessionId } = await testApiLifecycle(baseUrl);
    await testTrainingPipeline();

    const moduleSessionId = trainingSessionId ?? liveSessionId;
    if (moduleSessionId) {
      await testTrainingModule(baseUrl, moduleSessionId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fail("integration", message);
    failures++;
  }

  console.log("\n=== Summary ===");
  const failed = results.filter((r) => !r.ok);
  const passed = results.filter((r) => r.ok);
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length + failures}`);

  if (failed.length > 0 || failures > 0) {
    process.exit(1);
  }
  console.log("\nAll integration checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
