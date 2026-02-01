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
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments'])
      ) as request_id;
    $$
  );
