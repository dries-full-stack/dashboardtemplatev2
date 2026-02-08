create table if not exists public.dashboard_config (
  id smallint primary key default 1,
  location_id text not null,
  campaign_field_id text,
  hook_field_id text,
  lost_reason_field_id text,
  sales_monthly_deals_target integer not null default 25,
  sales_monthly_deals_targets jsonb not null default '{}'::jsonb,
  -- Teamleader deal phase threshold: deals at/after this phase are counted as "offertes" on the Sales dashboard.
  sales_quotes_from_phase_id text,
  billing_portal_url text,
  billing_checkout_url text,
  billing_checkout_embed boolean not null default false,
  dashboard_title text,
  dashboard_subtitle text,
  dashboard_logo_url text,
  dashboard_layout jsonb,
  source_normalization_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_config_singleton check (id = 1)
);

alter table public.dashboard_config
  add column if not exists campaign_field_id text,
  add column if not exists hook_field_id text,
  add column if not exists lost_reason_field_id text,
  add column if not exists sales_monthly_deals_target integer not null default 25,
  add column if not exists sales_monthly_deals_targets jsonb not null default '{}'::jsonb,
  add column if not exists sales_quotes_from_phase_id text,
  add column if not exists billing_portal_url text,
  add column if not exists billing_checkout_url text,
  add column if not exists billing_checkout_embed boolean not null default false,
  add column if not exists dashboard_title text,
  add column if not exists dashboard_subtitle text,
  add column if not exists dashboard_logo_url text,
  add column if not exists dashboard_layout jsonb,
  add column if not exists source_normalization_rules jsonb not null default '[]'::jsonb;

alter table public.dashboard_config enable row level security;
drop policy if exists "Public read dashboard config" on public.dashboard_config;
create policy "Public read dashboard config"
  on public.dashboard_config
  for select
  using (true);

drop policy if exists "Authenticated write dashboard config" on public.dashboard_config;
create policy "Authenticated write dashboard config"
  on public.dashboard_config
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Customer mode (no login): allow anon to update KPI and billing columns.
revoke update on table public.dashboard_config from anon;
grant update (
  sales_monthly_deals_target,
  sales_monthly_deals_targets,
  sales_quotes_from_phase_id,
  billing_portal_url,
  billing_checkout_url,
  billing_checkout_embed,
  source_normalization_rules,
  updated_at
)
  on table public.dashboard_config
  to anon;

drop policy if exists "Public write dashboard KPI" on public.dashboard_config;
create policy "Public write dashboard KPI"
  on public.dashboard_config
  for update
  using (auth.role() = 'anon' and id = 1)
  with check (auth.role() = 'anon' and id = 1);
