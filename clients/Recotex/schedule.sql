-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://goxohudvapzvyfvozxjj.supabase.co/functions/v1/ghl-sync',
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
        url := 'https://goxohudvapzvyfvozxjj.supabase.co/functions/v1/teamleader-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'lookback_months', 12,
          'entities', array['users','contacts','companies','deal_pipelines','deal_phases','lost_reasons','deals','meetings']
        )
      ) as request_id;
    $$
  );
