-- Exclude deals from Sales KPIs by matching words/phrases in the deal title.

alter table public.dashboard_config
  add column if not exists sales_excluded_deal_keywords jsonb not null default '[]'::jsonb;

-- Customer mode (anon): allow updating exclusion keywords from the dashboard settings UI.
grant update (sales_excluded_deal_keywords)
  on table public.dashboard_config
  to anon;
