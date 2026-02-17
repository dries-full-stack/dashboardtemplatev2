-- Sales dashboard: optional rules to classify omzet by product category and region.
-- Stored in dashboard_config so each client can tune keywords/postcode ranges without code changes.

alter table public.dashboard_config
  add column if not exists sales_product_category_rules jsonb not null default '[]'::jsonb,
  add column if not exists sales_region_rules jsonb not null default '[]'::jsonb;

