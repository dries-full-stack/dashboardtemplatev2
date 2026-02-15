-- Security hardening: require authenticated users for dashboard reads/writes.
-- This template previously supported "customer mode" (anonymous access via publishable/anon key).
-- That is unsafe for any dataset that includes leads, appointments, spend, or other business data.
--
-- Notes:
-- - Service role continues to work (bypass RLS).
-- - The dashboard frontend now defaults to `VITE_REQUIRE_AUTH=true` and uses magic-link login.

-- ---------------------------------------------------------------------------
-- dashboard_config (singleton row id=1)
-- ---------------------------------------------------------------------------

alter table public.dashboard_config enable row level security;

revoke all on table public.dashboard_config from anon;
revoke all on table public.dashboard_config from authenticated;
grant select, insert, update on table public.dashboard_config to authenticated;

drop policy if exists "Public read dashboard config" on public.dashboard_config;
drop policy if exists "Public write dashboard KPI" on public.dashboard_config;
drop policy if exists "Authenticated write dashboard config" on public.dashboard_config;
create policy "Authenticated manage dashboard config"
  on public.dashboard_config
  for all
  using (auth.role() = 'authenticated' and id = 1)
  with check (auth.role() = 'authenticated' and id = 1);

-- ---------------------------------------------------------------------------
-- Core sync tables (GHL)
-- ---------------------------------------------------------------------------

alter table public.contacts enable row level security;
revoke all on table public.contacts from anon;
revoke all on table public.contacts from authenticated;
grant select on table public.contacts to authenticated;
drop policy if exists "Authenticated read contacts" on public.contacts;
create policy "Authenticated read contacts"
  on public.contacts
  for select
  using (auth.role() = 'authenticated');

alter table public.opportunities enable row level security;
revoke all on table public.opportunities from anon;
revoke all on table public.opportunities from authenticated;
grant select on table public.opportunities to authenticated;
drop policy if exists "Authenticated read opportunities" on public.opportunities;
create policy "Authenticated read opportunities"
  on public.opportunities
  for select
  using (auth.role() = 'authenticated');

alter table public.appointments enable row level security;
revoke all on table public.appointments from anon;
revoke all on table public.appointments from authenticated;
grant select on table public.appointments to authenticated;
drop policy if exists "Authenticated read appointments" on public.appointments;
create policy "Authenticated read appointments"
  on public.appointments
  for select
  using (auth.role() = 'authenticated');

alter table public.sync_state enable row level security;
revoke all on table public.sync_state from anon;
revoke all on table public.sync_state from authenticated;
grant select on table public.sync_state to authenticated;
drop policy if exists "Authenticated read sync state" on public.sync_state;
create policy "Authenticated read sync state"
  on public.sync_state
  for select
  using (auth.role() = 'authenticated');

-- Views used by the dashboard (grant on view; RLS lives on base tables above).
revoke all on table public.contacts_view from anon;
revoke all on table public.contacts_view from authenticated;
grant select on table public.contacts_view to authenticated;

revoke all on table public.opportunities_view from anon;
revoke all on table public.opportunities_view from authenticated;
grant select on table public.opportunities_view to authenticated;

revoke all on table public.appointments_view from anon;
revoke all on table public.appointments_view from authenticated;
grant select on table public.appointments_view to authenticated;

-- ---------------------------------------------------------------------------
-- Marketing spend tables
-- ---------------------------------------------------------------------------

alter table public.marketing_spend_daily enable row level security;
revoke all on table public.marketing_spend_daily from anon;
revoke all on table public.marketing_spend_daily from authenticated;
grant select on table public.marketing_spend_daily to authenticated;
drop policy if exists "Public read marketing spend" on public.marketing_spend_daily;
drop policy if exists "Authenticated read marketing spend" on public.marketing_spend_daily;
create policy "Authenticated read marketing spend"
  on public.marketing_spend_daily
  for select
  using (auth.role() = 'authenticated');

alter table public.marketing_spend_adset_daily enable row level security;
revoke all on table public.marketing_spend_adset_daily from anon;
revoke all on table public.marketing_spend_adset_daily from authenticated;
grant select on table public.marketing_spend_adset_daily to authenticated;
drop policy if exists "Public read marketing spend adset" on public.marketing_spend_adset_daily;
drop policy if exists "Authenticated read marketing spend adset" on public.marketing_spend_adset_daily;
create policy "Authenticated read marketing spend adset"
  on public.marketing_spend_adset_daily
  for select
  using (auth.role() = 'authenticated');

alter table public.marketing_spend_campaign_daily enable row level security;
revoke all on table public.marketing_spend_campaign_daily from anon;
revoke all on table public.marketing_spend_campaign_daily from authenticated;
grant select on table public.marketing_spend_campaign_daily to authenticated;
drop policy if exists "Public read marketing spend campaign" on public.marketing_spend_campaign_daily;
drop policy if exists "Authenticated read marketing spend campaign" on public.marketing_spend_campaign_daily;
create policy "Authenticated read marketing spend campaign"
  on public.marketing_spend_campaign_daily
  for select
  using (auth.role() = 'authenticated');

alter table public.marketing_spend_ad_daily enable row level security;
revoke all on table public.marketing_spend_ad_daily from anon;
revoke all on table public.marketing_spend_ad_daily from authenticated;
grant select on table public.marketing_spend_ad_daily to authenticated;
drop policy if exists "Public read marketing spend ad" on public.marketing_spend_ad_daily;
drop policy if exists "Authenticated read marketing spend ad" on public.marketing_spend_ad_daily;
create policy "Authenticated read marketing spend ad"
  on public.marketing_spend_ad_daily
  for select
  using (auth.role() = 'authenticated');

alter table public.marketing_spend_source_mapping enable row level security;
revoke all on table public.marketing_spend_source_mapping from anon;
revoke all on table public.marketing_spend_source_mapping from authenticated;
grant select, insert, update, delete on table public.marketing_spend_source_mapping to authenticated;
drop policy if exists "Public read marketing spend source mapping" on public.marketing_spend_source_mapping;
drop policy if exists "Authenticated write marketing spend source mapping" on public.marketing_spend_source_mapping;
create policy "Authenticated manage marketing spend source mapping"
  on public.marketing_spend_source_mapping
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Lost reason tables
-- ---------------------------------------------------------------------------

alter table public.lost_reason_lookup enable row level security;
revoke all on table public.lost_reason_lookup from anon;
revoke all on table public.lost_reason_lookup from authenticated;
grant select on table public.lost_reason_lookup to authenticated;
drop policy if exists "Public read lost reason lookup" on public.lost_reason_lookup;
drop policy if exists "Authenticated read lost reason lookup" on public.lost_reason_lookup;
create policy "Authenticated read lost reason lookup"
  on public.lost_reason_lookup
  for select
  using (auth.role() = 'authenticated');

alter table public.lost_reason_overrides enable row level security;
revoke all on table public.lost_reason_overrides from anon;
revoke all on table public.lost_reason_overrides from authenticated;
grant select, insert, update on table public.lost_reason_overrides to authenticated;
drop policy if exists "Public read lost reason overrides" on public.lost_reason_overrides;
drop policy if exists "Public insert lost reason overrides" on public.lost_reason_overrides;
drop policy if exists "Public update lost reason overrides" on public.lost_reason_overrides;
drop policy if exists "Authenticated write lost reason overrides" on public.lost_reason_overrides;
create policy "Authenticated manage lost reason overrides"
  on public.lost_reason_overrides
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Pipeline lookup table
-- ---------------------------------------------------------------------------

alter table public.opportunity_pipeline_lookup enable row level security;
revoke all on table public.opportunity_pipeline_lookup from anon;
revoke all on table public.opportunity_pipeline_lookup from authenticated;
grant select on table public.opportunity_pipeline_lookup to authenticated;
drop policy if exists "Public read opportunity pipeline lookup" on public.opportunity_pipeline_lookup;
drop policy if exists "Authenticated read opportunity pipeline lookup" on public.opportunity_pipeline_lookup;
create policy "Authenticated read opportunity pipeline lookup"
  on public.opportunity_pipeline_lookup
  for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Teamleader tables
-- ---------------------------------------------------------------------------

alter table public.teamleader_users enable row level security;
revoke all on table public.teamleader_users from anon;
revoke all on table public.teamleader_users from authenticated;
grant select on table public.teamleader_users to authenticated;
drop policy if exists "Authenticated read teamleader users" on public.teamleader_users;
create policy "Authenticated read teamleader users"
  on public.teamleader_users
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_contacts enable row level security;
revoke all on table public.teamleader_contacts from anon;
revoke all on table public.teamleader_contacts from authenticated;
grant select on table public.teamleader_contacts to authenticated;
drop policy if exists "Authenticated read teamleader contacts" on public.teamleader_contacts;
create policy "Authenticated read teamleader contacts"
  on public.teamleader_contacts
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_companies enable row level security;
revoke all on table public.teamleader_companies from anon;
revoke all on table public.teamleader_companies from authenticated;
grant select on table public.teamleader_companies to authenticated;
drop policy if exists "Authenticated read teamleader companies" on public.teamleader_companies;
create policy "Authenticated read teamleader companies"
  on public.teamleader_companies
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_deal_pipelines enable row level security;
revoke all on table public.teamleader_deal_pipelines from anon;
revoke all on table public.teamleader_deal_pipelines from authenticated;
grant select on table public.teamleader_deal_pipelines to authenticated;
drop policy if exists "Authenticated read teamleader deal pipelines" on public.teamleader_deal_pipelines;
create policy "Authenticated read teamleader deal pipelines"
  on public.teamleader_deal_pipelines
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_deal_phases enable row level security;
revoke all on table public.teamleader_deal_phases from anon;
revoke all on table public.teamleader_deal_phases from authenticated;
grant select on table public.teamleader_deal_phases to authenticated;
drop policy if exists "Authenticated read teamleader deal phases" on public.teamleader_deal_phases;
create policy "Authenticated read teamleader deal phases"
  on public.teamleader_deal_phases
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_deal_sources enable row level security;
revoke all on table public.teamleader_deal_sources from anon;
revoke all on table public.teamleader_deal_sources from authenticated;
grant select on table public.teamleader_deal_sources to authenticated;
drop policy if exists "Authenticated read teamleader deal sources" on public.teamleader_deal_sources;
create policy "Authenticated read teamleader deal sources"
  on public.teamleader_deal_sources
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_lost_reasons enable row level security;
revoke all on table public.teamleader_lost_reasons from anon;
revoke all on table public.teamleader_lost_reasons from authenticated;
grant select on table public.teamleader_lost_reasons to authenticated;
drop policy if exists "Authenticated read teamleader lost reasons" on public.teamleader_lost_reasons;
create policy "Authenticated read teamleader lost reasons"
  on public.teamleader_lost_reasons
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_deals enable row level security;
revoke all on table public.teamleader_deals from anon;
revoke all on table public.teamleader_deals from authenticated;
grant select on table public.teamleader_deals to authenticated;
drop policy if exists "Authenticated read teamleader deals" on public.teamleader_deals;
create policy "Authenticated read teamleader deals"
  on public.teamleader_deals
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_quotations enable row level security;
revoke all on table public.teamleader_quotations from anon;
revoke all on table public.teamleader_quotations from authenticated;
grant select on table public.teamleader_quotations to authenticated;
drop policy if exists "Authenticated read teamleader quotations" on public.teamleader_quotations;
create policy "Authenticated read teamleader quotations"
  on public.teamleader_quotations
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_invoices enable row level security;
revoke all on table public.teamleader_invoices from anon;
revoke all on table public.teamleader_invoices from authenticated;
grant select on table public.teamleader_invoices to authenticated;
drop policy if exists "Authenticated read teamleader invoices" on public.teamleader_invoices;
create policy "Authenticated read teamleader invoices"
  on public.teamleader_invoices
  for select
  using (auth.role() = 'authenticated');

alter table public.teamleader_meetings enable row level security;
revoke all on table public.teamleader_meetings from anon;
revoke all on table public.teamleader_meetings from authenticated;
grant select on table public.teamleader_meetings to authenticated;
drop policy if exists "Authenticated read teamleader meetings" on public.teamleader_meetings;
create policy "Authenticated read teamleader meetings"
  on public.teamleader_meetings
  for select
  using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Billing tables: keep access server-side only (Edge Functions use service role)
-- ---------------------------------------------------------------------------

revoke all on table public.billing_customers from authenticated;
revoke all on table public.billing_webhook_events from authenticated;

-- ---------------------------------------------------------------------------
-- RPC/function execute privileges (block anon calls)
-- ---------------------------------------------------------------------------

revoke all on function public.get_custom_field_options(text) from public;
grant execute on function public.get_custom_field_options(text) to authenticated, service_role;

revoke all on function public.get_source_breakdown(text, timestamptz, timestamptz) from public;
grant execute on function public.get_source_breakdown(text, timestamptz, timestamptz) to authenticated, service_role;

revoke all on function public.get_source_records(text, timestamptz, timestamptz, text, text, integer) from public;
grant execute on function public.get_source_records(text, timestamptz, timestamptz, text, text, integer) to authenticated, service_role;

revoke all on function public.get_hook_records(text, timestamptz, timestamptz, text, text, integer) from public;
grant execute on function public.get_hook_records(text, timestamptz, timestamptz, text, text, integer) to authenticated, service_role;

revoke all on function public.get_hook_performance(text, timestamptz, timestamptz) from public;
grant execute on function public.get_hook_performance(text, timestamptz, timestamptz) to authenticated, service_role;

revoke all on function public.get_lost_reason_records(text, timestamptz, timestamptz, text, integer) from public;
grant execute on function public.get_lost_reason_records(text, timestamptz, timestamptz, text, integer) to authenticated, service_role;

revoke all on function public.get_lost_reasons(text, timestamptz, timestamptz) from public;
grant execute on function public.get_lost_reasons(text, timestamptz, timestamptz) to authenticated, service_role;

revoke all on function public.get_lost_reason_id_candidates(text, timestamptz, timestamptz) from public;
grant execute on function public.get_lost_reason_id_candidates(text, timestamptz, timestamptz) to authenticated, service_role;

revoke all on function public.get_lost_reason_key_candidates(text, timestamptz, timestamptz) from public;
grant execute on function public.get_lost_reason_key_candidates(text, timestamptz, timestamptz) to authenticated, service_role;

revoke all on function public.get_finance_summary(text, timestamptz, timestamptz) from public;
grant execute on function public.get_finance_summary(text, timestamptz, timestamptz) to authenticated, service_role;

