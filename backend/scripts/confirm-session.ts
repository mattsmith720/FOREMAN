import "dotenv/config";
import { getSession, getSessionCounts } from "../src/db/sessions.js";
import { isSupabaseConfigured } from "../src/db/supabase.js";

const sessionId = process.argv[2];

if (!sessionId) {
  console.error("Usage: npm run confirm-session -- <session-id>");
  process.exit(1);
}

if (!isSupabaseConfigured()) {
  console.error("Supabase is not configured in backend/.env");
  process.exit(1);
}

const session = await getSession(sessionId);
const stored = await getSessionCounts(sessionId);

console.log(JSON.stringify({ session, stored }, null, 2));
