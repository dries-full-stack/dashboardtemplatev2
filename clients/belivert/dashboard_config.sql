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
  source_normalization_rules,
  sales_excluded_deal_keywords,
  sales_product_category_rules,
  sales_region_rules
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
    "behavior":  {
                     "appointments_provider":  "teamleader_meetings",
                     "source_breakdown":  {
                                             "variant":  "deals",
                                             "cost_denominator":  "deals"
                                         },
                     "hook_performance":  {
                                              "source_bucket_filter":  "Facebook Ads"
                                          }
                 },
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
  ,
  $$["service","onderhoud","herstelling","depannage","interventie"]$$::jsonb
  ,
  $$
[
  { "category": "Warmtepomp", "title_any": ["warmtepomp", "wp", "heat pump"] },
  { "category": "Airco", "title_any": ["airco", "airconditioning", "a/c"] },
  { "category": "Ventilatie", "title_any": ["ventilatie", "ventilatie-unit", "type d", "type c"] },
  { "category": "Zonnepanelen", "title_any": ["zonnepanelen", "pv", "panelen", "photovolta"] },
  { "category": "Batterij", "title_any": ["batterij", "thuisbatterij", "storage"] },
  { "category": "Laadpaal", "title_any": ["laadpaal", "ev charger", "charger"] },
  { "category": "Service", "title_any": ["service", "onderhoud", "herstelling", "depannage", "interventie"] }
]
$$::jsonb
  ,
  $$
[
  { "region": "Brussel", "postal_ranges": [[1000, 1299]] },
  { "region": "Waals-Brabant", "postal_ranges": [[1300, 1499]] },
  { "region": "Vlaams-Brabant", "postal_ranges": [[1500, 1999], [3000, 3499]] },
  { "region": "Antwerpen", "postal_ranges": [[2000, 2999]] },
  { "region": "Limburg", "postal_ranges": [[3500, 3999]] },
  { "region": "Luik", "postal_ranges": [[4000, 4999]] },
  { "region": "Namen", "postal_ranges": [[5000, 5999]] },
  { "region": "Henegouwen", "postal_ranges": [[6000, 6599], [7000, 7999]] },
  { "region": "Luxemburg", "postal_ranges": [[6600, 6999]] },
  { "region": "West-Vlaanderen", "postal_ranges": [[8000, 8999]] },
  { "region": "Oost-Vlaanderen", "postal_ranges": [[9000, 9999]] }
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
  sales_excluded_deal_keywords = excluded.sales_excluded_deal_keywords,
  sales_product_category_rules = excluded.sales_product_category_rules,
  sales_region_rules = excluded.sales_region_rules,
  updated_at = now();
