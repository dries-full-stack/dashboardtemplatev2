-- Sales dashboard: exclude stale open quotes older than a configurable number of days.

alter table public.dashboard_config
  add column if not exists sales_pending_quote_max_days integer not null default 30;

alter table public.dashboard_config
  drop constraint if exists dashboard_config_sales_pending_quote_max_days_check;

alter table public.dashboard_config
  add constraint dashboard_config_sales_pending_quote_max_days_check
  check (sales_pending_quote_max_days > 0 and sales_pending_quote_max_days <= 3650);

grant update (sales_pending_quote_max_days)
  on table public.dashboard_config
  to anon;
