-- Security hardening: ensure only explicitly allowed (invited) dashboard users can access data.
--
-- Why:
-- - RLS policies in `20260215170000_security_hardening_auth_rls.sql` gate reads/writes to `authenticated`.
-- - If Supabase Auth signups are enabled, anyone can create an account via the Auth API and become `authenticated`.
-- - This allowlist adds a second, DB-enforced gate: only emails present in `public.dashboard_access` pass.
--
-- Notes:
-- - Service role bypasses RLS (Edge Functions keep working).
-- - The allowlist is seeded from existing `auth.users` so current invited users keep access.

create table if not exists public.dashboard_access (
  email text primary key,
  created_at timestamptz not null default now()
);

comment on table public.dashboard_access is 'Allowlist of emails that may access the dashboard via RLS.';
comment on column public.dashboard_access.email is 'Lowercased email address from auth.users.';

revoke all on table public.dashboard_access from anon;
revoke all on table public.dashboard_access from authenticated;

-- Seed allowlist with existing Auth users (typically invited users).
insert into public.dashboard_access (email)
select lower(trim(email))
from auth.users
where email is not null and trim(email) <> ''
on conflict do nothing;

create or replace function public.is_dashboard_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dashboard_access a
    where a.email = lower(
      nullif(
        trim((current_setting('request.jwt.claims', true)::jsonb ->> 'email')),
        ''
      )
    )
  );
$$;

revoke all on function public.is_dashboard_user() from public;
grant execute on function public.is_dashboard_user() to authenticated;

-- ---------------------------------------------------------------------------
-- Restrictive RLS policies: AND this allowlist with existing `authenticated` policies.
-- ---------------------------------------------------------------------------

-- dashboard_config (singleton row id=1)
drop policy if exists "Dashboard allowlist" on public.dashboard_config;
create policy "Dashboard allowlist"
  on public.dashboard_config
  as restrictive
  for all
  using (public.is_dashboard_user())
  with check (public.is_dashboard_user());

-- Core sync tables (GHL)
drop policy if exists "Dashboard allowlist" on public.contacts;
create policy "Dashboard allowlist"
  on public.contacts
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.opportunities;
create policy "Dashboard allowlist"
  on public.opportunities
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.appointments;
create policy "Dashboard allowlist"
  on public.appointments
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.sync_state;
create policy "Dashboard allowlist"
  on public.sync_state
  as restrictive
  for select
  using (public.is_dashboard_user());

-- Marketing spend tables
drop policy if exists "Dashboard allowlist" on public.marketing_spend_daily;
create policy "Dashboard allowlist"
  on public.marketing_spend_daily
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.marketing_spend_adset_daily;
create policy "Dashboard allowlist"
  on public.marketing_spend_adset_daily
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.marketing_spend_campaign_daily;
create policy "Dashboard allowlist"
  on public.marketing_spend_campaign_daily
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.marketing_spend_ad_daily;
create policy "Dashboard allowlist"
  on public.marketing_spend_ad_daily
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.marketing_spend_source_mapping;
create policy "Dashboard allowlist"
  on public.marketing_spend_source_mapping
  as restrictive
  for all
  using (public.is_dashboard_user())
  with check (public.is_dashboard_user());

-- Lost reason tables
drop policy if exists "Dashboard allowlist" on public.lost_reason_lookup;
create policy "Dashboard allowlist"
  on public.lost_reason_lookup
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.lost_reason_overrides;
create policy "Dashboard allowlist"
  on public.lost_reason_overrides
  as restrictive
  for all
  using (public.is_dashboard_user())
  with check (public.is_dashboard_user());

-- Pipeline lookup
drop policy if exists "Dashboard allowlist" on public.opportunity_pipeline_lookup;
create policy "Dashboard allowlist"
  on public.opportunity_pipeline_lookup
  as restrictive
  for select
  using (public.is_dashboard_user());

-- Teamleader tables
drop policy if exists "Dashboard allowlist" on public.teamleader_users;
create policy "Dashboard allowlist"
  on public.teamleader_users
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_contacts;
create policy "Dashboard allowlist"
  on public.teamleader_contacts
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_companies;
create policy "Dashboard allowlist"
  on public.teamleader_companies
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_deal_pipelines;
create policy "Dashboard allowlist"
  on public.teamleader_deal_pipelines
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_deal_phases;
create policy "Dashboard allowlist"
  on public.teamleader_deal_phases
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_deal_sources;
create policy "Dashboard allowlist"
  on public.teamleader_deal_sources
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_lost_reasons;
create policy "Dashboard allowlist"
  on public.teamleader_lost_reasons
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_deals;
create policy "Dashboard allowlist"
  on public.teamleader_deals
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_quotations;
create policy "Dashboard allowlist"
  on public.teamleader_quotations
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_invoices;
create policy "Dashboard allowlist"
  on public.teamleader_invoices
  as restrictive
  for select
  using (public.is_dashboard_user());

drop policy if exists "Dashboard allowlist" on public.teamleader_meetings;
create policy "Dashboard allowlist"
  on public.teamleader_meetings
  as restrictive
  for select
  using (public.is_dashboard_user());

