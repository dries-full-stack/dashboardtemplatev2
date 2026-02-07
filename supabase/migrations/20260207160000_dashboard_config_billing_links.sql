-- Configure Stripe billing links per dashboard/customer.

alter table public.dashboard_config
  add column if not exists billing_portal_url text,
  add column if not exists billing_checkout_url text,
  add column if not exists billing_checkout_embed boolean not null default false;

-- Customer mode (no login): allow anon to update billing settings too.
grant update (billing_portal_url, billing_checkout_url, billing_checkout_embed)
  on table public.dashboard_config
  to anon;
