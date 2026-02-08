-- Allow customers (anon) to update Sales KPI targets without Supabase Auth.
-- Security: restrict anon updates to only the KPI columns.

revoke update on table public.dashboard_config from anon;
grant update (sales_monthly_deals_target, sales_monthly_deals_targets, updated_at)
  on table public.dashboard_config
  to anon;
drop policy if exists "Public write dashboard KPI" on public.dashboard_config;
create policy "Public write dashboard KPI"
  on public.dashboard_config
  for update
  using (auth.role() = 'anon' and id = 1)
  with check (auth.role() = 'anon' and id = 1);
