-- Allow customers (anon) to update ad hook configuration in dashboard_config.
-- Security: column-level grants only.

grant update (hook_field_id, campaign_field_id)
  on table public.dashboard_config
  to anon;

