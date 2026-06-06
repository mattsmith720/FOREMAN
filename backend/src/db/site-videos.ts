import { randomUUID } from "node:crypto";
import { getSupabase } from "./supabase.js";

export const VIDEOS_BUCKET = "videos";

export type SiteVideoStatus = "pending" | "processing" | "ready" | "failed";
export type SiteVideoSource = "upload" | "google_drive";

export interface SiteVideoRow {
  id: string;
  session_id: string | null;
  worker: string | null;
  job_type: string | null;
  source: SiteVideoSource;
  external_id: string | null;
  storage_ref: string;
  mime_type: string;
  file_name: string | null;
  byte_size: number | null;
  status: SiteVideoStatus;
  error_message: string | null;
  frames_extracted: number;
  uploaded_at: string;
  processed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateSiteVideoInput {
  worker?: string;
  jobType?: string;
  source?: SiteVideoSource;
  externalId?: string;
  storageRef: string;
  mimeType: string;
  fileName?: string;
  byteSize?: number;
  metadata?: Record<string, unknown>;
}

export async function createSiteVideo(
  input: CreateSiteVideoInput,
): Promise<SiteVideoRow> {
  const supabase = getSupabase();
  const id = randomUUID();

  const { data, error } = await supabase
    .from("site_videos")
    .insert({
      id,
      worker: input.worker ?? null,
      job_type: input.jobType ?? null,
      source: input.source ?? "upload",
      external_id: input.externalId ?? null,
      storage_ref: input.storageRef,
      mime_type: input.mimeType,
      file_name: input.fileName ?? null,
      byte_size: input.byteSize ?? null,
      status: "pending",
      metadata: input.metadata ?? {},
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create site_videos row: ${error.message}`);
  }

  return data as SiteVideoRow;
}

export async function getSiteVideo(id: string): Promise<SiteVideoRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_videos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load site video: ${error.message}`);
  }

  return (data as SiteVideoRow | null) ?? null;
}

export async function updateSiteVideo(
  id: string,
  patch: Partial<
    Pick<
      SiteVideoRow,
      | "session_id"
      | "status"
      | "error_message"
      | "frames_extracted"
      | "processed_at"
      | "metadata"
    >
  >,
): Promise<SiteVideoRow> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_videos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update site video: ${error.message}`);
  }

  return data as SiteVideoRow;
}

export async function listPendingSiteVideos(
  limit = 20,
): Promise<SiteVideoRow[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_videos")
    .select("*")
    .in("status", ["pending"])
    .order("uploaded_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list pending site videos: ${error.message}`);
  }

  return (data as SiteVideoRow[]) ?? [];
}

export async function createSignedVideoUpload(
  storageRef: string,
): Promise<{ signedUrl: string; token: string; path: string }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUploadUrl(storageRef);

  if (error || !data) {
    throw new Error(
      `Failed to create signed upload URL: ${error?.message ?? "unknown"}`,
    );
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: storageRef,
  };
}
