-- Sales dashboard: exclude won quote->close outliers older than a configurable number of days.

alter table public.dashboard_config
  add column if not exists sales_max_quote_to_close_days integer not null default 30;

alter table public.dashboard_config
  drop constraint if exists dashboard_config_sales_max_quote_to_close_days_check;

alter table public.dashboard_config
  add constraint dashboard_config_sales_max_quote_to_close_days_check
  check (sales_max_quote_to_close_days >= 0 and sales_max_quote_to_close_days <= 3650);

grant update (sales_max_quote_to_close_days)
  on table public.dashboard_config
  to anon;
