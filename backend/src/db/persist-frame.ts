import { randomUUID } from "node:crypto";
import type { CoachingResponse } from "@foreman/shared";
import { coachingToEvents, coachingToLabels } from "./coaching-events.js";
import { getSupabase } from "./supabase.js";

const FRAMES_BUCKET = "frames";

export interface ForemanEvidenceMeta {
  capturedAt: string;
  lat?: number | null;
  lng?: number | null;
  complianceShotId?: string | null;
}

export interface PersistFrameInput {
  sessionId: string;
  base64: string;
  mediaType: string;
  coaching: CoachingResponse;
  /** Recent transcript lines aligned to this frame (Iteration A training signal). */
  transcriptWindow?: string[];
  /** Geotag + compliance shot id stored alongside model analysis (CER pack). */
  foremanEvidence?: ForemanEvidenceMeta;
}

export interface PersistFrameResult {
  frameId: string;
  storageRef: string;
}

export async function persistFrame(
  input: PersistFrameInput,
): Promise<PersistFrameResult> {
  const supabase = getSupabase();
  const frameId = randomUUID();
  const ts = new Date();
  const extension = input.mediaType.split("/")[1] ?? "jpeg";
  const storageRef = `${input.sessionId}/${frameId}.${extension}`;
  const bytes = Buffer.from(input.base64, "base64");

  const upload = await supabase.storage
    .from(FRAMES_BUCKET)
    .upload(storageRef, bytes, {
      contentType: input.mediaType,
      upsert: false,
    });

  if (upload.error) {
    throw new Error(`Failed to upload frame: ${upload.error.message}`);
  }

  const analysisPayload = input.foremanEvidence
    ? { ...input.coaching, foremanEvidence: input.foremanEvidence }
    : input.coaching;

  const baseRow = {
    id: frameId,
    session_id: input.sessionId,
    ts: ts.toISOString(),
    storage_ref: storageRef,
    analysis: analysisPayload,
  };
  const rowWithWindow =
    input.transcriptWindow && input.transcriptWindow.length > 0
      ? { ...baseRow, transcript_window: input.transcriptWindow }
      : baseRow;

  let frameInsert = await supabase.from("frames").insert(rowWithWindow);
  // frames.transcript_window arrives with training-iteration-a.sql; retry
  // without it if the migration hasn't been applied so frames still persist.
  if (
    frameInsert.error &&
    (frameInsert.error.code === "PGRST204" ||
      (frameInsert.error.message ?? "").includes("transcript_window"))
  ) {
    console.warn(
      "frames.transcript_window column missing — apply training-iteration-a.sql; persisting frame without transcript alignment signal",
    );
    frameInsert = await supabase.from("frames").insert(baseRow);
  }

  if (frameInsert.error) {
    await supabase.storage.from(FRAMES_BUCKET).remove([storageRef]);
    throw new Error(`Failed to store frame: ${frameInsert.error.message}`);
  }

  const events = coachingToEvents(input.sessionId, input.coaching, ts);
  const labels = coachingToLabels(input.sessionId, input.coaching);

  const [eventInsert, labelInsert] = await Promise.all([
    events.length > 0
      ? supabase.from("coaching_events").insert(events)
      : Promise.resolve({ error: null }),
    labels.length > 0
      ? supabase.from("labels").insert(labels)
      : Promise.resolve({ error: null }),
  ]);

  if (eventInsert.error) {
    throw new Error(
      `Failed to store coaching events: ${eventInsert.error.message}`,
    );
  }

  if (labelInsert.error) {
    throw new Error(`Failed to store labels: ${labelInsert.error.message}`);
  }

  return { frameId, storageRef };
}
