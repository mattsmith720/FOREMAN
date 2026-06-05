# Security incident — Supabase service role JWT exposed (2026-06-05)

GitGuardian and GitHub secret scanning detected a **Supabase service role JWT** in commit `d1a6cd0` (`backend/.env.example`). It was removed in `44b5fb8`, but **anyone with repo access could have copied it from git history**.

## Do this now (in order)

### 1. Rotate the Supabase service role key

1. Open [Supabase → Project Settings → API](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/settings/api).
2. Under **service_role**, click **Rotate key** (or generate a new JWT if your dashboard uses legacy keys).
3. Update **only** these locations (never commit the new key):
   - `backend/.env` → `SUPABASE_SERVICE_ROLE_KEY`
   - **Render** → `foreman-api` → Environment → `SUPABASE_SERVICE_ROLE_KEY`
4. Redeploy Render after saving env vars.

The old JWT is **revoked** once rotated. Sessions/storage remain; only the credential changes.

### 2. Rotate other secrets if they shared the same `.env` file

| Secret | Where to rotate |
|--------|-----------------|
| `FOREMAN_API_KEY` | **Rotate immediately** if you set `NEXT_PUBLIC_FOREMAN_API_KEY` on Vercel — that value ships in the browser bundle. Generate a new secret; update Render + Vercel (server-only, never `NEXT_PUBLIC_*`). |
| `ANTHROPIC_API_KEY` | [Anthropic console](https://console.anthropic.com) |
| `OPENAI_API_KEY` | [OpenAI platform](https://platform.openai.com) |

### 3. Git history purge (done in repo maintenance)

History was rewritten to remove the JWT from all commits. After pull, run:

```bash
git fetch origin
git reset --hard origin/main
```

If you have local branches, rebase them onto the new `main`.

### 4. Mark GitGuardian / GitHub alerts resolved

- GitGuardian: **Fix this secret leak** (after rotation).
- GitHub: **Revoke secret** on the alert (after rotation).

## What we locked down in code

- Session-scoped HMAC tokens (`x-session-token`) for all session-bound API calls
- `FOREMAN_API_KEY` **required** on Render in production
- Strict `CORS_ORIGINS` in production
- Vercel middleware blocks `/api/*` calls without a valid app origin/referer
- No `NEXT_PUBLIC_*` API keys in the web client
- Media magic-byte validation; generic error responses
- Gitleaks CI on every push

See [SECURITY.md](SECURITY.md) for the full posture.
