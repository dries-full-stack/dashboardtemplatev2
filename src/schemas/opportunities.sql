create table if not exists public.opportunities (
  id text not null,
  location_id text not null,
  name text,
  status text,
  pipeline_id text,
  pipeline_stage_id text,
  monetary_value numeric,
  assigned_to text,
  contact_id text,
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);

create index if not exists opportunities_status_idx on public.opportunities (status);
create index if not exists opportunities_pipeline_idx on public.opportunities (pipeline_id, pipeline_stage_id);
create index if not exists opportunities_contact_idx on public.opportunities (contact_id);
create index if not exists opportunities_location_created_idx on public.opportunities (location_id, created_at);
create index if not exists opportunities_updated_at_idx on public.opportunities (updated_at);
create index if not exists opportunities_raw_data_idx on public.opportunities using gin (raw_data);
