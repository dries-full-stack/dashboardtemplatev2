create table if not exists public.teamleader_users (
  id text not null,
  location_id text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text,
  function text,
  language text,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_users_email_idx on public.teamleader_users (email);
create index if not exists teamleader_users_status_idx on public.teamleader_users (status);
create index if not exists teamleader_users_raw_data_idx on public.teamleader_users using gin (raw_data);
create table if not exists public.teamleader_contacts (
  id text not null,
  location_id text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  status text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_contacts_email_idx on public.teamleader_contacts (email);
create index if not exists teamleader_contacts_phone_idx on public.teamleader_contacts (phone);
create index if not exists teamleader_contacts_status_idx on public.teamleader_contacts (status);
create index if not exists teamleader_contacts_updated_at_idx on public.teamleader_contacts (updated_at);
create index if not exists teamleader_contacts_tags_idx on public.teamleader_contacts using gin (tags);
create index if not exists teamleader_contacts_raw_data_idx on public.teamleader_contacts using gin (raw_data);
create table if not exists public.teamleader_companies (
  id text not null,
  location_id text not null,
  name text,
  status text,
  email text,
  phone text,
  vat_number text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_companies_name_idx on public.teamleader_companies (name);
create index if not exists teamleader_companies_status_idx on public.teamleader_companies (status);
create index if not exists teamleader_companies_vat_idx on public.teamleader_companies (vat_number);
create index if not exists teamleader_companies_updated_at_idx on public.teamleader_companies (updated_at);
create index if not exists teamleader_companies_tags_idx on public.teamleader_companies using gin (tags);
create index if not exists teamleader_companies_raw_data_idx on public.teamleader_companies using gin (raw_data);
create table if not exists public.teamleader_deal_pipelines (
  id text not null,
  location_id text not null,
  name text,
  is_default boolean default false,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_deal_pipelines_name_idx on public.teamleader_deal_pipelines (name);
create index if not exists teamleader_deal_pipelines_raw_data_idx on public.teamleader_deal_pipelines using gin (raw_data);
create table if not exists public.teamleader_deal_phases (
  id text not null,
  location_id text not null,
  name text,
  probability numeric,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_deal_phases_name_idx on public.teamleader_deal_phases (name);
create index if not exists teamleader_deal_phases_raw_data_idx on public.teamleader_deal_phases using gin (raw_data);
create table if not exists public.teamleader_deals (
  id text not null,
  location_id text not null,
  title text,
  status text,
  customer_type text,
  customer_id text,
  contact_person_id text,
  responsible_user_id text,
  pipeline_id text,
  phase_id text,
  estimated_value numeric,
  estimated_value_currency text,
  weighted_value numeric,
  weighted_value_currency text,
  estimated_closing_date date,
  created_at timestamptz,
  updated_at timestamptz,
  closed_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_deals_status_idx on public.teamleader_deals (status);
create index if not exists teamleader_deals_customer_idx on public.teamleader_deals (customer_id, customer_type);
create index if not exists teamleader_deals_pipeline_idx on public.teamleader_deals (pipeline_id, phase_id);
create index if not exists teamleader_deals_responsible_idx on public.teamleader_deals (responsible_user_id);
create index if not exists teamleader_deals_location_created_idx on public.teamleader_deals (location_id, created_at);
create index if not exists teamleader_deals_updated_at_idx on public.teamleader_deals (updated_at);
create index if not exists teamleader_deals_raw_data_idx on public.teamleader_deals using gin (raw_data);
create table if not exists public.teamleader_quotations (
  id text not null,
  location_id text not null,
  deal_id text,
  status text,
  name text,
  total_tax_exclusive numeric,
  total_tax_inclusive numeric,
  currency text,
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_quotations_deal_idx on public.teamleader_quotations (deal_id);
create index if not exists teamleader_quotations_status_idx on public.teamleader_quotations (status);
create index if not exists teamleader_quotations_updated_at_idx on public.teamleader_quotations (updated_at);
create index if not exists teamleader_quotations_raw_data_idx on public.teamleader_quotations using gin (raw_data);
create table if not exists public.teamleader_invoices (
  id text not null,
  location_id text not null,
  deal_id text,
  status text,
  invoice_number text,
  invoice_date date,
  due_on date,
  total_tax_exclusive numeric,
  total_tax_inclusive numeric,
  currency text,
  created_at timestamptz,
  updated_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_invoices_number_idx on public.teamleader_invoices (invoice_number);
create index if not exists teamleader_invoices_status_idx on public.teamleader_invoices (status);
create index if not exists teamleader_invoices_date_idx on public.teamleader_invoices (invoice_date);
create index if not exists teamleader_invoices_updated_at_idx on public.teamleader_invoices (updated_at);
create index if not exists teamleader_invoices_raw_data_idx on public.teamleader_invoices using gin (raw_data);
create table if not exists public.teamleader_meetings (
  id text not null,
  location_id text not null,
  title text,
  description text,
  customer_type text,
  customer_id text,
  scheduled_at timestamptz,
  duration_minutes numeric,
  end_time timestamptz,
  created_at timestamptz,
  raw_data jsonb,
  synced_at timestamptz default now(),
  primary key (id, location_id)
);
create index if not exists teamleader_meetings_scheduled_idx on public.teamleader_meetings (scheduled_at);
create index if not exists teamleader_meetings_customer_idx on public.teamleader_meetings (customer_id, customer_type);
create index if not exists teamleader_meetings_raw_data_idx on public.teamleader_meetings using gin (raw_data);
