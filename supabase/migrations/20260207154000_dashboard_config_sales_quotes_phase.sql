-- Configure from which Teamleader deal phase a deal counts as an "offerte" on the Sales dashboard.

alter table public.dashboard_config
  add column if not exists sales_quotes_from_phase_id text;
-- Customer mode (no login): allow anon to update this KPI setting too.
grant update (sales_quotes_from_phase_id)
  on table public.dashboard_config
  to anon;
