-- RPC helpers for dashboards

drop function if exists public.get_source_breakdown(text, timestamptz, timestamptz);
drop function if exists public.get_source_records(text, timestamptz, timestamptz, text, text, integer);
drop function if exists public.get_hook_performance(text, timestamptz, timestamptz);
drop function if exists public.custom_field_value(jsonb, text);

create or replace function public.custom_field_value(
  p_custom_fields jsonb,
  p_field_id text
)
returns text
language sql
immutable
as $$
  select nullif(trim(cf->>'value'), '')
  from jsonb_array_elements(coalesce(p_custom_fields, '[]'::jsonb)) cf
  where cf->>'id' = p_field_id
  limit 1;
$$;

create or replace function public.get_source_breakdown(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  source text,
  leads bigint,
  appointments bigint,
  appointments_without_lead_in_range bigint,
  deals bigint
)
language sql
stable
as $$
  with leads as (
    select coalesce(source_guess, 'Onbekend') as source, count(*) as leads
    from public.opportunities_view
    where location_id = p_location_id
      and created_at >= p_start
      and created_at < p_end
    group by 1
  ),
  appts as (
    select
      appt_rows.source,
      count(*) as appointments,
      count(*) filter (where not appt_rows.lead_in_range) as appointments_without_lead_in_range
    from (
      select
        a.location_id,
        a.contact_id,
        a.contact_email,
        a.start_time,
        coalesce(
          a.source,
          (
            select c.source_guess
            from public.contacts_view c
            where c.location_id = a.location_id
              and lower(trim(c.email)) = lower(trim(a.contact_email))
            limit 1
          ),
          (
            select o.source_guess
            from public.opportunities_view o
            where o.location_id = a.location_id
              and o.contact_id = a.contact_id
            limit 1
          ),
          (
            select o.source_guess
            from public.opportunities_view o
            where o.location_id = a.location_id
              and lower(trim(o.contact_email)) = lower(trim(a.contact_email))
            limit 1
          ),
          'Onbekend'
        ) as source,
        exists (
          select 1
          from public.opportunities_view o
          where o.location_id = a.location_id
            and o.created_at >= p_start
            and o.created_at < p_end
            and (
              (a.contact_id is not null and o.contact_id = a.contact_id)
              or (
                a.contact_email is not null
                and trim(a.contact_email) <> ''
                and lower(trim(o.contact_email)) = lower(trim(a.contact_email))
              )
            )
        ) as lead_in_range
      from public.appointments_view a
      where location_id = p_location_id
        and start_time >= p_start
        and start_time < p_end
    ) as appt_rows
    group by appt_rows.source
  ),
  deals as (
    select coalesce(source_guess, 'Onbekend') as source, count(*) as deals
    from public.opportunities_view
    where location_id = p_location_id
      and created_at >= p_start
      and created_at < p_end
      and (
        status ilike 'won'
        or status ilike '%won%'
        or status ilike 'closed%'
      )
    group by 1
  )
  select
    coalesce(leads.source, appts.source, deals.source) as source,
    coalesce(leads.leads, 0) as leads,
    coalesce(appts.appointments, 0) as appointments,
    coalesce(appts.appointments_without_lead_in_range, 0) as appointments_without_lead_in_range,
    coalesce(deals.deals, 0) as deals
  from leads
  full join appts on appts.source = leads.source
  full join deals on deals.source = coalesce(leads.source, appts.source)
  order by leads desc nulls last, appointments desc nulls last, source asc;
$$;

create or replace function public.get_source_records(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz,
  p_kind text,
  p_source text default null,
  p_limit integer default 200
)
returns table (
  record_id text,
  record_type text,
  occurred_at timestamptz,
  contact_name text,
  contact_email text,
  source text,
  status text
)
language sql
stable
as $$
  with appts_enriched as (
    select
      a.id,
      a.location_id,
      a.start_time,
      a.contact_id,
      coalesce(
        nullif(trim(a.contact_email), ''),
        (
          select c.email
          from public.contacts_view c
          where c.location_id = a.location_id
            and c.id = a.contact_id
          limit 1
        ),
        (
          select o.contact_email
          from public.opportunities_view o
          where o.location_id = a.location_id
            and o.contact_id = a.contact_id
            and o.contact_email is not null
          limit 1
        )
      ) as contact_email,
      coalesce(
        nullif(trim(a.contact_name), ''),
        (
          select c.contact_name
          from public.contacts_view c
          where c.location_id = a.location_id
            and c.id = a.contact_id
          limit 1
        ),
        (
          select nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '')
          from public.contacts_view c
          where c.location_id = a.location_id
            and c.id = a.contact_id
          limit 1
        ),
        (
          select o.contact_name
          from public.opportunities_view o
          where o.location_id = a.location_id
            and o.contact_id = a.contact_id
            and o.contact_name is not null
          limit 1
        ),
        (
          select c.contact_name
          from public.contacts_view c
          where c.location_id = a.location_id
            and lower(trim(c.email)) = lower(trim(a.contact_email))
          limit 1
        ),
        (
          select nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '')
          from public.contacts_view c
          where c.location_id = a.location_id
            and lower(trim(c.email)) = lower(trim(a.contact_email))
          limit 1
        ),
        (
          select o.contact_name
          from public.opportunities_view o
          where o.location_id = a.location_id
            and lower(trim(o.contact_email)) = lower(trim(a.contact_email))
            and o.contact_name is not null
          limit 1
        )
      ) as contact_name,
      a.appointment_status,
      coalesce(
        a.source,
        (
          select c.source_guess
          from public.contacts_view c
          where c.location_id = a.location_id
            and lower(trim(c.email)) = lower(trim(a.contact_email))
          limit 1
        ),
        (
          select o.source_guess
          from public.opportunities_view o
          where o.location_id = a.location_id
            and o.contact_id = a.contact_id
          limit 1
        ),
        (
          select o.source_guess
          from public.opportunities_view o
          where o.location_id = a.location_id
            and lower(trim(o.contact_email)) = lower(trim(a.contact_email))
          limit 1
        ),
        'Onbekend'
      ) as source,
      exists (
        select 1
        from public.opportunities_view o
        where o.location_id = a.location_id
          and o.created_at >= p_start
          and o.created_at < p_end
          and (
            (a.contact_id is not null and o.contact_id = a.contact_id)
            or (
              a.contact_email is not null
              and trim(a.contact_email) <> ''
              and lower(trim(o.contact_email)) = lower(trim(a.contact_email))
            )
          )
      ) as lead_in_range
    from public.appointments_view a
    where a.location_id = p_location_id
      and a.start_time >= p_start
      and a.start_time < p_end
  ),
  opps_filtered as (
    select
      o.id,
      o.location_id,
      o.created_at,
      coalesce(
        nullif(trim(o.contact_email), ''),
        (
          select c.email
          from public.contacts_view c
          where c.location_id = o.location_id
            and c.id = o.contact_id
          limit 1
        ),
        (
          select c.email
          from public.contacts_view c
          where c.location_id = o.location_id
            and lower(trim(c.email)) = lower(trim(o.contact_email))
          limit 1
        )
      ) as contact_email,
      coalesce(
        nullif(trim(o.contact_name), ''),
        (
          select c.contact_name
          from public.contacts_view c
          where c.location_id = o.location_id
            and c.id = o.contact_id
          limit 1
        ),
        (
          select nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '')
          from public.contacts_view c
          where c.location_id = o.location_id
            and c.id = o.contact_id
          limit 1
        ),
        (
          select c.contact_name
          from public.contacts_view c
          where c.location_id = o.location_id
            and lower(trim(c.email)) = lower(trim(o.contact_email))
          limit 1
        ),
        (
          select nullif(trim(concat_ws(' ', c.first_name, c.last_name)), '')
          from public.contacts_view c
          where c.location_id = o.location_id
            and lower(trim(c.email)) = lower(trim(o.contact_email))
          limit 1
        )
      ) as contact_name,
      o.status,
      coalesce(o.source_guess, 'Onbekend') as source
    from public.opportunities_view o
    where o.location_id = p_location_id
      and o.created_at >= p_start
      and o.created_at < p_end
  )
  select *
  from (
    select
      o.id as record_id,
      'lead'::text as record_type,
      o.created_at as occurred_at,
      o.contact_name,
      o.contact_email,
      o.source,
      o.status
    from opps_filtered o
    where p_kind = 'leads'
      and (p_source is null or o.source = p_source)

    union all
    select
      o.id,
      'deal',
      o.created_at,
      o.contact_name,
      o.contact_email,
      o.source,
      o.status
    from opps_filtered o
    where p_kind = 'deals'
      and (
        o.status ilike 'won'
        or o.status ilike '%won%'
        or o.status ilike 'closed%'
      )
      and (p_source is null or o.source = p_source)

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments'
      and (p_source is null or a.source = p_source)

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_without_lead_in_range'
      and not a.lead_in_range
      and (p_source is null or a.source = p_source)

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_cancelled'
      and a.appointment_status ilike '%cancel%'
      and (p_source is null or a.source = p_source)

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_confirmed'
      and a.appointment_status ilike '%confirm%'
      and (p_source is null or a.source = p_source)

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_no_show'
      and (
        a.appointment_status ilike '%no show%'
        or a.appointment_status ilike '%no-show%'
        or a.appointment_status ilike '%noshow%'
      )
      and (p_source is null or a.source = p_source)
  ) records
  order by occurred_at desc nulls last
  limit least(greatest(p_limit, 1), 500);
$$;

create or replace function public.get_hook_performance(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  hook text,
  campaign text,
  leads bigint,
  appointments bigint
)
language sql
stable
as $$
  with cfg as (
    select hook_field_id, campaign_field_id
    from public.dashboard_config
    where id = 1
  ),
  opps as (
    select
      coalesce(
        public.custom_field_value(o.custom_fields, cfg.hook_field_id),
        public.custom_field_value(c.custom_fields, cfg.hook_field_id),
        'Onbekend'
      ) as hook,
      coalesce(
        public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
        public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
        'Onbekend'
      ) as campaign,
      count(*) as leads
    from public.opportunities_view o
    cross join cfg
    left join lateral (
      select c.*
      from public.contacts_view c
      where c.location_id = o.location_id
        and (
          (o.contact_id is not null and c.id = o.contact_id)
          or (
            o.contact_id is null
            and o.contact_email is not null
            and lower(trim(c.email)) = lower(trim(o.contact_email))
          )
        )
      order by case when c.id = o.contact_id then 0 else 1 end
      limit 1
    ) c on true
    where o.location_id = p_location_id
      and o.created_at >= p_start
      and o.created_at < p_end
      and (cfg.hook_field_id is not null or cfg.campaign_field_id is not null)
    group by 1, 2
  ),
  appts as (
    select
      coalesce(
        public.custom_field_value(a.custom_fields, cfg.hook_field_id),
        public.custom_field_value(c.custom_fields, cfg.hook_field_id),
        'Onbekend'
      ) as hook,
      coalesce(
        public.custom_field_value(a.custom_fields, cfg.campaign_field_id),
        public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
        'Onbekend'
      ) as campaign,
      count(*) as appointments
    from public.appointments_view a
    cross join cfg
    left join lateral (
      select c.*
      from public.contacts_view c
      where c.location_id = a.location_id
        and (
          (a.contact_id is not null and c.id = a.contact_id)
          or (
            a.contact_id is null
            and a.contact_email is not null
            and lower(trim(c.email)) = lower(trim(a.contact_email))
          )
        )
      order by case when c.id = a.contact_id then 0 else 1 end
      limit 1
    ) c on true
    where a.location_id = p_location_id
      and a.start_time >= p_start
      and a.start_time < p_end
      and (cfg.hook_field_id is not null or cfg.campaign_field_id is not null)
    group by 1, 2
  )
  select
    coalesce(opps.hook, appts.hook, 'Onbekend') as hook,
    coalesce(opps.campaign, appts.campaign, 'Onbekend') as campaign,
    coalesce(opps.leads, 0) as leads,
    coalesce(appts.appointments, 0) as appointments
  from opps
  full join appts on appts.hook = opps.hook and appts.campaign = opps.campaign
  order by leads desc nulls last, appointments desc nulls last, hook asc;
$$;
