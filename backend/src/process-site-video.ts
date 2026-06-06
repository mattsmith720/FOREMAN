import { execFile } from "node:child_process";
import type { CoachingResponse } from "@foreman/shared";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { analyseImage } from "./analyse.js";
import { createSession, updateSessionSummary } from "./db/sessions.js";
import { persistFrame } from "./db/persist-frame.js";
import {
  getSiteVideo,
  updateSiteVideo,
  VIDEOS_BUCKET,
  type SiteVideoRow,
} from "./db/site-videos.js";
import { getSupabase } from "./db/supabase.js";
import { transcribeAudio } from "./transcribe.js";

const execFileAsync = promisify(execFile);

const FRAME_INTERVAL_SEC = Number(process.env.INGEST_FRAME_INTERVAL_SEC ?? 10);
const MAX_FRAMES = Number(process.env.INGEST_MAX_FRAMES ?? 60);
const RUN_ANALYSE = process.env.INGEST_ANALYSE_FRAMES === "true";

const IMPORT_PLACEHOLDER: CoachingResponse = {
  observations: ["Imported frame from site video."],
  installQualityFlags: [],
  salesPitchFeedback: [],
  timeOnTaskNote: "Imported from offline video.",
  nextSteps: ["Review imported frames in training export."],
  visualCallouts: [],
};

export async function isVideoProcessingAvailable(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

async function downloadVideo(storageRef: string, destPath: string): Promise<void> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .download(storageRef);

  if (error || !data) {
    throw new Error(`Video download failed: ${error?.message ?? "empty"}`);
  }

  const bytes = Buffer.from(await data.arrayBuffer());
  await writeFile(destPath, bytes);
}

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vn",
    "-acodec",
    "pcm_s16le",
    "-ar",
    "16000",
    "-ac",
    "1",
    audioPath,
  ]);
}

async function extractFrames(
  videoPath: string,
  outputDir: string,
): Promise<string[]> {
  const pattern = path.join(outputDir, "frame_%04d.jpg");
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    videoPath,
    "-vf",
    `fps=1/${FRAME_INTERVAL_SEC}`,
    "-frames:v",
    String(MAX_FRAMES),
    pattern,
  ]);

  const { readdir } = await import("node:fs/promises");
  const files = await readdir(outputDir);
  return files
    .filter((name) => name.startsWith("frame_") && name.endsWith(".jpg"))
    .sort()
    .map((name) => path.join(outputDir, name));
}

export async function processSiteVideo(videoId: string): Promise<SiteVideoRow> {
  const row = await getSiteVideo(videoId);
  if (!row) {
    throw new Error("Site video not found");
  }

  if (row.status === "ready") {
    return row;
  }

  if (!(await isVideoProcessingAvailable())) {
    return updateSiteVideo(videoId, {
      status: "failed",
      error_message:
        "ffmpeg not installed on server — run: cd backend && npm run process-videos",
    });
  }

  await updateSiteVideo(videoId, {
    status: "processing",
    error_message: null,
  });

  const workDir = await mkdtemp(path.join(tmpdir(), "foreman-video-"));

  try {
    const videoPath = path.join(workDir, "source.bin");
    await downloadVideo(row.storage_ref, videoPath);

    const session = await createSession({
      worker: row.worker ?? undefined,
      jobType: row.job_type ?? "site_video_import",
      notes: `Imported from ${row.source}: ${row.file_name ?? row.id}`,
    });

    let transcriptText = "";
    const audioPath = path.join(workDir, "audio.wav");

    try {
      await extractAudio(videoPath, audioPath);
      const audioBytes = await readFile(audioPath);
      transcriptText = await transcribeAudio(audioBytes, "audio/wav");

      if (transcriptText.trim()) {
        const supabase = getSupabase();
        await supabase.from("transcript_segments").insert({
          session_id: session.id,
          text: transcriptText.trim(),
          speaker: row.worker ?? "worker",
        });
      }
    } catch (audioErr) {
      const message =
        audioErr instanceof Error ? audioErr.message : "audio extract failed";
      await updateSiteVideo(videoId, {
        metadata: { ...row.metadata, audio_warning: message },
      });
    }

    const framesDir = path.join(workDir, "frames");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(framesDir);
    const framePaths = await extractFrames(videoPath, framesDir);

    let framesExtracted = 0;
    for (const framePath of framePaths) {
      const bytes = await readFile(framePath);
      const base64 = bytes.toString("base64");

      let analysis: CoachingResponse = IMPORT_PLACEHOLDER;

      if (RUN_ANALYSE) {
        try {
          analysis = await analyseImage({
            base64,
            mediaType: "image/jpeg",
            context: {
              jobType: row.job_type ?? undefined,
              recentTranscript: transcriptText ? [transcriptText] : undefined,
            },
          });
        } catch {
          // Keep placeholder analysis for training either way.
        }
      }

      await persistFrame({
        sessionId: session.id,
        base64,
        mediaType: "image/jpeg",
        coaching: analysis,
      });
      framesExtracted += 1;
    }

    await updateSessionSummary(
      session.id,
      `Imported site video (${framesExtracted} frames). ${
        transcriptText ? "Audio transcribed." : "No audio track."
      }`,
    );

    await getSupabase()
      .from("sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", session.id);

    return updateSiteVideo(videoId, {
      session_id: session.id,
      status: "ready",
      frames_extracted: framesExtracted,
      processed_at: new Date().toISOString(),
      metadata: {
        ...row.metadata,
        transcript_chars: transcriptText.length,
        analyse_enabled: RUN_ANALYSE,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "processing failed";
    return updateSiteVideo(videoId, {
      status: "failed",
      error_message: message,
      processed_at: new Date().toISOString(),
    });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
