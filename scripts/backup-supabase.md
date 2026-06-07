# Supabase backup (operator procedure)

Read-only export of Foreman pilot data from Supabase project **`uvlgbsiwyvtsjlqzozas`**.
Use before schema changes, retention policy updates, or pilot milestones when you need a
recoverable snapshot of Postgres + private storage.

**Script:** `scripts/backup-supabase.sh`  
**This procedure does not modify or delete anything** in Supabase. It only reads and writes
local files under `backups/supabase/<timestamp>/`.

## What gets backed up

| Layer | Contents | Method |
|-------|----------|--------|
| **Postgres** | `sessions`, `frames`, `transcript_segments`, `coaching_events`, `labels`, `audio_segments`, `site_videos` (+ RLS, indexes) | `supabase db dump` (pg_dump, read-only) |
| **Storage** | Private buckets `frames`, `audio`, `videos` | Storage REST API list + download (service role) |
| **Repo reference** | `backend/supabase/*.sql` | Local copy into backup dir |

Auth users, Edge Functions, and dashboard settings are **not** included. For a full
platform migration, use [Supabase backup/restore docs](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## Prerequisites

1. **Supabase CLI** — [install guide](https://supabase.com/docs/guides/cli/getting-started)
2. **Docker Desktop** — running (`supabase db dump` runs pg_dump in a container)
3. **Database password** — [Database Settings](https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/database/settings) → reset if you do not have it
4. **`backend/.env`** with:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (JWT `eyJ…`, not `sb_secret_*`)
5. **Connection string** exported as `SUPABASE_DB_URL` (not stored in `.env` by default):

```bash
export SUPABASE_DB_URL="postgresql://postgres.uvlgbsiwyvtsjlqzozas:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

Get the exact string from Dashboard → **Connect** → **Session pooler**. Replace
`YOUR_PASSWORD` with the database password.

## Run a backup

From the repo root:

```bash
chmod +x scripts/backup-supabase.sh   # once
./scripts/backup-supabase.sh
```

Output lands in `backups/supabase/<UTC-timestamp>/`:

```
backups/supabase/20260607T120000Z/
├── manifest.txt
├── repo-schema/          # copy of backend/supabase/*.sql
├── db/
│   ├── roles.sql
│   ├── schema.sql
│   └── data.sql
└── storage/
    ├── frames/
    ├── audio/
    └── videos/
```

### Partial runs

```bash
# Database only (skip large storage download)
SKIP_STORAGE=1 ./scripts/backup-supabase.sh

# Storage only (skip Postgres dump)
SKIP_DB=1 ./scripts/backup-supabase.sh

# Custom destination
OUT_DIR=~/foreman-backups/pilot-june ./scripts/backup-supabase.sh
```

## Verify the backup

**Database files exist and are non-empty:**

```bash
ls -lh backups/supabase/*/db/
```

**Row counts in the live DB** (SQL editor) — compare order of magnitude after restore planning:

```sql
select 'sessions' as tbl, count(*) from sessions
union all select 'frames', count(*) from frames
union all select 'transcript_segments', count(*) from transcript_segments
union all select 'coaching_events', count(*) from coaching_events
union all select 'labels', count(*) from labels
union all select 'audio_segments', count(*) from audio_segments
union all select 'site_videos', count(*) from site_videos;
```

**Storage object counts:**

```bash
wc -l backups/supabase/*/storage/*/manifest.jsonl
```

Compare with Dashboard → **Storage** → each bucket.

## Security and retention

- Backups contain **sensitive pilot footage, transcripts, and PII**. Store offline,
  encrypted at rest, and limit access to operators who already have Supabase service-role access.
- Do **not** commit `backups/` to git (add to `.gitignore` if you keep local archives in-repo).
- Align with `sessions.data_retention` / pilot policy before long-term archival.
- Rotate the database password if it was exposed in a shell history or shared terminal.

## Restore (out of scope for the script)

Restoring is destructive on the **target** database. Do not run restore commands against
production unless you intend to overwrite it. Official flow:

1. Create a **new** Supabase project (or accept full overwrite of a staging project).
2. Apply `db/roles.sql`, then `db/schema.sql`, then `db/data.sql` per
   [backup and restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).
3. Re-upload storage objects from `storage/` with the service role or dashboard.

Test restore on a **staging** project before relying on a backup for production recovery.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `supabase: command not found` | Install CLI; ensure it is on `PATH` |
| Docker errors during `db dump` | Start Docker Desktop |
| `connection refused` / timeout on DB URL | Use Session pooler string; check password |
| Storage list returns 401 | Use JWT service role key in `SUPABASE_SERVICE_ROLE_KEY` |
| Very large `videos` bucket | Run `SKIP_STORAGE=1` for a quick DB-only snapshot; schedule storage export separately |

## Related docs

- Apply schema (forward): `scripts/apply-migrations.md`
- Env reference: `backend/.env.example`
- Deploy / project ref: `DEPLOY.md`
