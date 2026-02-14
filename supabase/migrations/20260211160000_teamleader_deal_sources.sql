create table if not exists public.teamleader_deal_sources (
  id text not null,
  location_id text not null,
  name text,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);

create index if not exists teamleader_deal_sources_name_idx on public.teamleader_deal_sources (name);
create index if not exists teamleader_deal_sources_raw_data_idx on public.teamleader_deal_sources using gin (raw_data);
