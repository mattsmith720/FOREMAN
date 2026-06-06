-- Site video ingest: tradie uploads from phone or Google Drive sync.
-- Apply in Supabase SQL editor after schema.sql + training-iteration-a.sql.

create table if not exists site_videos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  worker text,
  job_type text,
  source text not null default 'upload'
    check (source in ('upload', 'google_drive')),
  external_id text,
  storage_ref text not null,
  mime_type text not null,
  file_name text,
  byte_size bigint,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'failed')),
  error_message text,
  frames_extracted integer not null default 0,
  uploaded_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists site_videos_status_idx on site_videos(status);
create index if not exists site_videos_uploaded_at_idx on site_videos(uploaded_at desc);
create unique index if not exists site_videos_external_id_idx
  on site_videos(external_id)
  where external_id is not null;

-- Private bucket for raw site videos (up to 500 MB per file).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000,
  array[
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-m4v',
    'video/mpeg'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table site_videos enable row level security;
