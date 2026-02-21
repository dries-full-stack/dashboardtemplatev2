-- Sales dashboard: filter out low-value quotes below a configurable minimum amount.

alter table public.dashboard_config
  add column if not exists sales_min_quote_amount integer not null default 1000;

alter table public.dashboard_config
  drop constraint if exists dashboard_config_sales_min_quote_amount_check;

alter table public.dashboard_config
  add constraint dashboard_config_sales_min_quote_amount_check
  check (sales_min_quote_amount >= 0 and sales_min_quote_amount <= 10000000);

grant update (sales_min_quote_amount)
  on table public.dashboard_config
  to anon;
