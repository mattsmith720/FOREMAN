/**
 * Export Foreman sessions to JSONL for training pipelines.
 *
 * Usage:
 *   npx tsx scripts/export-training-data.ts [--out ./exports/dataset.jsonl] [--limit 50]
 */
import "dotenv/config";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getSupabase } from "../src/db/supabase.js";

const BUCKET = "frames";
const SIGNED_URL_TTL_SEC = 3600;

function parseArgs(argv: string[]) {
  let out = "./exports/training-dataset.jsonl";
  let limit = 100;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out" && argv[i + 1]) {
      out = argv[++i];
    }
    if (argv[i] === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    }
  }

  return { out, limit };
}

async function main() {
  const { out, limit } = parseArgs(process.argv.slice(2));
  const supabase = getSupabase();

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, started_at, ended_at, job_type, worker, consent_at")
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  await mkdir(path.dirname(path.resolve(out)), { recursive: true });
  const stream = createWriteStream(out, { encoding: "utf8" });
  let rowCount = 0;

  for (const session of sessions ?? []) {
    const [framesRes, labelsRes, transcriptsRes] = await Promise.all([
      supabase
        .from("frames")
        .select("id, ts, storage_ref, analysis, transcript_window")
        .eq("session_id", session.id)
        .order("ts", { ascending: true }),
      supabase
        .from("labels")
        .select("key, value, label_source, frame_id, confirmed_at")
        .eq("session_id", session.id),
      supabase
        .from("transcript_segments")
        .select("ts, text, speaker")
        .eq("session_id", session.id)
        .order("ts", { ascending: true }),
    ]);

    if (framesRes.error) {
      throw new Error(framesRes.error.message);
    }

    for (const frame of framesRes.data ?? []) {
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
        labels: (labelsRes.data ?? []).filter(
          (label) => !label.frame_id || label.frame_id === frame.id,
        ),
        session_transcripts: transcriptsRes.data ?? [],
      };

      stream.write(`${JSON.stringify(record)}\n`);
      rowCount++;
    }
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on("error", reject);
  });

  console.log(`Exported ${rowCount} frame records to ${out}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
