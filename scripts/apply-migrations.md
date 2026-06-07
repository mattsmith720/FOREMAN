# Apply Supabase migrations (manual, SQL editor)

Foreman's schema changes ship as plain SQL files under `backend/supabase/`. There is
no automated migration runner — apply them by hand in the Supabase SQL editor for
project **`uvlgbsiwyvtsjlqzozas`**.

**SQL editor:** https://supabase.com/dashboard/project/uvlgbsiwyvtsjlqzozas/sql/new

All three files are **idempotent** (`create table if not exists`, `add column if not
exists`, bucket upserts), so re-running them is safe.

## Run in this order

| # | File | Adds | When |
|---|------|------|------|
| 1 | `backend/supabase/schema.sql` | Core tables (`sessions`, `frames`, `transcript_segments`, `coaching_events`, `labels`), RLS, private `frames` bucket | Base — already applied on the pilot project; re-run only on a fresh project |
| 2 | `backend/supabase/training-iteration-a.sql` | `labels.label_source/frame_id/confirmed_at`, `audio_segments` + private `audio` bucket, `frames.transcript_window`, **`sessions.consent_at` + `sessions.data_retention`** | Before relying on consent capture, human labels, or audio persistence |
| 3 | `backend/supabase/site-videos-ingest.sql` | `site_videos` queue table + private `videos` bucket (500 MB) | Before using the `/ingest` upload page |
| 4 | `backend/supabase/crew-model.sql` | `orgs`, `crews`, `installers` + `sessions.org_id/crew_id/installer_id` | Before multi-tenant crew attribution on jobs |
| 5 | `backend/supabase/leads.sql` | `leads` table for marketing site demo requests | Before landing lead form persistence |

For each: open the file, copy its full contents, paste into a new SQL editor query,
and **Run**.

## Why order matters

- `training-iteration-a.sql` and `site-videos-ingest.sql` both reference `sessions`,
  `frames`, and `transcript_segments` from `schema.sql`.
- `site-videos-ingest.sql`'s header notes it applies after `schema.sql` +
  `training-iteration-a.sql`.

## consent_at is safe before you migrate

The backend writes `sessions.consent_at` / `sessions.data_retention` on
`/sessions/start`, but `createSession` (`backend/src/db/sessions.ts`) **retries
without those columns** if the migration hasn't run yet — so session start never
breaks. Consent simply isn't persisted until you apply migration **2**. Once applied,
new jobs record the consent timestamp automatically; no redeploy needed.

## Verify after running

In the SQL editor:

```sql
-- Migration 2 columns present?
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'sessions'
  and column_name in ('consent_at', 'data_retention');

-- Migration 2 + 3 tables present?
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('audio_segments', 'site_videos', 'orgs', 'crews', 'installers');

-- Buckets present?
select id from storage.buckets where id in ('frames', 'audio', 'videos');
```

Expect both `sessions` columns, both tables, and all three buckets.

After a job, confirm consent landed:

```sql
select id, started_at, consent_at, data_retention
from sessions order by started_at desc limit 5;
```
