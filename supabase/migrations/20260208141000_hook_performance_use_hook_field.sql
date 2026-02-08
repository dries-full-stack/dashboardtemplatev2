-- Fix: hook performance should use the configured hook_field_id (and optionally campaign_field_id)
-- instead of defaulting to the lead source.

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
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(o.custom_fields, cfg.hook_field_id),
          public.custom_field_value(c.custom_fields, cfg.hook_field_id),
          public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(o.source_guess, 'Onbekend'))
      ) as hook_value,
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
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(a.custom_fields, cfg.hook_field_id),
          public.custom_field_value(c.custom_fields, cfg.hook_field_id),
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
      ) as hook_value,
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
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(o.custom_fields, cfg.hook_field_id),
          public.custom_field_value(c.custom_fields, cfg.hook_field_id),
          public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
          public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
          'Onbekend'
        ),
        public.normalize_source(coalesce(o.source_guess, 'Onbekend'))
      ) as hook,
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
      public.normalize_hook_value(
        coalesce(
          public.custom_field_value(a.custom_fields, cfg.hook_field_id),
          public.custom_field_value(c.custom_fields, cfg.hook_field_id),
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
      ) as hook,
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

