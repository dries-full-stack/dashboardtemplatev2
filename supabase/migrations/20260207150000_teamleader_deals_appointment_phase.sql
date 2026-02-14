-- Track whether a deal has ever been in the "appointment scheduled" phase (used for the Sales dashboard "Afspraken").

alter table public.teamleader_deals
  add column if not exists had_appointment_phase boolean,
  add column if not exists appointment_phase_first_started_at timestamptz,
  add column if not exists appointment_phase_last_checked_at timestamptz;
create index if not exists teamleader_deals_had_appointment_idx
  on public.teamleader_deals (location_id, had_appointment_phase);
create index if not exists teamleader_deals_appointment_checked_idx
  on public.teamleader_deals (location_id, appointment_phase_last_checked_at);
