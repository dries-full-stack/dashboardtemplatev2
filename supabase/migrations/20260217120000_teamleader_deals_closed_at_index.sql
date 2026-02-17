-- Support filtering Teamleader deals on close date (won/lost) for Sales KPIs.
create index if not exists teamleader_deals_location_closed_idx
  on public.teamleader_deals (location_id, closed_at)
  where closed_at is not null;

