-- Track when a deal first reached the configured "offerte verzonden klant" phase.

alter table public.teamleader_deals
  add column if not exists quote_phase_marker_phase_id text,
  add column if not exists quote_phase_first_started_at timestamptz,
  add column if not exists quote_phase_last_checked_at timestamptz;
create index if not exists teamleader_deals_quote_phase_marker_idx
  on public.teamleader_deals (location_id, quote_phase_marker_phase_id);
create index if not exists teamleader_deals_quote_phase_checked_idx
  on public.teamleader_deals (location_id, quote_phase_last_checked_at);
