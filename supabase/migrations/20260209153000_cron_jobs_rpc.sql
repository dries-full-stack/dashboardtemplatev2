-- Helpers to install + inspect pg_cron schedules from onboarding.
-- These are SECURITY DEFINER and restricted to the service_role.

create or replace function public.setup_cron_jobs(
  project_ref text,
  enable_teamleader boolean default false,
  enable_meta boolean default false,
  google_mode text default 'none',
  sync_secret text default null,
  meta_sync_secret text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  ref text := coalesce(trim(project_ref), '');
  base_url text;
  mode text := lower(coalesce(trim(google_mode), 'none'));
  effective_sync_secret text := nullif(trim(sync_secret), '');
  effective_meta_sync_secret text := nullif(trim(meta_sync_secret), '');
  header_extra text := '';
  meta_header_extra text := '';
  jobs jsonb := '{}'::jsonb;
  job_id int;
  command text;
begin
  if ref = '' then
    return jsonb_build_object('ok', false, 'error', 'project_ref is required');
  end if;
  if ref !~ '^[a-z0-9-]+$' then
    return jsonb_build_object('ok', false, 'error', 'project_ref contains invalid characters');
  end if;

  base_url := format('https://%s.supabase.co/functions/v1', ref);

  if effective_sync_secret is not null then
    header_extra := format(', ''x-sync-secret'', %L', effective_sync_secret);
  end if;

  if effective_meta_sync_secret is null then
    effective_meta_sync_secret := effective_sync_secret;
  end if;
  if effective_meta_sync_secret is not null then
    meta_header_extra := format(', ''x-sync-secret'', %L', effective_meta_sync_secret);
  end if;

  begin
    execute 'create extension if not exists pg_cron';
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'Failed to create pg_cron extension', 'details', sqlerrm);
  end;

  begin
    execute 'create extension if not exists pg_net';
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'Failed to create pg_net extension', 'details', sqlerrm);
  end;

  -- Unschedule helper (ignore when missing).
  begin
    execute format(
      'select cron.unschedule(jobid) from cron.job where jobname = %L;',
      'ghl-sync-15m'
    );
  exception when others then
    -- ignore
  end;

  command := format($cmd$
    select
      net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type', 'application/json'%s),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments','lost_reasons'])
      ) as request_id;
  $cmd$, base_url || '/ghl-sync', header_extra);

  execute format(
    'select cron.schedule(%L, %L, %L);',
    'ghl-sync-15m',
    '*/15 * * * *',
    command
  ) into job_id;

  jobs := jobs || jsonb_build_object(
    'ghl-sync-15m',
    jsonb_build_object('job_id', job_id, 'schedule', '*/15 * * * *')
  );

  if enable_teamleader then
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'teamleader-sync-15m'
      );
    exception when others then
      -- ignore
    end;

    command := format($cmd$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object('Content-Type', 'application/json'%s),
          body := jsonb_build_object(
            'lookback_months', 12,
            'entities', array['users','contacts','companies','deal_pipelines','deal_phases','lost_reasons','deals','meetings']
          )
        ) as request_id;
    $cmd$, base_url || '/teamleader-sync', header_extra);

    execute format(
      'select cron.schedule(%L, %L, %L);',
      'teamleader-sync-15m',
      '*/15 * * * *',
      command
    ) into job_id;

    jobs := jobs || jsonb_build_object(
      'teamleader-sync-15m',
      jsonb_build_object('job_id', job_id, 'schedule', '*/15 * * * *')
    );
  end if;

  if enable_meta then
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'meta-sync-daily'
      );
    exception when others then
      -- ignore
    end;

    command := format($cmd$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object('Content-Type', 'application/json'%s),
          body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
        ) as request_id;
    $cmd$, base_url || '/meta-sync', meta_header_extra);

    execute format(
      'select cron.schedule(%L, %L, %L);',
      'meta-sync-daily',
      '15 2 * * *',
      command
    ) into job_id;

    jobs := jobs || jsonb_build_object(
      'meta-sync-daily',
      jsonb_build_object('job_id', job_id, 'schedule', '15 2 * * *')
    );
  end if;

  if mode = 'api' then
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sync-daily'
      );
    exception when others then
      -- ignore
    end;
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sheet-sync-daily'
      );
    exception when others then
      -- ignore
    end;

    command := format($cmd$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
        ) as request_id;
    $cmd$, base_url || '/google-sync');

    execute format(
      'select cron.schedule(%L, %L, %L);',
      'google-sync-daily',
      '15 2 * * *',
      command
    ) into job_id;

    jobs := jobs || jsonb_build_object(
      'google-sync-daily',
      jsonb_build_object('job_id', job_id, 'schedule', '15 2 * * *')
    );
  elsif mode = 'sheet' then
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sync-daily'
      );
    exception when others then
      -- ignore
    end;
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sheet-sync-daily'
      );
    exception when others then
      -- ignore
    end;

    command := format($cmd$
      select
        net.http_post(
          url := %L,
          headers := jsonb_build_object('Content-Type', 'application/json'),
          body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
        ) as request_id;
    $cmd$, base_url || '/google-sheet-sync');

    execute format(
      'select cron.schedule(%L, %L, %L);',
      'google-sheet-sync-daily',
      '15 2 * * *',
      command
    ) into job_id;

    jobs := jobs || jsonb_build_object(
      'google-sheet-sync-daily',
      jsonb_build_object('job_id', job_id, 'schedule', '15 2 * * *')
    );
  else
    -- none: unschedule if present
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sync-daily'
      );
    exception when others then
      -- ignore
    end;
    begin
      execute format(
        'select cron.unschedule(jobid) from cron.job where jobname = %L;',
        'google-sheet-sync-daily'
      );
    exception when others then
      -- ignore
    end;
  end if;

  return jsonb_build_object(
    'ok',
    true,
    'project_ref',
    ref,
    'jobs',
    jobs
  );
end;
$$;

revoke all on function public.setup_cron_jobs(text, boolean, boolean, text, text, text) from public;
grant execute on function public.setup_cron_jobs(text, boolean, boolean, text, text, text) to service_role;

create or replace function public.cron_health()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  has_cron boolean;
  has_net boolean;
  jobs jsonb := '[]'::jsonb;
  row record;
begin
  select exists(select 1 from pg_extension where extname = 'pg_cron') into has_cron;
  select exists(select 1 from pg_extension where extname = 'pg_net') into has_net;

  if has_cron then
    for row in execute 'select jobid, jobname, schedule, active from cron.job order by jobname' loop
      jobs := jobs || jsonb_build_array(
        jsonb_build_object(
          'jobid',
          row.jobid,
          'jobname',
          row.jobname,
          'schedule',
          row.schedule,
          'active',
          row.active
        )
      );
    end loop;
  end if;

  return jsonb_build_object(
    'ok',
    true,
    'pg_cron',
    has_cron,
    'pg_net',
    has_net,
    'jobs',
    jobs
  );
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.cron_health() from public;
grant execute on function public.cron_health() to service_role;

