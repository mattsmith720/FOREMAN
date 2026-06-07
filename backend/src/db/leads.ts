import { getSupabase } from "./supabase.js";

export interface LeadInput {
  name: string;
  company: string;
  crewSize: string;
  email: string;
  phone?: string | null;
  source?: string;
}

function isMissingLeadsTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false;
  }
  const message = error.message ?? "";
  return (
    error.code === "PGRST205" ||
    message.includes("leads") ||
    message.includes("schema cache")
  );
}

export async function createLead(input: LeadInput): Promise<{ id: string }> {
  const supabase = getSupabase();
  const row = {
    name: input.name,
    company: input.company,
    crew_size: input.crewSize,
    email: input.email,
    phone: input.phone ?? null,
    source: input.source ?? "landing",
  };

  const insert = await supabase.from("leads").insert(row).select("id").single();

  if (insert.error && isMissingLeadsTable(insert.error)) {
    throw new Error("LEADS_TABLE_NOT_MIGRATED");
  }
  if (insert.error || !insert.data) {
    throw new Error(insert.error?.message ?? "Failed to save lead");
  }

  return { id: insert.data.id as string };
}
