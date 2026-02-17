# Belivert Sales Dashboard Meeting Notes (2026-02-17)

Bron: klantvragen doorgestuurd door Dries (Nick D) over het Belivert dashboard.

## Scope

De klant wil vooral een **maandelijks overzicht** (totaal + per verkoper) met sales KPI's, plus enkele proces-KPI's (cyclustijden) en een plek voor evaluatie-notities.

## Reeds (gedeeltelijk) beschikbaar in de repo

Sales dashboard gebruikt Teamleader Focus deals (`public.teamleader_deals`) en berekent KPI's in de frontend.

Sinds deze meeting-iteratie (code in `dashboard/src/main.js` + `dashboard/src/sales-layout.html`):
- Cyclustijden gebruiken waar mogelijk Teamleader phase markers:
  - `teamleader_deals.appointment_phase_first_started_at`
  - `teamleader_deals.quote_phase_first_started_at`
- Nieuwe KPI's:
  - `Gem. Deal Waarde` (gewonnen deals)
  - `Gem. Offerte -> Close`
- Per verkoper KPI targets:
  - omzet KPI (EUR 75K/maand, bestaand)
  - afspraken KPI (52/maand, nieuw; momenteel proxy op basis van trajecten in de huidige maand)
- Filteren op `closed_at` is performant via index migratie:
  - `supabase/migrations/20260217120000_teamleader_deals_closed_at_index.sql`

## Klantvragen (Nick D)

### Maandelijks (totaal)
- Lead generatoren aangekocht vs retour
- Hoeveelheid leads per bron en campagnes + algemeen aantal
- Totaal behaalde omzet sales (verkoop nieuwe installaties) + algemeen totaal (incl. service werken)
- Dynamische KPI sales totaal -> omzet 1M
- Maandelijkse omzet van 3 jaar terug in dezelfde maand
- Overzicht sales per productcategorie
- Overzicht sales per regio
- Overzicht omzet per verkoper
- Cyclustijd opgemaakte offerte tot closen (algemeen)
- Gemiddelde deal waarde

### Per verkoper
- Toegewezen lead vs retour
- Aantal opgemaakte offertes (per klant niveau, dus geen 4 offertes voor 1 klant = 4)
- Dynamische KPI: sales -> omzet 75K/maand
- Dynamische KPI: ingeplande afspraken -> 52/maand
- Slaagratio: opgemaakte offertes vs verkocht
- Lost reden: afstemmen hoe sales dit gaat doorgeven (Streakly?)
- Notities per maand (voor evaluatie)
- Cyclustijd opgemaakte offerte tot closen
- Tijdsduur tussen ingeplande afspraak en verzonden offerte

## Open vragen (definities/data)

Deze items blokkeren implementatiekeuzes:
- **Omzet definitie**
  - Gaat het om forecast (`teamleader_deals.estimated_value`) of effectieve omzet (Teamleader invoices: `public.teamleader_invoices`)?
  - Welke datum telt: `invoice_date` (factuur) vs `closed_at` (deal)?
- **"Nieuwe installaties" vs "service werken"**
  - Is dit te herkennen via deal title keywords (bv. `service`), pipeline/fase, tags, of enkel via factuurlijnen?
- **Lead generator "aangekocht vs retour"**
  - Waar leeft dit vandaag: Streakly, GHL, Teamleader, Excel/Google Sheet, of lead-provider portalen?
  - Is "retour" een status op lead niveau (per lead), of een financiële credit/nota (per maand)?
- **Leads per bron + campagnes**
  - Is er UTM/campaign metadata beschikbaar in GHL opportunities/contacts?
  - Zijn campagnes per kanaal (Meta/Google) al aanwezig in `marketing_spend_*` en moeten leads hieraan gematcht worden?
- **Regio**
  - Welke bron is leidend: klantadres (Teamleader contact/company), werfadres, of regio veld in CRM?
  - Regio indeling: provincies, regio's, of custom map (bv. zones)?
- **Productcategorie**
  - Bestaat er een categorieveld vandaag (tag/custom field), of moeten we mappen via titel/omschrijving of factuurlijnen?
- **Lost reason**
  - Willen we Teamleader lost reasons blijven gebruiken, of komt de waarheid uit Streakly?
- **Notities**
  - Privé per gebruiker (bv. enkel Dries) of gedeeld team-notities?
  - Granulariteit: per maand totaal, per verkoper-per-maand, of beide?

## Implementatie-opties (pragmatisch)

### 1) Maandelijkse rollups (snel, op basis van deals)
Doel: snel een eerste maandoverzicht dat al bruikbaar is.
- Bron: `public.teamleader_deals` (+ phase markers waar beschikbaar)
- Omzet: `estimated_value` van gewonnen deals
- Service vs sales: splits via `dashboard_config.sales_excluded_deal_keywords` (bv. "service" = service bucket)
- Output: frontend aggregatie (group-by maand) of SQL view/RPC voor performance

Voordeel: snel, geen extra sync nodig.
Nadeel: omzet is forecast (niet "behaald") en service/sales split is heuristisch.

### 2) Maandelijkse rollups (correct, op basis van invoices)
Doel: "behaalde omzet" correct rapporteren.
- Bron: `public.teamleader_invoices` (`invoice_date`, `total`, `status`)
- Service vs sales: idealiter via factuurlijnen (in `raw_data`) of tags/categorie mapping
- Mogelijk extra extractie: aparte tabel voor invoice lines als we veel breakdowns nodig hebben.

Voordeel: financieel correct (past bij "behaalde omzet").
Nadeel: mapping naar verkoper/categorie/regio is vaak lastiger.

### 3) Productcategorie/regio breakdowns (config-driven)
Aanpak:
- Voeg mapping rules toe in `dashboard_config` (JSON) zoals:
  - `sales_product_category_rules`: lijst van `{ category, patterns }`
  - `sales_region_rules`: lijst van `{ region, patterns }` of postcode ranges
- Parse uit `teamleader_deals.raw_data` / `teamleader_invoices.raw_data` en label bij render.

Voordeel: geen hardcoded klantlogica, makkelijk bijsturen zonder code.
Nadeel: vereist definities + eerste setup.

### 4) Lead assignment/return + purchased/returned lead generators
Dit is waarschijnlijk **niet af te leiden** uit Teamleader alleen.
Aanpak opties:
- Integratie met Streakly (als daar status/retour leeft).
- Of: nieuwe Supabase tables + eenvoudige UI om per lead "assigned/returned" te registreren (audit trail).
- Of: maandelijkse import (CSV/Sheet) als eerste stap.

## Suggested implementation phases

1. **Phase 0 (Done in UI)**: cyclustijden + avg deal value + offerte->close + afspraken KPI per verkoper.
2. **Phase 1**: maandelijkse rollup view (deals-based) + YoY vergelijking (zelfde maand vorige jaren) met duidelijke labeling "forecast".
3. **Phase 2**: omzet overstappen naar invoices (optioneel via config toggle), plus split sales/service.
4. **Phase 3**: productcategorie + regio breakdowns (config-driven rules).
5. **Phase 4**: lead generator purchased/returned + assigned/returned flows (Streakly of eigen tables/UI).
6. **Phase 5**: notities per maand + lost-reason overrides (RLS + UI).

## Next steps (om te kunnen bouwen)

Beantwoord best eerst:
1. Omzetbron: deals (forecast) of invoices (behaald)?
2. KPI 1M: periode (jaar, rolling 12, of totaal) en geldt dit incl. service of enkel sales?
3. Definitie van "retour": status op lead of financiële credit?
4. Regio + productcategorie: waar halen we die labels vandaan vandaag?

