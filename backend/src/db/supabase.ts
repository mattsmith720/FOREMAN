import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/^['"]|['"]$/g, "");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    cleanEnv(process.env.SUPABASE_URL) &&
      cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function getSupabase(): SupabaseClient {
  if (client) {
    return client;
  }

  const url = cleanEnv(process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for session logging",
    );
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
