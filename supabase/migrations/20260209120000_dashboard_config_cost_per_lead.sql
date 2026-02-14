-- Configure cost-per-lead (CPL) per channel/source.

alter table public.dashboard_config
  add column if not exists cost_per_lead_by_source jsonb not null default '{}'::jsonb;

-- Customer mode (no login): allow anon to update CPL settings too.
grant update (cost_per_lead_by_source)
  on table public.dashboard_config
  to anon;

