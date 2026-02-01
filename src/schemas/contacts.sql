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
