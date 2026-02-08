-- Add Sales KPI settings to dashboard_config.

alter table public.dashboard_config
  add column if not exists sales_monthly_deals_target integer not null default 25;
-- Allow authenticated users (admin mode) to update dashboard_config from the frontend.
drop policy if exists "Authenticated write dashboard config" on public.dashboard_config;
create policy "Authenticated write dashboard config"
  on public.dashboard_config
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
