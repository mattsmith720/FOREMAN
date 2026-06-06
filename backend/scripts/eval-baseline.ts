/**
 * Baseline metrics over an exported training JSONL — a quick read on data volume
 * and label provenance before any training. NOT a rigorous eval: a real recall
 * number needs a held-out, fully human-labeled set (see docs/WHISPER_FINETUNE.md).
 *
 *   npx tsx scripts/eval-baseline.ts --in ./exports/training-dataset.jsonl
 */
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";

const SAFETY_RE = /safety|harness|fall|ppe|anchor|edge|ladder|isolat|arc flash/i;

function parseArgs(argv: string[]) {
  let input = "./exports/training-dataset.jsonl";
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--in" && argv[i + 1]) {
      input = argv[++i];
    }
  }
  return { input };
}

async function main() {
  const { input } = parseArgs(process.argv.slice(2));
  const rl = createInterface({
    input: createReadStream(input),
    crlfDelay: Infinity,
  });

  let frames = 0;
  let framesWithSafetyFlag = 0;
  const labelSources: Record<string, number> = {};
  let humanSafetyLabels = 0;
  let humanSafetyMatchedByClaude = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    let record: {
      analysis?: { installQualityFlags?: Array<{ message?: string }> };
      labels?: Array<{ label_source?: string; key?: string; value?: string }>;
    };
    try {
      record = JSON.parse(trimmed);
    } catch {
      continue;
    }
    frames++;

    const flags = record.analysis?.installQualityFlags ?? [];
    const claudeSafety = flags.filter((flag) => SAFETY_RE.test(flag.message ?? ""));
    if (claudeSafety.length > 0) {
      framesWithSafetyFlag++;
    }

    for (const label of record.labels ?? []) {
      const source = label.label_source ?? "claude";
      labelSources[source] = (labelSources[source] ?? 0) + 1;
      const isHuman = source === "human" || source === "corrected";
      const isSafety =
        SAFETY_RE.test(label.key ?? "") || SAFETY_RE.test(label.value ?? "");
      if (isHuman && isSafety) {
        humanSafetyLabels++;
        const needle = (label.value ?? "").slice(0, 20);
        if (
          needle &&
          claudeSafety.some((flag) => (flag.message ?? "").includes(needle))
        ) {
          humanSafetyMatchedByClaude++;
        }
      }
    }
  }

  const recall =
    humanSafetyLabels > 0 ? humanSafetyMatchedByClaude / humanSafetyLabels : null;

  console.log("=== Foreman baseline ===");
  console.log(`frames: ${frames}`);
  console.log(`frames with a claude safety flag: ${framesWithSafetyFlag}`);
  console.log(`label sources: ${JSON.stringify(labelSources)}`);
  console.log(`human-verified safety labels: ${humanSafetyLabels}`);
  console.log(
    `  ...also flagged by claude (recall proxy): ${
      recall === null
        ? "n/a (no human safety labels yet — confirm some in post-job review)"
        : `${(recall * 100).toFixed(0)}%`
    }`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
