-- Lost reason overrides
-- Some GHL opportunity records only contain a lostReasonId (no label). This table lets us map IDs to readable labels.

create table if not exists public.lost_reason_overrides (
  location_id text not null,
  reason_id text not null,
  reason_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_id, reason_id)
);

create index if not exists lost_reason_overrides_location_idx on public.lost_reason_overrides (location_id);

alter table public.lost_reason_overrides enable row level security;

drop policy if exists "Public read lost reason overrides" on public.lost_reason_overrides;
create policy "Public read lost reason overrides"
  on public.lost_reason_overrides
  for select
  using (true);

drop policy if exists "Public insert lost reason overrides" on public.lost_reason_overrides;
create policy "Public insert lost reason overrides"
  on public.lost_reason_overrides
  for insert
  with check (
    auth.role() = 'anon'
    and location_id = (select location_id from public.dashboard_config where id = 1)
  );

drop policy if exists "Public update lost reason overrides" on public.lost_reason_overrides;
create policy "Public update lost reason overrides"
  on public.lost_reason_overrides
  for update
  using (
    auth.role() = 'anon'
    and location_id = (select location_id from public.dashboard_config where id = 1)
  )
  with check (
    auth.role() = 'anon'
    and location_id = (select location_id from public.dashboard_config where id = 1)
  );

drop policy if exists "Authenticated write lost reason overrides" on public.lost_reason_overrides;
create policy "Authenticated write lost reason overrides"
  on public.lost_reason_overrides
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

grant select, insert, update on table public.lost_reason_overrides to anon, authenticated;

-- Allow customers (anon) to update lost reason custom field id without Supabase Auth.
grant update (lost_reason_field_id)
  on table public.dashboard_config
  to anon;

-- Include overrides in the lost reason RPC functions, and format bare ObjectIDs.
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
      coalesce(ovr.reason_name, l.reason_name, o.reason_raw) as reason_label
    from opps_filtered o
    left join public.lost_reason_overrides ovr
      on ovr.location_id = p_location_id
     and ovr.reason_id = o.reason_raw
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
  )
  select
    coalesce(ovr.reason_name, l.reason_name, opps.reason_raw) as reason,
    count(*) as total
  from opps
  left join public.lost_reason_overrides ovr
    on ovr.location_id = p_location_id
   and ovr.reason_id = opps.reason_raw
  left join public.lost_reason_lookup l
    on l.location_id = p_location_id
   and l.reason_id = opps.reason_raw
  where opps.reason_raw is not null
  group by 1
  order by total desc, reason asc;
$$;

