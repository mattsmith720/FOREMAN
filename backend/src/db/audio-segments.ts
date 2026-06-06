import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase.js";

export const AUDIO_BUCKET = "audio";

/** Raw audio persistence is opt-in (AUDIO_PERSIST=true) — the moat for a future
 *  Whisper fine-tune. Default off keeps storage/cost down during the pilot. */
export function isAudioPersistEnabled(): boolean {
  return process.env.AUDIO_PERSIST?.trim().toLowerCase() === "true";
}

export interface PersistAudioSegmentInput {
  sessionId: string;
  bytes: Buffer;
  mimeType: string;
  transcriptSegmentId?: string;
  durationMs?: number;
}

/**
 * Store one raw audio chunk in the private `audio` bucket and an audio_segments
 * row linking it to its transcript segment. Requires training-iteration-a.sql
 * (audio_segments table + audio bucket). Throws on failure — callers should run
 * this fire-and-forget so transcription is never blocked by audio persistence.
 */
export async function persistAudioSegment(
  input: PersistAudioSegmentInput,
): Promise<void> {
  const supabase = getSupabase();
  const id = randomUUID();
  const extension = input.mimeType.split("/")[1]?.split(";")[0] ?? "mp4";
  const storageRef = `${input.sessionId}/${id}.${extension}`;

  const upload = await supabase.storage
    .from(AUDIO_BUCKET)
    .upload(storageRef, input.bytes, {
      contentType: input.mimeType,
      upsert: false,
    });
  if (upload.error) {
    throw new Error(`Failed to upload audio segment: ${upload.error.message}`);
  }

  const insert = await supabase.from("audio_segments").insert({
    id,
    session_id: input.sessionId,
    storage_ref: storageRef,
    mime_type: input.mimeType,
    duration_ms: input.durationMs ?? null,
    transcript_segment_id: input.transcriptSegmentId ?? null,
  });

  if (insert.error) {
    await supabase.storage.from(AUDIO_BUCKET).remove([storageRef]);
    throw new Error(`Failed to store audio segment: ${insert.error.message}`);
  }
}
