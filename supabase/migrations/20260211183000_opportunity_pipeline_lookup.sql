create table if not exists public.opportunity_pipeline_lookup (
  location_id text not null,
  pipeline_id text not null,
  pipeline_name text not null,
  updated_at timestamptz not null default now(),
  primary key (location_id, pipeline_id)
);

create index if not exists opportunity_pipeline_lookup_name_idx
  on public.opportunity_pipeline_lookup (pipeline_name);

create index if not exists opportunity_pipeline_lookup_updated_idx
  on public.opportunity_pipeline_lookup (updated_at);

alter table public.opportunity_pipeline_lookup enable row level security;

drop policy if exists "Public read opportunity pipeline lookup" on public.opportunity_pipeline_lookup;
create policy "Public read opportunity pipeline lookup"
  on public.opportunity_pipeline_lookup
  for select
  using (true);
