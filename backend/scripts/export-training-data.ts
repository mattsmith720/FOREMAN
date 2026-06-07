/**
 * Export Foreman sessions to JSONL for training pipelines.
 *
 * Usage:
 *   npx tsx scripts/export-training-data.ts [--out ./exports/dataset.jsonl] [--limit 50] [--job-type panel_clean]
 */
import "dotenv/config";
import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getSupabase } from "../src/db/supabase.js";

const BUCKET = "frames";
const SIGNED_URL_TTL_SEC = 3600;

const MAINTENANCE_JOB_TYPES = new Set([
  "panel_clean",
  "pigeon_proofing",
  "thermal_scan",
  "exterior_clean",
  "commercial_clean",
]);

function parseArgs(argv: string[]) {
  let out = "./exports/training-dataset.jsonl";
  let limit = 100;
  let jobType: string | null = null;
  let maintenanceOnly = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = argv[++i];
    }
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    }
    if (argv[i] === "--job-type" && argv[i + 1]) {
      jobType = argv[++i];
    }
    if (argv[i] === "--maintenance-only") {
      maintenanceOnly = true;
    }
  }

  return { out, limit, jobType, maintenanceOnly };
}

// Paginate so sessions with more than PostgREST's default 1000-row cap are not
// silently truncated (a long job can exceed 1000 frames / transcript segments).
async function fetchAllRows(
  supabase: ReturnType<typeof getSupabase>,
  table: string,
  columns: string,
  sessionId: string,
  orderColumn: string,
): Promise<any[]> {
  const PAGE = 1000;
  const all: any[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await supabase
      .from(table)
      .select(columns)
      .eq("session_id", sessionId)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (res.error) {
      throw new Error(res.error.message);
    }
    const rows = res.data ?? [];
    all.push(...rows);
    if (rows.length < PAGE) {
      break;
    }
  }
  return all;
}

async function main() {
  const { out, limit, jobType, maintenanceOnly } = parseArgs(process.argv.slice(2));
  const supabase = getSupabase();

  let query = supabase
    .from("sessions")
    .select("id, started_at, ended_at, job_type, worker, consent_at")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (jobType) {
    query = query.eq("job_type", jobType);
  } else if (maintenanceOnly) {
    query = query.in("job_type", [...MAINTENANCE_JOB_TYPES]);
  }

  const { data: sessions, error: sessionsError } = await query;

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  await mkdir(path.dirname(path.resolve(out)), { recursive: true });
  const stream = createWriteStream(out, { encoding: "utf8" });
  let rowCount = 0;
  const labelSourceCounts: Record<string, number> = {};
  const sessionTypeCounts: Record<string, number> = {};

  for (const session of sessions ?? []) {
    const [frames, labels, transcripts] = await Promise.all([
      fetchAllRows(
        supabase,
        "frames",
        "id, ts, storage_ref, analysis, transcript_window",
        session.id,
        "ts",
      ),
      fetchAllRows(
        supabase,
        "labels",
        "key, value, label_source, frame_id, confirmed_at",
        session.id,
        "key",
      ),
      fetchAllRows(
        supabase,
        "transcript_segments",
        "ts, text, speaker",
        session.id,
        "ts",
      ),
    ]);

    const sessionType =
      session.job_type === "site_video_import" ? "site_video_import" : "live";
    sessionTypeCounts[sessionType] = (sessionTypeCounts[sessionType] ?? 0) + 1;
    for (const label of labels) {
      const source = (label.label_source as string | null) ?? "claude";
      labelSourceCounts[source] = (labelSourceCounts[source] ?? 0) + 1;
    }

    const humanVerifiedKeys = new Set(
      labels
        .filter(
          (label) =>
            label.label_source === "human" ||
            label.label_source === "corrected",
        )
        .map((label) => label.key),
    );
    // Prefer human/corrected over claude: once a key is human-verified, drop the
    // claude rows for that key from the export.
    const preferredLabels = labels.filter(
      (label) =>
        label.label_source === "human" ||
        label.label_source === "corrected" ||
        !humanVerifiedKeys.has(label.key),
    );
    // Session-scoped labels (no frame_id) and the full transcript are emitted
    // ONCE per session (on the first frame) instead of duplicated onto every
    // frame record, which previously caused an N×M blow-up in the export.
    const sessionLabels = preferredLabels.filter((label) => !label.frame_id);

    for (let frameIndex = 0; frameIndex < frames.length; frameIndex++) {
      const frame = frames[frameIndex];
      let imageUrl: string | null = null;
      if (frame.storage_ref) {
        const signed = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(frame.storage_ref, SIGNED_URL_TTL_SEC);
        imageUrl = signed.data?.signedUrl ?? null;
      }

      const record = {
        session_id: session.id,
        frame_id: frame.id,
        ts: frame.ts,
        job_type: session.job_type,
        worker: session.worker,
        consent_at: session.consent_at,
        image_url: imageUrl,
        analysis: frame.analysis,
        transcript_window: frame.transcript_window,
        // Per-frame labels only (human confirmations tied to this frame).
        labels: preferredLabels.filter((label) => label.frame_id === frame.id),
        // Session-level fields once, on the first frame.
        session_labels: frameIndex === 0 ? sessionLabels : [],
        session_transcripts: frameIndex === 0 ? transcripts : [],
      };

      stream.write(`${JSON.stringify(record)}\n`);
      rowCount++;
    }
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on("error", reject);
  });

  const meta = {
    generated_at: new Date().toISOString(),
    frame_records: rowCount,
    filter: {
      job_type: jobType,
      maintenance_only: maintenanceOnly,
    },
    sessions: {
      total: (sessions ?? []).length,
      ...sessionTypeCounts,
    },
    label_sources: labelSourceCounts,
  };
  const metaPath = `${out}.meta.json`;
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(`Exported ${rowCount} frame records to ${out}`);
  console.log(`Label sources: ${JSON.stringify(labelSourceCounts)}`);
  console.log(`Sessions: ${JSON.stringify(meta.sessions)}`);
  console.log(`Wrote export metadata to ${metaPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
