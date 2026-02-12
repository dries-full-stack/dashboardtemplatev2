# Project Notes

- Supabase project ref: `PROJECT_REF`
- Supabase URL: `https://PROJECT_REF.supabase.co`
- When comparing daily numbers with external CRMs (Teamleader), use timezone-aware day ranges:
  set `VITE_DASHBOARD_TIMEZONE` and filter ranges as `[start, end)` using UTC instants (avoid off-by-one around midnight).
- `supabase/schedule.sql` uses placeholders; replace `PROJECT_REF` before running.
- Secrets are **not** stored in the repo. If `SYNC_SECRET` or `META_SYNC_SECRET` are set in Supabase,
  either add the header back in `supabase/schedule.sql` or unset those secrets to run without auth.
- Dashboard template strategy: keep a single codebase and make dashboards config-driven per customer.
  Store per-customer layout/widgets/metrics in `dashboard_config` (or JSON config), and render widgets
  dynamically in the frontend based on that config. Avoid branch-per-customer unless code divergence is required.
