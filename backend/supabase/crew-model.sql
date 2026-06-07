-- Crew model (migration 4) — org → crew → installer identity for CER attendance.
-- Idempotent. Apply after schema.sql + training-iteration-a.sql.
-- Operator applies via scripts/apply-migrations.md — code degrades until then.

create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.installers (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  display_name text not null,
  accreditation_number text,
  created_at timestamptz not null default now()
);

alter table public.sessions
  add column if not exists org_id uuid references public.orgs (id),
  add column if not exists crew_id uuid references public.crews (id),
  add column if not exists installer_id uuid references public.installers (id);

create index if not exists sessions_installer_id_idx on public.sessions (installer_id);

alter table public.orgs enable row level security;
alter table public.crews enable row level security;
alter table public.installers enable row level security;
