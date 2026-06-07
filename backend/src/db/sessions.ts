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
  consent_at?: string | null;
  data_retention?: string | null;
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
  /** ISO timestamp captured when the worker accepted the consent overlay. */
  consentAt?: string;
  /** AU pilot retention policy; defaults to pilot_90d. */
  dataRetention?: string;
  orgId?: string;
  crewId?: string;
  installerId?: string;
  accreditationNumber?: string;
}

function isMissingColumn(
  error: { code?: string; message?: string } | null,
  columns: string[],
): boolean {
  if (!error) {
    return false;
  }
  const message = error.message ?? "";
  return (
    error.code === "PGRST204" ||
    columns.some((column) => message.includes(column))
  );
}

function isMissingIterationAColumn(
  error: { code?: string; message?: string } | null,
): boolean {
  return isMissingColumn(error, ["consent_at", "data_retention"]);
}

function isMissingCrewColumn(
  error: { code?: string; message?: string } | null,
): boolean {
  return isMissingColumn(error, ["org_id", "crew_id", "installer_id"]);
}

export async function createSession(
  input: CreateSessionInput,
): Promise<SessionRow> {
  const supabase = getSupabase();
  const accreditationNote = input.accreditationNumber
    ? `accreditation:${input.accreditationNumber}`
    : null;
  const base = {
    worker: input.worker ?? null,
    job_type: input.jobType ?? "panel_clean",
    notes: accreditationNote ?? input.notes ?? null,
  };
  const withConsent = {
    ...base,
    consent_at: input.consentAt ?? null,
    data_retention: input.dataRetention ?? "pilot_90d",
  };
  const withCrew = {
    ...withConsent,
    org_id: input.orgId ?? null,
    crew_id: input.crewId ?? null,
    installer_id: input.installerId ?? null,
  };

  let insert = await supabase.from("sessions").insert(withCrew).select("*").single();

  if (insert.error && isMissingCrewColumn(insert.error)) {
    insert = await supabase
      .from("sessions")
      .insert(withConsent)
      .select("*")
      .single();
  }

  // consent_at / data_retention arrive with training-iteration-a.sql. Until that
  // migration is applied, retry without them so session start never breaks.
  if (insert.error && isMissingIterationAColumn(insert.error)) {
    insert = await supabase.from("sessions").insert(base).select("*").single();
  }

  if (insert.error || !insert.data) {
    throw new Error(insert.error?.message ?? "Failed to create session");
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

  for (const result of [
    frames,
    coachingEvents,
    labels,
    transcriptSegments,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    frames: frames.count ?? 0,
    coaching_events: coachingEvents.count ?? 0,
    labels: labels.count ?? 0,
    transcript_segments: transcriptSegments.count ?? 0,
  };
}

export async function claimSessionEnd(
  sessionId: string,
): Promise<SessionRow | null> {
  const supabase = getSupabase();
  const update = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      summary: "Summarising job…",
    })
    .eq("id", sessionId)
    .is("ended_at", null)
    .select("*")
    .single();

  if (update.error) {
    if (update.error.code === "PGRST116") {
      return null;
    }
    throw new Error(update.error.message);
  }

  return update.data as SessionRow;
}

export async function updateSessionSummary(
  sessionId: string,
  summary: string,
): Promise<SessionRow> {
  const supabase = getSupabase();
  const update = await supabase
    .from("sessions")
    .update({ summary })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (update.error || !update.data) {
    throw new Error(update.error?.message ?? "Failed to update session summary");
  }

  return update.data as SessionRow;
}

export async function updateSessionNotes(
  sessionId: string,
  notes: string,
): Promise<SessionRow> {
  const supabase = getSupabase();
  const update = await supabase
    .from("sessions")
    .update({ notes })
    .eq("id", sessionId)
    .select("*")
    .single();

  if (update.error || !update.data) {
    throw new Error(update.error?.message ?? "Failed to update session notes");
  }

  return update.data as SessionRow;
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
