create table if not exists public.teamleader_lost_reasons (
  id text not null,
  location_id text not null,
  name text,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_lost_reasons_name_idx on public.teamleader_lost_reasons (name);
create index if not exists teamleader_lost_reasons_location_idx on public.teamleader_lost_reasons (location_id);
create index if not exists teamleader_lost_reasons_raw_data_idx on public.teamleader_lost_reasons using gin (raw_data);
