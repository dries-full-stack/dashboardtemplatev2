-- Store Teamleader deal phase order so dashboards can count "from phase X onward"
-- without relying on probability (which may be 0 for post-offer phases).

alter table public.teamleader_deal_phases
  add column if not exists sort_order integer;

create index if not exists teamleader_deal_phases_location_sort_idx
  on public.teamleader_deal_phases (location_id, sort_order);

