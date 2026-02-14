-- Client dashboard_config for Recotex
-- Run this in Supabase SQL editor (or via CLI).
insert into public.dashboard_config (
  id,
  location_id,
  dashboard_title,
  dashboard_subtitle,
  dashboard_logo_url,
  dashboard_layout
)
values (
  1,
  'wGiSm8CySOqdWbgLUleR',
  'Recotex',
  'Lead & Marketing Dashboard',
  'https://www.architectenkrant.be/templates/yootheme/cache/c4/recotex-c4ef39fb.jpeg',
  $$
{
  "dashboards": [
    {
      "id": "lead",
      "label": "Leadgeneratie",
      "enabled": true
    },
    {
      "id": "sales",
      "label": "Sales Resultaten",
      "enabled": true
    },
    {
      "id": "call-center",
      "label": "Call Center",
      "enabled": false
    }
  ],
  "sections": [
    {
      "kind": "funnel_metrics",
      "title": "Leads & afspraken",
      "metric_labels": [
        "Totaal Leads",
        "Totaal Afspraken",
        "Confirmed",
        "Cancelled",
        "No-Show",
        "Lead -> Afspraak"
      ]
    },
    {
      "kind": "source_breakdown",
      "title": "Kanalen"
    },
    {
      "kind": "finance_metrics",
      "title": "Kosten",
      "metric_labels": [
        "Totale Leadkosten",
        "Kost per Lead"
      ]
    },
    {
      "kind": "hook_performance",
      "title": "Ad Hook Performance"
    },
    {
      "kind": "lost_reasons",
      "title": "Verliesredenen"
    }
  ],
  "behavior": {
    "appointments_provider": "ghl",
    "source_breakdown": {
      "variant": "default",
      "cost_denominator": "confirmed"
    },
    "hook_performance": {
      "source_bucket_filter": null
    }
  }
}
$$::jsonb
)
on conflict (id) do update set
  location_id = excluded.location_id,
  dashboard_title = excluded.dashboard_title,
  dashboard_subtitle = excluded.dashboard_subtitle,
  dashboard_logo_url = excluded.dashboard_logo_url,
  dashboard_layout = excluded.dashboard_layout,
  updated_at = now();
