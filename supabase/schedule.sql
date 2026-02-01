-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled)
-- Replace ***REMOVED*** and ***REMOVED*** before running.

select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://***REMOVED***.supabase.co/functions/v1/ghl-sync',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-sync-secret', '***REMOVED***'
        ),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments'])
      ) as request_id;
    $$
  );