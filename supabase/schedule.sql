-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
-- Note: this version runs without a SYNC_SECRET header. If SYNC_SECRET is set in Supabase,
-- add the header back or unset the secret.

select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://qbzkqvobjlkcwujebenm.supabase.co/functions/v1/ghl-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments','lost_reasons'])
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
        url := 'https://qbzkqvobjlkcwujebenm.supabase.co/functions/v1/meta-sync',
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
        url := 'https://qbzkqvobjlkcwujebenm.supabase.co/functions/v1/google-sheet-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
