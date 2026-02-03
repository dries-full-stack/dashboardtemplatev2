create table if not exists public.lost_reason_lookup (
  location_id text not null,
  reason_id text not null,
  reason_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_id, reason_id)
);

create index if not exists lost_reason_lookup_location_idx on public.lost_reason_lookup (location_id);

alter table public.lost_reason_lookup enable row level security;
drop policy if exists "Public read lost reason lookup" on public.lost_reason_lookup;
create policy "Public read lost reason lookup"
  on public.lost_reason_lookup
  for select
  using (true);
