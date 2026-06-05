-- Iteration A: training data foundation (idempotent).
-- Apply after schema.sql via Supabase SQL editor or migration tool.

-- Human-verified label provenance
alter table labels
  add column if not exists label_source text not null default 'claude'
  check (label_source in ('claude', 'human', 'corrected'));

alter table labels
  add column if not exists frame_id uuid references frames(id) on delete set null;

alter table labels
  add column if not exists confirmed_at timestamptz;

create index if not exists labels_label_source_idx on labels(label_source);

-- Raw audio moat (parallel to transcript text)
create table if not exists audio_segments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  ts timestamptz not null default now(),
  storage_ref text not null,
  mime_type text not null,
  duration_ms integer,
  transcript_segment_id uuid references transcript_segments(id) on delete set null
);

create index if not exists audio_segments_session_id_idx on audio_segments(session_id);

-- Frame ↔ transcript alignment for training exports
alter table frames
  add column if not exists transcript_window jsonb;

-- AU privacy / consent metadata on sessions
alter table sessions
  add column if not exists consent_at timestamptz;

alter table sessions
  add column if not exists data_retention text default 'pilot_90d';

-- Private bucket for raw audio (backend service_role only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,
  15728640,
  array['audio/mp4', 'audio/aac', 'audio/webm', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table audio_segments enable row level security;
