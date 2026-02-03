-- Combined schema for GHL → Supabase template

create table if not exists public.contacts (
  id text not null,
  location_id text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);

create index if not exists contacts_email_idx on public.contacts (email);
create index if not exists contacts_phone_idx on public.contacts (phone);
create index if not exists contacts_updated_at_idx on public.contacts (updated_at);
create index if not exists contacts_tags_idx on public.contacts using gin (tags);
create index if not exists contacts_raw_data_idx on public.contacts using gin (raw_data);

create table if not exists public.opportunities (
  id text not null,
  location_id text not null,
  name text,
  status text,
  pipeline_id text,
  pipeline_stage_id text,
  monetary_value numeric,
  assigned_to text,
  contact_id text,
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);

create index if not exists opportunities_status_idx on public.opportunities (status);
create index if not exists opportunities_pipeline_idx on public.opportunities (pipeline_id, pipeline_stage_id);
create index if not exists opportunities_contact_idx on public.opportunities (contact_id);
create index if not exists opportunities_location_created_idx on public.opportunities (location_id, created_at);
create index if not exists opportunities_updated_at_idx on public.opportunities (updated_at);
create index if not exists opportunities_raw_data_idx on public.opportunities using gin (raw_data);

create table if not exists public.appointments (
  id text not null,
  location_id text not null,
  title text,
  appointment_status text,
  calendar_id text,
  contact_id text,
  assigned_user_id text,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);

create index if not exists appointments_calendar_idx on public.appointments (calendar_id);
create index if not exists appointments_contact_idx on public.appointments (contact_id);
create index if not exists appointments_status_idx on public.appointments (appointment_status);
create index if not exists appointments_time_idx on public.appointments (start_time, end_time);
create index if not exists appointments_updated_at_idx on public.appointments (updated_at);
create index if not exists appointments_raw_data_idx on public.appointments using gin (raw_data);

create table if not exists public.sync_state (
  entity text not null,
  location_id text not null,
  cursor jsonb,
  last_synced_at timestamptz,
  updated_at timestamptz default now(),
  primary key (entity, location_id)
);

create table if not exists public.marketing_spend_daily (
  date date not null,
  location_id text not null,
  source text not null default 'META',
  account_id text not null,
  spend numeric not null default 0,
  leads numeric not null default 0,
  currency text,
  raw jsonb,
  synced_at timestamptz not null default now(),
  primary key (date, location_id, source, account_id)
);

create index if not exists marketing_spend_location_date_idx on public.marketing_spend_daily (location_id, date);
create index if not exists marketing_spend_source_idx on public.marketing_spend_daily (source);
create index if not exists marketing_spend_raw_idx on public.marketing_spend_daily using gin (raw);

alter table public.marketing_spend_daily enable row level security;
drop policy if exists "Public read marketing spend" on public.marketing_spend_daily;
create policy "Public read marketing spend"
  on public.marketing_spend_daily
  for select
  using (true);

create table if not exists public.marketing_spend_adset_daily (
  date date not null,
  location_id text not null,
  source text not null default 'META',
  account_id text not null,
  campaign_id text,
  campaign_name text,
  adset_id text not null,
  adset_name text,
  spend numeric not null default 0,
  leads numeric not null default 0,
  currency text,
  raw jsonb,
  synced_at timestamptz not null default now(),
  primary key (date, location_id, source, account_id, adset_id)
);

create index if not exists marketing_spend_adset_location_date_idx on public.marketing_spend_adset_daily (location_id, date);
create index if not exists marketing_spend_adset_source_idx on public.marketing_spend_adset_daily (source);
create index if not exists marketing_spend_adset_campaign_idx on public.marketing_spend_adset_daily (campaign_id);
create index if not exists marketing_spend_adset_adset_idx on public.marketing_spend_adset_daily (adset_id);
create index if not exists marketing_spend_adset_raw_idx on public.marketing_spend_adset_daily using gin (raw);

alter table public.marketing_spend_adset_daily enable row level security;
drop policy if exists "Public read marketing spend adset" on public.marketing_spend_adset_daily;
create policy "Public read marketing spend adset"
  on public.marketing_spend_adset_daily
  for select
  using (true);

create table if not exists public.marketing_spend_ad_daily (
  date date not null,
  location_id text not null,
  source text not null default 'META',
  account_id text not null,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text not null,
  ad_name text,
  spend numeric not null default 0,
  leads numeric not null default 0,
  currency text,
  raw jsonb,
  synced_at timestamptz not null default now(),
  primary key (date, location_id, source, account_id, ad_id)
);

create index if not exists marketing_spend_ad_location_date_idx on public.marketing_spend_ad_daily (location_id, date);
create index if not exists marketing_spend_ad_source_idx on public.marketing_spend_ad_daily (source);
create index if not exists marketing_spend_ad_campaign_idx on public.marketing_spend_ad_daily (campaign_id);
create index if not exists marketing_spend_ad_adset_idx on public.marketing_spend_ad_daily (adset_id);
create index if not exists marketing_spend_ad_ad_idx on public.marketing_spend_ad_daily (ad_id);
create index if not exists marketing_spend_ad_raw_idx on public.marketing_spend_ad_daily using gin (raw);

alter table public.marketing_spend_ad_daily enable row level security;
drop policy if exists "Public read marketing spend ad" on public.marketing_spend_ad_daily;
create policy "Public read marketing spend ad"
  on public.marketing_spend_ad_daily
  for select
  using (true);

create table if not exists public.ghl_integrations (
  id bigint generated by default as identity primary key,
  location_id text not null,
  private_integration_token text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ghl_integrations_location_idx on public.ghl_integrations (location_id);
create index if not exists ghl_integrations_active_idx on public.ghl_integrations (active);

alter table public.ghl_integrations enable row level security;
revoke all on table public.ghl_integrations from anon, authenticated;

create table if not exists public.dashboard_config (
  id smallint primary key default 1,
  location_id text not null,
  campaign_field_id text,
  hook_field_id text,
  lost_reason_field_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dashboard_config_singleton check (id = 1)
);

alter table public.dashboard_config
  add column if not exists campaign_field_id text,
  add column if not exists hook_field_id text,
  add column if not exists lost_reason_field_id text;

alter table public.dashboard_config enable row level security;
drop policy if exists "Public read dashboard config" on public.dashboard_config;
create policy "Public read dashboard config"
  on public.dashboard_config
  for select
  using (true);

create table if not exists public.lost_reason_lookup (
  location_id text not null,
  reason_id text not null,
  reason_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_id, reason_id)
);

create index if not exists lost_reason_lookup_location_idx on public.lost_reason_lookup (location_id);

alter table public.lost_reason_lookup enable row level security;
drop policy if exists "Public read lost reason lookup" on public.lost_reason_lookup;
create policy "Public read lost reason lookup"
  on public.lost_reason_lookup
  for select
  using (true);

-- Convenience views (raw_data + common source keys)
drop view if exists public.contacts_view;
create view public.contacts_view as
select
  id,
  location_id,
  first_name,
  last_name,
  email,
  phone,
  tags,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'type' as contact_type,
  raw_data->>'contactName' as contact_name,
  raw_data->>'companyName' as company_name,
  raw_data->>'city' as city,
  raw_data->>'state' as state,
  raw_data->>'country' as country,
  raw_data->>'postalCode' as postal_code,
  raw_data->>'address1' as address1,
  raw_data->>'website' as website,
  raw_data->>'timezone' as timezone,
  raw_data->>'dateAdded' as date_added_raw,
  raw_data->>'dateUpdated' as date_updated_raw,
  raw_data->>'dateOfBirth' as date_of_birth_raw,
  raw_data->>'assignedTo' as assigned_to_raw,
  raw_data->>'businessId' as business_id,
  raw_data->>'profilePhoto' as profile_photo,
  raw_data->>'firstNameRaw' as first_name_raw,
  raw_data->>'lastNameRaw' as last_name_raw,
  (raw_data->>'dnd')::boolean as dnd,
  raw_data->'dndSettings' as dnd_settings,
  raw_data->'customFields' as custom_fields,
  raw_data->'additionalEmails' as additional_emails,
  raw_data->'followers' as followers,
  raw_data,
  coalesce(
    raw_data->>'source',
    raw_data->>'leadSource',
    raw_data->>'contactSource',
    raw_data->>'utm_source',
    raw_data->>'utmSource',
    raw_data#>>'{attribution,source}'
  ) as source_guess
from public.contacts;

drop view if exists public.opportunities_view;
create view public.opportunities_view as
select
  id,
  location_id,
  name,
  status,
  pipeline_id,
  pipeline_stage_id,
  monetary_value,
  assigned_to,
  contact_id,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'source' as source,
  raw_data->>'leadSource' as lead_source,
  raw_data->>'contactSource' as contact_source,
  raw_data->>'contactName' as contact_name,
  raw_data->>'contactEmail' as contact_email,
  raw_data->>'contactPhone' as contact_phone,
  raw_data->>'pipelineName' as pipeline_name,
  raw_data->>'pipelineStageName' as pipeline_stage_name,
  raw_data->>'ownerId' as owner_id,
  raw_data->>'createdAt' as created_at_raw,
  raw_data->>'updatedAt' as updated_at_raw,
  raw_data->'customFields' as custom_fields,
  raw_data,
  coalesce(
    raw_data->>'source',
    raw_data->>'leadSource',
    raw_data->>'contactSource',
    raw_data->>'utm_source',
    raw_data->>'utmSource',
    raw_data#>>'{attribution,source}'
  ) as source_guess
from public.opportunities;

drop view if exists public.appointments_view;
create view public.appointments_view as
select
  id,
  location_id,
  title,
  appointment_status,
  calendar_id,
  contact_id,
  assigned_user_id,
  start_time,
  end_time,
  created_at,
  updated_at,
  synced_at,
  raw_data->>'appointmentStatus' as appointment_status_raw,
  raw_data->>'status' as status_raw,
  raw_data->>'calendarName' as calendar_name,
  raw_data->>'assignedUserName' as assigned_user_name,
  raw_data->>'contactName' as contact_name,
  raw_data->>'contactEmail' as contact_email,
  raw_data->>'contactPhone' as contact_phone,
  raw_data->>'source' as source,
  raw_data->>'startTime' as start_time_raw,
  raw_data->>'endTime' as end_time_raw,
  raw_data->>'createdAt' as created_at_raw,
  raw_data->>'updatedAt' as updated_at_raw,
  raw_data->'customFields' as custom_fields,
  raw_data
from public.appointments;

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
drop function if exists public.get_custom_field_options(text);
drop function if exists public.custom_field_value(jsonb, text);

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

create or replace function public.normalize_source(
  p_source text
)
returns text
language sql
immutable
as $$
  select case
    when p_source is null then null
    when lower(trim(p_source)) in ('meta - calculator', 'meta ads - calculator') then 'Meta - Calculator'
    else p_source
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
      coalesce(o.source_guess, 'Onbekend') as source,
      coalesce(
        public.custom_field_value(o.custom_fields, cfg.hook_field_id),
        public.custom_field_value(c.custom_fields, cfg.hook_field_id),
        'Onbekend'
      ) as hook_value,
      coalesce(
        public.custom_field_value(o.custom_fields, cfg.campaign_field_id),
        public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
        'Onbekend'
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
      coalesce(
        public.custom_field_value(a.custom_fields, cfg.hook_field_id),
        public.custom_field_value(c.custom_fields, cfg.hook_field_id),
        'Onbekend'
      ) as hook_value,
      coalesce(
        public.custom_field_value(a.custom_fields, cfg.campaign_field_id),
        public.custom_field_value(c.custom_fields, cfg.campaign_field_id),
        'Onbekend'
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
      and coalesce(a.appointment_status, a.appointment_status_raw, '') ilike '%confirm%'
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
