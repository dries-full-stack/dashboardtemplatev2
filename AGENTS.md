# Project Notes

- Supabase project ref: `djikubaydznmgiqajfdz`
- Supabase URL: `https://djikubaydznmgiqajfdz.supabase.co`
- `supabase/schedule.sql` uses placeholders; replace `PROJECT_REF` before running.
- Secrets are **not** stored in the repo. If `SYNC_SECRET` or `META_SYNC_SECRET` are set in Supabase,
  either add the header back in `supabase/schedule.sql` or unset those secrets to run without auth.
- Dashboard template strategy: keep a single codebase and make dashboards config-driven per customer.
  Store per-customer layout/widgets/metrics in `dashboard_config` (or JSON config), and render widgets
  dynamically in the frontend based on that config. Avoid branch-per-customer unless code divergence is required.

## Working Preference (Dries)

- If unexpected/unrelated git changes appear during work, continue with the requested task and leave those files untouched.
- Do **not** block on those changes unless explicitly asked.
- Never deploy automatically. Only run any deploy command (Netlify/Supabase/other) after explicit user approval in the current conversation.
- You may always run Teamleader deals reconcile/cleanup without extra approval to fix count mismatches
  (including deleting stale `teamleader_deals` rows that are no longer returned by Teamleader in the same lookback window).
- You may always run GHL opportunities full-sync/reconcile without extra approval to fix dashboard-vs-GHL count mismatches,
  including cleanup of stale `opportunities` rows that are no longer returned by GHL.

## Belivert Sales Source Mapping (Dynamic)

- Teamleader deal sources are synced automatically into `public.teamleader_deal_sources`.
- Sales dashboard reads Teamleader `dealSource` IDs from `teamleader_deals.raw_data.source` and maps them to labels via `teamleader_deal_sources`.
- No manual source-ID mapping is required.

### Deploy / Refresh Checklist

1. Push DB migrations:
   - `supabase db push`
2. Deploy Teamleader sync function:
   - `supabase functions deploy teamleader-sync`
3. Trigger source refresh (optional but recommended after deploy):
   - `curl -X POST "https://djikubaydznmgiqajfdz.supabase.co/functions/v1/teamleader-sync" \
     -H "Content-Type: application/json" \
     -H "apikey: <SUPABASE_PUBLISHABLE_OR_ANON_KEY>" \
     -H "Authorization: Bearer <SUPABASE_PUBLISHABLE_OR_ANON_KEY>" \
     -d '{"entities":["deal_sources"],"location_id":"PLaZB1vgUhy4CCo3vEDi"}'`
