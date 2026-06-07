import { getSupabase } from "./supabase.js";

export interface OpsSessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  worker: string | null;
  job_type: string | null;
  summary: string | null;
  consent_at?: string | null;
  frame_count: number;
  transcript_count: number;
}

/** Last N sessions with a cheap per-session frame count, newest first. */
export async function listRecentSessions(limit = 20): Promise<OpsSessionRow[]> {
  const supabase = getSupabase();
  const base = "id, started_at, ended_at, worker, job_type, summary";
  const primary = await supabase
    .from("sessions")
    .select(`${base}, consent_at`)
    .order("started_at", { ascending: false })
    .limit(limit);
  let rows = primary.data as Array<Record<string, any>> | null;
  let error = primary.error;
  // consent_at arrives with training-iteration-a.sql — degrade gracefully so
  // /ops works before that migration is applied.
  if (error && (error.message ?? "").includes("consent_at")) {
    const fallback = await supabase
      .from("sessions")
      .select(base)
      .order("started_at", { ascending: false })
      .limit(limit);
    rows = fallback.data as Array<Record<string, any>> | null;
    error = fallback.error;
  }
  if (error) {
    throw new Error(error.message);
  }

  return Promise.all(
    (rows ?? []).map(async (session) => {
      const [frames, transcripts] = await Promise.all([
        supabase
          .from("frames")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id),
        supabase
          .from("transcript_segments")
          .select("id", { count: "exact", head: true })
          .eq("session_id", session.id),
      ]);
      return {
        ...(session as Omit<OpsSessionRow, "frame_count" | "transcript_count">),
        frame_count: frames.count ?? 0,
        transcript_count: transcripts.count ?? 0,
      };
    }),
  );
}

/** Site video ingest queue, newest first. Empty if not migrated yet. */
export async function listSiteVideoQueue(
  limit = 20,
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_videos")
    .select(
      "id, status, file_name, worker, job_type, frames_extracted, error_message, uploaded_at, processed_at",
    )
    .order("uploaded_at", { ascending: false })
    .limit(limit);
  if (error) {
    // site_videos may not be migrated yet — treat as an empty queue.
    return [];
  }
  return (data ?? []) as Array<Record<string, unknown>>;
}

/** Per-session export records (frames + labels + transcript) for a quick dump.
 *  Uses only base columns so it works regardless of the Iteration A migration. */
export async function getSessionExportRecords(
  sessionId: string,
): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabase();
  const [framesRes, labelsRes, transcriptsRes] = await Promise.all([
    supabase
      .from("frames")
      .select("id, ts, storage_ref, analysis")
      .eq("session_id", sessionId)
      .order("ts", { ascending: true }),
    supabase.from("labels").select("key, value").eq("session_id", sessionId),
    supabase
      .from("transcript_segments")
      .select("ts, text, speaker")
      .eq("session_id", sessionId)
      .order("ts", { ascending: true }),
  ]);

  if (framesRes.error) {
    throw new Error(framesRes.error.message);
  }

  const labels = labelsRes.data ?? [];
  const transcripts = transcriptsRes.data ?? [];

  return (framesRes.data ?? []).map((frame) => ({
    session_id: sessionId,
    frame_id: frame.id,
    ts: frame.ts,
    storage_ref: frame.storage_ref,
    analysis: frame.analysis,
    labels,
    session_transcripts: transcripts,
  }));
}
