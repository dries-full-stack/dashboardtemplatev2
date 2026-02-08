-- Store per-dashboard source normalization rules (e.g. "Bambelo" -> bucket).

alter table public.dashboard_config
  add column if not exists source_normalization_rules jsonb not null default '[]'::jsonb;

-- Customer mode (no login): allow anon to update this too.
grant update (source_normalization_rules)
  on table public.dashboard_config
  to anon;

