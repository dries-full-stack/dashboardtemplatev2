-- Store per-month Sales KPI targets (overrides) in dashboard_config.
-- Keys are month strings like "2026-02" and values are integers.

alter table public.dashboard_config
  add column if not exists sales_monthly_deals_targets jsonb not null default '{}'::jsonb;

