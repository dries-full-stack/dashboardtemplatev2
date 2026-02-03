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
