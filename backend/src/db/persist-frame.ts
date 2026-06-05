import { randomUUID } from "node:crypto";
import type { CoachingResponse } from "@foreman/shared";
import { coachingToEvents, coachingToLabels } from "./coaching-events.js";
import { getSupabase } from "./supabase.js";

const FRAMES_BUCKET = "frames";

export interface PersistFrameInput {
  sessionId: string;
  base64: string;
  mediaType: string;
  coaching: CoachingResponse;
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

  const frameInsert = await supabase.from("frames").insert({
    id: frameId,
    session_id: input.sessionId,
    ts: ts.toISOString(),
    storage_ref: storageRef,
    analysis: input.coaching,
  });

  if (frameInsert.error) {
    throw new Error(`Failed to store frame: ${frameInsert.error.message}`);
  }

  const events = coachingToEvents(input.sessionId, input.coaching, ts);
  if (events.length > 0) {
    const eventInsert = await supabase.from("coaching_events").insert(events);
    if (eventInsert.error) {
      throw new Error(
        `Failed to store coaching events: ${eventInsert.error.message}`,
      );
    }
  }

  const labels = coachingToLabels(input.sessionId, input.coaching);
  if (labels.length > 0) {
    const labelInsert = await supabase.from("labels").insert(labels);
    if (labelInsert.error) {
      throw new Error(`Failed to store labels: ${labelInsert.error.message}`);
    }
  }

  return { frameId, storageRef };
}
