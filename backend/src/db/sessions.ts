import type { CoachingResponse } from "@foreman/shared";
import { getSupabase } from "./supabase.js";

export interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  worker: string | null;
  job_type: string | null;
  notes: string | null;
  summary: string | null;
}

export interface SessionCounts {
  frames: number;
  coaching_events: number;
  labels: number;
  transcript_segments: number;
}

export interface CreateSessionInput {
  worker?: string;
  jobType?: string;
  notes?: string;
}

export async function createSession(
  input: CreateSessionInput,
): Promise<SessionRow> {
  const supabase = getSupabase();
  const insert = await supabase
    .from("sessions")
    .insert({
      worker: input.worker ?? null,
      job_type: input.jobType ?? "solar_install",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (insert.error || !insert.data) {
    throw new Error(
      insert.error?.message ?? "Failed to create session",
    );
  }

  return insert.data as SessionRow;
}

export async function getSession(sessionId: string): Promise<SessionRow> {
  const supabase = getSupabase();
  const result = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (result.error || !result.data) {
    throw new Error(result.error?.message ?? "Session not found");
  }

  return result.data as SessionRow;
}

export async function assertActiveSession(sessionId: string): Promise<SessionRow> {
  const session = await getSession(sessionId);
  if (session.ended_at) {
    throw new Error("Session has already ended");
  }
  return session;
}

export async function getSessionCounts(
  sessionId: string,
): Promise<SessionCounts> {
  const supabase = getSupabase();

  const [frames, coachingEvents, labels, transcriptSegments] =
    await Promise.all([
      supabase
        .from("frames")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId),
      supabase
        .from("coaching_events")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId),
      supabase
        .from("labels")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId),
      supabase
        .from("transcript_segments")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId),
    ]);

  return {
    frames: frames.count ?? 0,
    coaching_events: coachingEvents.count ?? 0,
    labels: labels.count ?? 0,
    transcript_segments: transcriptSegments.count ?? 0,
  };
}

export async function getSessionFrames(
  sessionId: string,
): Promise<Array<{ ts: string; analysis: CoachingResponse | null }>> {
  const supabase = getSupabase();
  const result = await supabase
    .from("frames")
    .select("ts, analysis")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data ?? []) as Array<{
    ts: string;
    analysis: CoachingResponse | null;
  }>;
}

export async function getSessionCoachingEvents(sessionId: string) {
  const supabase = getSupabase();
  const result = await supabase
    .from("coaching_events")
    .select("ts, category, message, severity")
    .eq("session_id", sessionId)
    .order("ts", { ascending: true });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

export async function finishSession(
  sessionId: string,
  summary: string,
): Promise<SessionRow> {
  const supabase = getSupabase();
  const update = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      summary,
    })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (update.error || !update.data) {
    throw new Error(update.error?.message ?? "Failed to end session");
  }

  return update.data as SessionRow;
}
