-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
-- Replace PROJECT_REF and (optionally) re-enable SYNC_SECRET header if you set it in Supabase.

select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/ghl-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments','lost_reasons'])
      ) as request_id;
    $$
  );

-- Schedule Teamleader sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
select
  cron.schedule(
    'teamleader-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/teamleader-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'lookback_months', 12,
          'entities', array['users','contacts','companies','deal_pipelines','deal_phases','lost_reasons','deals','meetings']
        )
      ) as request_id;
    $$
  );

-- Optional: reconcile deleted Teamleader deals nightly within a recent window.
-- This prevents stale rows from lingering when a deal disappears from Teamleader.
-- select
--   cron.schedule(
--     'teamleader-sync-deals-reconcile-nightly',
--     '10 1 * * *',
--     $$
--     select
--       net.http_post(
--         url := 'https://PROJECT_REF.supabase.co/functions/v1/teamleader-sync',
--         headers := jsonb_build_object('Content-Type', 'application/json'),
--         body := jsonb_build_object(
--           'entities', array['deals'],
--           'lookback_months', 2,
--           'reconcile_deals_window', true,
--           'deal_info_max', 0
--         )
--       ) as request_id;
--     $$
--   );

-- Schedule Meta spend sync daily (pg_cron runs in UTC; adjust for CET/CEST).
select
  cron.schedule(
    'meta-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/meta-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );

-- Schedule Google Ads API spend sync daily (enable this OR the Google Sheets sync below).
-- select
--   cron.schedule(
--     'google-sync-daily',
--     '15 2 * * *',
--     $$
--     select
--       net.http_post(
--         url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sync',
--         headers := jsonb_build_object('Content-Type', 'application/json'),
--         body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
--       ) as request_id;
--     $$
--   );

-- Schedule Google Sheets spend sync daily (same schedule as Meta; pg_cron runs in UTC; adjust for CET/CEST).
select
  cron.schedule(
    'google-sheet-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sheet-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
