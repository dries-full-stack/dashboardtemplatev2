create table if not exists public.dashboard_config (
  id smallint primary key default 1,
  location_id text not null,
  campaign_field_id text,
  hook_field_id text,
  lost_reason_field_id text,
  dashboard_title text,
  dashboard_subtitle text,
  dashboard_logo_url text,
  dashboard_layout jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_config_singleton check (id = 1)
);

alter table public.dashboard_config
  add column if not exists campaign_field_id text,
  add column if not exists hook_field_id text,
  add column if not exists lost_reason_field_id text,
  add column if not exists dashboard_title text,
  add column if not exists dashboard_subtitle text,
  add column if not exists dashboard_logo_url text,
  add column if not exists dashboard_layout jsonb;

alter table public.dashboard_config enable row level security;
drop policy if exists "Public read dashboard config" on public.dashboard_config;
create policy "Public read dashboard config"
  on public.dashboard_config
  for select
  using (true);
