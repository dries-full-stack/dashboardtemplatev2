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
