import { getSupabase } from "./supabase.js";

export interface TranscriptSegmentRow {
  id: string;
  session_id: string;
  ts: string;
  text: string;
  speaker: string | null;
}

export async function persistTranscriptSegment(input: {
  sessionId: string;
  text: string;
  speaker?: string;
}): Promise<TranscriptSegmentRow> {
  const supabase = getSupabase();
  const insert = await supabase
    .from("transcript_segments")
    .insert({
      session_id: input.sessionId,
      text: input.text,
      speaker: input.speaker ?? "worker",
    })
    .select("*")
    .single();

  if (insert.error || !insert.data) {
    throw new Error(
      insert.error?.message ?? "Failed to store transcript segment",
    );
  }

  return insert.data as TranscriptSegmentRow;
}

export async function getSessionTranscriptSegments(
  sessionId: string,
): Promise<Array<{ ts: string; text: string; speaker: string | null }>> {
  const supabase = getSupabase();
  const result = await supabase
    .from("transcript_segments")
    .select("ts, text, speaker")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

export async function getRecentSessionTranscript(
  sessionId: string,
  limit = 8,
): Promise<string[]> {
  const supabase = getSupabase();
  const result = await supabase
    .from("transcript_segments")
    .select("text")
    .eq("session_id", sessionId)
    .order("ts", { ascending: false })
    .limit(limit);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? [])
    .map((row) => row.text)
    .filter((text): text is string => Boolean(text?.trim()))
    .reverse();
}
