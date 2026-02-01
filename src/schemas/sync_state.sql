create table if not exists public.sync_state (
  entity text not null,
  location_id text not null,
  cursor jsonb,
  last_synced_at timestamptz,
  updated_at timestamptz default now(),
  primary key (entity, location_id)
);
