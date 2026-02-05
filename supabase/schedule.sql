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
        body := jsonb_build_object('lookback_months', 12)
      ) as request_id;
    $$
  );

-- Schedule Meta + Google Ads sync daily at the same time (pg_cron runs in UTC; adjust for CET/CEST).
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
