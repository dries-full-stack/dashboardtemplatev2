-- Client dashboard_config for belivert
-- Run this in Supabase SQL editor (or via CLI).
insert into public.dashboard_config (
  id,
  location_id,
  hook_field_id,
  dashboard_title,
  dashboard_subtitle,
  dashboard_logo_url,
  dashboard_layout,
  source_normalization_rules
)
values (
  1,
  'PLaZB1vgUhy4CCo3vEDi',
  'R7CEVThNclchfzYqS5IT',
  'Belivert',
  'Lead & Marketing Dashboard',
  'https://belivert.be/wp-content/uploads/2025/12/Belivert-logo-Z-rgb.jpg',
  $$
{
    "dashboards":  [
                       {
                           "id":  "lead",
                           "label":  "Leadgeneratie",
                           "enabled":  true
                       },
                       {
                           "id":  "sales",
                           "label":  "Sales Resultaten",
                           "enabled":  true
                       },
                       {
                           "id":  "call-center",
                           "label":  "Call Center",
                           "enabled":  false
                       }
                   ],
    "sections":  [
                     {
                         "kind":  "funnel_metrics",
                         "title":  "Leads \u0026 afspraken",
                         "metric_labels":  [
                                               "Totaal Leads",
                                               "Totaal Afspraken",
                                               "Confirmed",
                                               "Cancelled",
                                               "No-Show",
                                               "Lead -\u003e Afspraak"
                                           ]
                     },
                     {
                         "kind":  "source_breakdown",
                         "title":  "Kanalen"
                     },
                     {
                         "kind":  "finance_metrics",
                         "title":  "Kosten",
                         "metric_labels":  [
                                               "Totale Leadkosten",
                                               "Kost per Lead"
                                           ]
                     },
                     {
                         "kind":  "hook_performance",
                         "title":  "Ad Hook Performance"
                     },
                     {
                         "kind":  "lost_reasons",
                         "title":  "Verliesredenen"
                     }
                 ],
    "theme":  "belivert"
}
$$
  ,
  $$
[
  { "bucket": "Solvari", "patterns": ["solvari"] },
  { "bucket": "Bobex", "patterns": ["bobex"] },
  { "bucket": "Trustlocal", "patterns": ["trustlocal", "trust local"] },
  { "bucket": "Bambelo", "patterns": ["bambelo"] },
  { "bucket": "Facebook Ads", "patterns": ["facebook", "instagram", "meta", "fbclid", "meta - calculator", "meta ads - calculator"] },
  { "bucket": "Google Ads", "patterns": ["google", "adwords", "gclid", "cpc", "google - woning prijsberekening"] },
  { "bucket": "Organic", "patterns": ["organic", "seo", "direct", "referral", "(none)", "website"] }
]
$$::jsonb
)
on conflict (id) do update set
  location_id = excluded.location_id,
  hook_field_id = excluded.hook_field_id,
  dashboard_title = excluded.dashboard_title,
  dashboard_subtitle = excluded.dashboard_subtitle,
  dashboard_logo_url = excluded.dashboard_logo_url,
  dashboard_layout = excluded.dashboard_layout,
  source_normalization_rules = excluded.source_normalization_rules,
  updated_at = now();
