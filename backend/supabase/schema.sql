-- Foreman data model for Supabase project uvlgbsiwyvtsjlqzozas.
-- Applied via MCP migration 2026-06-05. Re-run safely (idempotent).

create extension if not exists "pgcrypto";

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  worker text,
  job_type text,
  notes text,
  summary text
);

create table if not exists frames (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  storage_ref text,
  analysis jsonb
);

create table if not exists transcript_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  text text not null,
  speaker text
);

create table if not exists coaching_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  category text not null check (category in ('pitch', 'quality', 'time', 'safety')),
  message text not null,
  severity text not null check (severity in ('info', 'warning', 'critical'))
);

create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  key text not null,
  value text not null
);

create index if not exists frames_session_id_idx on frames(session_id);
create index if not exists coaching_events_session_id_idx on coaching_events(session_id);
create index if not exists labels_session_id_idx on labels(session_id);
create index if not exists transcript_segments_session_id_idx on transcript_segments(session_id);

-- Private storage for frame images (backend uses service_role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('frames', 'frames', false, 15728640, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Backend-only access: RLS on, no public policies (service_role bypasses RLS).
alter table sessions enable row level security;
alter table frames enable row level security;
alter table transcript_segments enable row level security;
alter table coaching_events enable row level security;
alter table labels enable row level security;
