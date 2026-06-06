/**
 * Split an exported training JSONL into train/val sets BY SESSION, so frames
 * from one job never leak across the split (the cardinal rule for honest eval).
 *
 *   npx tsx scripts/split-training-data.ts \
 *     --in ./exports/training-dataset.jsonl --out-dir ./exports --val-ratio 0.2
 */
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import path from "node:path";

function parseArgs(argv: string[]) {
  let input = "./exports/training-dataset.jsonl";
  let outDir = "./exports";
  let valRatio = 0.2;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--in" && argv[i + 1]) {
      input = argv[++i];
    } else if (argv[i] === "--out-dir" && argv[i + 1]) {
      outDir = argv[++i];
    } else if (argv[i] === "--val-ratio" && argv[i + 1]) {
      valRatio = Number(argv[++i]);
    }
  }
  return { input, outDir, valRatio };
}

async function main() {
  const { input, outDir, valRatio } = parseArgs(process.argv.slice(2));

  const records: Array<{ raw: string; sessionId: string }> = [];
  const rl = createInterface({
    input: createReadStream(input),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const sessionId = JSON.parse(trimmed).session_id ?? "unknown";
      records.push({ raw: trimmed, sessionId });
    } catch {
      // skip malformed lines
    }
  }

  // Deterministic split by session: sort unique session ids and pick val with a
  // stable stride so the same input always yields the same split.
  const sessions = [...new Set(records.map((r) => r.sessionId))].sort();
  const stride = valRatio > 0 ? Math.max(2, Math.round(1 / valRatio)) : 0;
  const valSessions = new Set(
    stride > 0 ? sessions.filter((_, i) => i % stride === 0) : [],
  );

  const trainLines: string[] = [];
  const valLines: string[] = [];
  for (const record of records) {
    if (valSessions.has(record.sessionId)) {
      valLines.push(record.raw);
    } else {
      trainLines.push(record.raw);
    }
  }

  await mkdir(path.resolve(outDir), { recursive: true });
  const trainPath = path.join(outDir, "train.jsonl");
  const valPath = path.join(outDir, "val.jsonl");
  const manifestPath = path.join(outDir, "split-manifest.json");
  await writeFile(trainPath, trainLines.map((l) => `${l}\n`).join(""), "utf8");
  await writeFile(valPath, valLines.map((l) => `${l}\n`).join(""), "utf8");
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        input,
        val_ratio: valRatio,
        sessions: {
          total: sessions.length,
          val: valSessions.size,
          train: sessions.length - valSessions.size,
        },
        frames: {
          total: records.length,
          train: trainLines.length,
          val: valLines.length,
        },
        val_sessions: [...valSessions],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `Split ${records.length} records from ${sessions.length} sessions (by session, no leakage):`,
  );
  console.log(
    `  train: ${trainLines.length} frames / ${sessions.length - valSessions.size} sessions -> ${trainPath}`,
  );
  console.log(
    `  val:   ${valLines.length} frames / ${valSessions.size} sessions -> ${valPath}`,
  );
  console.log(`  manifest -> ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
