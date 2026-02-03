-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled)
-- Replace PROJECT_REF and SYNC_SECRET before running.

select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/ghl-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', 'SYNC_SECRET'
        ),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments','lost_reasons'])
      ) as request_id;
    $$
  );

-- Schedule Meta sync daily (pg_cron runs in UTC; adjust for CET/CEST).
-- Replace PROJECT_REF and META_SYNC_SECRET before running this block.
select
  cron.schedule(
    'meta-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/meta-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', 'META_SYNC_SECRET'
        ),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );

-- Schedule Google Ads sync daily (pg_cron runs in UTC; adjust for CET/CEST).
-- Replace PROJECT_REF and GOOGLE_SYNC_SECRET before running this block.
select
  cron.schedule(
    'google-sync-daily',
    '30 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );

-- Schedule Google Sheets spend sync daily (pg_cron runs in UTC; adjust for CET/CEST).
-- Replace PROJECT_REF before running this block.
select
  cron.schedule(
    'google-sheet-sync-daily',
    '45 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sheet-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
