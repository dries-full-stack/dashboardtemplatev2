-- RPC helpers for dashboards

drop function if exists public.get_source_breakdown(text, timestamptz, timestamptz);
drop function if exists public.get_source_records(text, timestamptz, timestamptz, text, text, integer);
drop function if exists public.get_hook_records(text, timestamptz, timestamptz, text, text, integer);
drop function if exists public.get_lost_reason_records(text, timestamptz, timestamptz, text, integer);
drop function if exists public.get_hook_performance(text, timestamptz, timestamptz);
drop function if exists public.get_lost_reasons(text, timestamptz, timestamptz);
drop function if exists public.get_lost_reason_key_candidates(text, timestamptz, timestamptz);
drop function if exists public.get_lost_reason_id_candidates(text, timestamptz, timestamptz);
drop function if exists public.get_finance_summary(text, timestamptz, timestamptz);
drop function if exists public.normalize_source(text);
drop function if exists public.normalize_hook_value(text, text);
drop function if exists public.extract_url_param(text, text);
drop function if exists public.get_custom_field_options(text);

create or replace function public.custom_field_value(
  p_custom_fields jsonb,
  p_field_id text
)
returns text
language sql
immutable
as $$
  select nullif(trim(coalesce(arr.value, obj.value)), '')
  from (
    select case
      when jsonb_typeof(p_custom_fields) = 'object' then p_custom_fields->>p_field_id
      else null
    end as value
  ) obj
  left join lateral (
    select coalesce(cf->>'value', cf->>'fieldValue', cf->>'field_value', cf->>'text') as value
    from jsonb_array_elements(
      case
        when jsonb_typeof(p_custom_fields) = 'array' then p_custom_fields
        else '[]'::jsonb
      end
    ) cf
    where cf->>'id' = p_field_id
       or cf->>'fieldId' = p_field_id
       or cf->>'name' = p_field_id
    limit 1
  ) arr on true;
$$;

create or replace function public.extract_url_param(
  p_url text,
  p_key text
)
returns text
language sql
immutable
as $$
  select case
    when p_url is null or p_key is null then null
    else nullif((regexp_match(p_url, '(?:\\?|&)' || p_key || '=([^&]+)'))[1], '')
  end;
$$;

create or replace function public.normalize_hook_value(
  p_value text,
  p_source text
)
returns text
language sql
immutable
as $$
  select case
    when p_value is null or trim(p_value) = '' or lower(trim(p_value)) = 'onbekend'
      then coalesce(p_source, 'Onbekend')
    when p_value ilike 'http%' or p_value ilike '%gclid=%' or p_value ilike '%gad_campaignid=%' or p_value ilike '%fbclid=%'
      then coalesce(
        public.extract_url_param(p_value, 'utm_campaign'),
        case
          when public.extract_url_param(p_value, 'gad_campaignid') is not null
            then 'Google Campagne ' || public.extract_url_param(p_value, 'gad_campaignid')
          else null
        end,
        case
          when public.extract_url_param(p_value, 'gclid') is not null
            then 'Google - woning prijsberekening'
          else null
        end,
        case
          when public.extract_url_param(p_value, 'fbclid') is not null
            then 'Meta - Calculator'
          else null
        end,
        p_value
      )
    else p_value
  end;
$$;

create or replace function public.normalize_source(
  p_source text
)
returns text
language sql
immutable
as $$
  select case
    when p_source is null then null
    when lower(trim(p_source)) in ('meta - calculator', 'meta ads - calculator')
      then 'Meta - Calculator'
    else nullif(trim(p_source), '')
  end;
$$;

create or replace function public.get_custom_field_options(
  p_location_id text
)
returns table (
  field_id text,
  field_name text,
  sample_value text,
  occurrences bigint,
  sources text
)
language sql
stable
as $$
  with fields as (
    select
      'contacts'::text as source,
      coalesce(cf->>'id', cf->>'fieldId') as field_id,
      cf->>'name' as field_name,
      nullif(trim(coalesce(cf->>'value', cf->>'fieldValue', cf->>'field_value', cf->>'text')), '') as field_value
    from public.contacts_view c
    cross join lateral jsonb_array_elements(coalesce(c.custom_fields, '[]'::jsonb)) cf
    where c.location_id = p_location_id

    union all
    select
      'opportunities'::text as source,
      coalesce(cf->>'id', cf->>'fieldId') as field_id,
      cf->>'name' as field_name,
      nullif(trim(coalesce(cf->>'value', cf->>'fieldValue', cf->>'field_value', cf->>'text')), '') as field_value
    from public.opportunities_view o
    cross join lateral jsonb_array_elements(coalesce(o.custom_fields, '[]'::jsonb)) cf
    where o.location_id = p_location_id

    union all
    select
      'appointments'::text as source,
      coalesce(cf->>'id', cf->>'fieldId') as field_id,
      cf->>'name' as field_name,
      nullif(trim(coalesce(cf->>'value', cf->>'fieldValue', cf->>'field_value', cf->>'text')), '') as field_value
    from public.appointments_view a
    cross join lateral jsonb_array_elements(coalesce(a.custom_fields, '[]'::jsonb)) cf
    where a.location_id = p_location_id
  )
  select
    field_id,
    field_name,
    max(field_value) filter (where field_value is not null) as sample_value,
    count(*) as occurrences,
    string_agg(distinct source, ',') as sources
  from fields
  where field_id is not null or field_name is not null
  group by field_id, field_name
  order by occurrences desc nulls last, field_name asc;
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
  appointments_confirmed bigint,
  appointments_without_lead_in_range bigint,
  deals bigint
)
language sql
stable
as $$
  with leads as (
    select public.normalize_source(coalesce(source_guess, 'Onbekend')) as source, count(*) as leads
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
      count(*) filter (where appt_rows.is_confirmed) as appointments_confirmed,
      count(*) filter (where not appt_rows.lead_in_range) as appointments_without_lead_in_range
    from (
      select
        a.location_id,
        a.contact_id,
        a.contact_email,
        a.start_time,
        public.normalize_source(coalesce(
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
        )) as source,
        coalesce(a.appointment_status, a.appointment_status_raw, '') ilike '%confirm%' as is_confirmed,
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
    select public.normalize_source(coalesce(source_guess, 'Onbekend')) as source, count(*) as deals
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
    coalesce(appts.appointments_confirmed, 0) as appointments_confirmed,
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
  contact_id text,
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
      public.normalize_source(coalesce(
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
      )) as source,
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
      o.contact_id,
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
      public.normalize_source(coalesce(o.source_guess, 'Onbekend')) as source
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
      o.contact_id,
      o.contact_name,
      o.contact_email,
      o.source,
      o.status
    from opps_filtered o
    where p_kind = 'leads'
      and (p_source is null or o.source = public.normalize_source(p_source))

    union all
    select
      o.id,
      'deal',
      o.created_at,
      o.contact_id,
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
      and (p_source is null or o.source = public.normalize_source(p_source))

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments'
      and (p_source is null or a.source = public.normalize_source(p_source))

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_without_lead_in_range'
      and not a.lead_in_range
      and (p_source is null or a.source = public.normalize_source(p_source))

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_cancelled'
      and a.appointment_status ilike '%cancel%'
      and (p_source is null or a.source = public.normalize_source(p_source))

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments_confirmed'
      and a.appointment_status ilike '%confirm%'
      and (p_source is null or a.source = public.normalize_source(p_source))

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
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
      and (p_source is null or a.source = public.normalize_source(p_source))
  ) records
  order by occurred_at desc nulls last
  limit least(greatest(p_limit, 1), 500);
$$;

create or replace function public.get_hook_records(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz,
  p_kind text,
  p_hook text default null,
  p_limit integer default 200
)
returns table (
  record_id text,
  record_type text,
  occurred_at timestamptz,
  contact_id text,
  contact_name text,
  contact_email text,
  source text,
  status text
)
language sql
stable
as $$
  with cfg as (
    select hook_field_id, campaign_field_id
    from public.dashboard_config
    where id = 1
  ),
  opps_filtered as (
    select
      o.id,
      o.location_id,
      o.created_at,
      o.contact_id,
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
      public.normalize_source(coalesce(o.source_guess, 'Onbekend')) as source,
      public.normalize_source(coalesce(o.source_guess, 'Onbekend')) as hook_value,
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(o.source_guess, 'Onbekend'))
      ) as campaign_value
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
  ),
  appts_enriched as (
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
      public.normalize_source(coalesce(
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
      )) as source,
      public.normalize_source(coalesce(
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
      )) as hook_value,
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(a.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(
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
        ))
      ) as campaign_value
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
  )
  select *
  from (
    select
      o.id as record_id,
      'lead'::text as record_type,
      o.created_at as occurred_at,
      o.contact_id,
      o.contact_name,
      o.contact_email,
      o.source,
      o.status
    from opps_filtered o
    where p_kind = 'leads'
      and (
        p_hook is null
        or o.hook_value = p_hook
        or o.campaign_value = p_hook
        or public.normalize_source(o.source) = public.normalize_source(p_hook)
      )

    union all
    select
      a.id,
      'appointment',
      a.start_time,
      a.contact_id,
      a.contact_name,
      a.contact_email,
      a.source,
      a.appointment_status
    from appts_enriched a
    where p_kind = 'appointments'
      and (
        p_hook is null
        or a.hook_value = p_hook
        or a.campaign_value = p_hook
        or public.normalize_source(a.source) = public.normalize_source(p_hook)
      )
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
  source text,
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
      public.normalize_source(coalesce(o.source_guess, 'Onbekend')) as hook,
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(o.source_guess, 'Onbekend'))
      ) as campaign,
      public.normalize_source(coalesce(o.source_guess, 'Onbekend')) as source,
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
    group by 1, 2, 3
  ),
  appts as (
    select
      public.normalize_source(coalesce(
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
      )) as hook,
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(a.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(
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
        ))
      ) as campaign,
      public.normalize_source(coalesce(
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
      )) as source,
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
      and coalesce(a.appointment_status, a.appointment_status_raw, '') ilike '%confirm%'
      and (cfg.hook_field_id is not null or cfg.campaign_field_id is not null)
    group by 1, 2, 3
  )
  select
    coalesce(opps.hook, appts.hook, 'Onbekend') as hook,
    coalesce(opps.campaign, appts.campaign, 'Onbekend') as campaign,
    coalesce(opps.source, appts.source, 'Onbekend') as source,
    coalesce(opps.leads, 0) as leads,
    coalesce(appts.appointments, 0) as appointments
  from opps
  full join appts on appts.hook = opps.hook and appts.campaign = opps.campaign and appts.source = opps.source
  order by leads desc nulls last, appointments desc nulls last, hook asc;
$$;

create or replace function public.get_lost_reason_records(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz,
  p_reason text,
  p_limit integer default 200
)
returns table (
  record_id text,
  record_type text,
  occurred_at timestamptz,
  contact_id text,
  contact_name text,
  contact_email text,
  source text,
  status text
)
language sql
stable
as $$
  with cfg as (
    select lost_reason_field_id
    from public.dashboard_config
    where id = 1
  ),
  opps_filtered as (
    select
      o.id,
      o.location_id,
      o.created_at,
      o.contact_id,
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
      coalesce(o.source_guess, 'Onbekend') as source,
      nullif(trim(coalesce(
        public.custom_field_value(o.custom_fields, cfg.lost_reason_field_id),
        public.custom_field_value(c.custom_fields, cfg.lost_reason_field_id),
        o.raw_data->>'lostReason',
        o.raw_data->>'lost_reason',
        o.raw_data->>'lostReasonName',
        o.raw_data->>'lost_reason_name',
        o.raw_data->>'lostReasonId',
        o.raw_data->>'lost_reason_id',
        o.raw_data->>'reason',
        o.raw_data->>'closedReason',
        o.raw_data->>'closed_reason',
        o.raw_data->>'statusChangeReason',
        o.raw_data->>'status_change_reason',
        o.raw_data->>'disposition',
        o.raw_data->>'outcome',
        o.raw_data->>'leadStatus',
        o.raw_data#>>'{status,reason}',
        o.raw_data#>>'{lostReason,name}',
        o.raw_data#>>'{lostReason,label}',
        o.raw_data#>>'{lostReason,reason}',
        o.raw_data#>>'{lost_reason,name}',
        o.raw_data#>>'{lost_reason,label}'
      )), '') as reason_raw
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
      and (
        o.status is null
        or (
          o.status not ilike 'won'
          and o.status not ilike '%won%'
          and o.status not ilike 'closed%'
        )
      )
  ),
  opps_labeled as (
    select
      o.*,
      coalesce(l.reason_name, o.reason_raw) as reason_label
    from opps_filtered o
    left join public.lost_reason_lookup l
      on l.location_id = p_location_id
     and l.reason_id = o.reason_raw
    where o.reason_raw is not null
  )
  select
    o.id as record_id,
    'lead'::text as record_type,
    o.created_at as occurred_at,
    o.contact_id,
    o.contact_name,
    o.contact_email,
    o.source,
    o.status
  from opps_labeled o
  where p_reason is null or lower(o.reason_label) = lower(p_reason)
  order by occurred_at desc nulls last
  limit least(greatest(p_limit, 1), 500);
$$;

create or replace function public.get_lost_reasons(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  reason text,
  total bigint
)
language sql
stable
as $$
  with cfg as (
    select lost_reason_field_id
    from public.dashboard_config
    where id = 1
  ),
  opps as (
    select
      nullif(trim(coalesce(
        public.custom_field_value(o.custom_fields, cfg.lost_reason_field_id),
        public.custom_field_value(c.custom_fields, cfg.lost_reason_field_id),
        o.raw_data->>'lostReason',
        o.raw_data->>'lost_reason',
        o.raw_data->>'lostReasonName',
        o.raw_data->>'lost_reason_name',
        o.raw_data->>'lostReasonId',
        o.raw_data->>'lost_reason_id',
        o.raw_data->>'reason',
        o.raw_data->>'closedReason',
        o.raw_data->>'closed_reason',
        o.raw_data->>'statusChangeReason',
        o.raw_data->>'status_change_reason',
        o.raw_data->>'disposition',
        o.raw_data->>'outcome',
        o.raw_data->>'leadStatus',
        o.raw_data#>>'{status,reason}',
        o.raw_data#>>'{lostReason,name}',
        o.raw_data#>>'{lostReason,label}',
        o.raw_data#>>'{lostReason,reason}',
        o.raw_data#>>'{lost_reason,name}',
        o.raw_data#>>'{lost_reason,label}'
      )), '') as reason
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
      and (
        o.status is null
        or (
          o.status not ilike 'won'
          and o.status not ilike '%won%'
          and o.status not ilike 'closed%'
        )
      )
  )
  select
    coalesce(l.reason_name, opps.reason) as reason,
    count(*) as total
  from opps
  left join public.lost_reason_lookup l
    on l.location_id = p_location_id
   and l.reason_id = opps.reason
  where opps.reason is not null
  group by coalesce(l.reason_name, opps.reason)
  order by total desc, reason asc;
$$;

create or replace function public.get_lost_reason_id_candidates(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  reason_id text,
  occurrences bigint
)
language sql
stable
as $$
  select
    nullif(trim(o.raw_data->>'lostReasonId'), '') as reason_id,
    count(*) as occurrences
  from public.opportunities_view o
  where o.location_id = p_location_id
    and o.created_at >= p_start
    and o.created_at < p_end
    and o.raw_data ? 'lostReasonId'
  group by 1
  having nullif(trim(o.raw_data->>'lostReasonId'), '') is not null
  order by occurrences desc, reason_id asc;
$$;

create or replace function public.get_lost_reason_key_candidates(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  key text,
  sample_value text,
  occurrences bigint
)
language sql
stable
as $$
  with filtered as (
    select o.raw_data
    from public.opportunities_view o
    where o.location_id = p_location_id
      and o.created_at >= p_start
      and o.created_at < p_end
      and (
        o.status is null
        or (
          o.status not ilike 'won'
          and o.status not ilike '%won%'
          and o.status not ilike 'closed%'
        )
      )
  ),
  pairs as (
    select
      kv.key,
      nullif(trim(kv.value), '') as value
    from filtered f
    cross join lateral jsonb_each_text(f.raw_data) kv
    where kv.key ilike any (array[
      '%reason%',
      '%lost%',
      '%close%',
      '%status%',
      '%disposition%',
      '%outcome%'
    ])
  )
  select
    key,
    max(value) filter (where value is not null) as sample_value,
    count(*) as occurrences
  from pairs
  where value is not null
  group by key
  order by occurrences desc, key asc;
$$;

create or replace function public.get_finance_summary(
  p_location_id text,
  p_start timestamptz,
  p_end timestamptz
)
returns table (
  total_spend numeric,
  total_leads numeric
)
language sql
stable
as $$
  select
    coalesce(sum(spend), 0) as total_spend,
    coalesce(sum(leads), 0) as total_leads
  from public.marketing_spend_daily
  where location_id = p_location_id
    and date >= (p_start at time zone 'UTC')::date
    and date < (p_end at time zone 'UTC')::date;
$$;
