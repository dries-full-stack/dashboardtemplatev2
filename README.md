# GoHighLevel → Supabase Dashboard Template

Doel: herbruikbare template om GoHighLevel (GHL) data automatisch te synchroniseren naar Supabase (PostgreSQL), zodat je direct dashboards/analyses kunt bouwen.

## Vereisten

- Node.js 18+
- Supabase project (publishable + secret key nodig)
- GoHighLevel Private Integration Token + Location ID (in `.env` of opgeslagen in Supabase)

## Installatie

1. Maak de tabellen aan in Supabase met de SQL-bestanden:
   - `src/schemas/all.sql` (alles-in-1)
- of los: `src/schemas/contacts.sql`, `src/schemas/opportunities.sql`, `src/schemas/appointments.sql`, `src/schemas/sync_state.sql`, `src/schemas/ghl_integrations.sql`, `src/schemas/dashboard_config.sql`, `src/schemas/lost_reason_lookup.sql`, `src/schemas/marketing_spend.sql`, `src/schemas/views.sql`, `src/schemas/functions.sql`

2. Kopieer `.env.example` naar `.env` en vul in:

```
GHL_LOCATION_ID=
GHL_PRIVATE_INTEGRATION_TOKEN=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

3. Installeer dependencies:

```
npm install
```

4. Start de sync (draait standaard elke 15 minuten):

```
npm run sync
```

## Supabase CLI (aanbevolen)

Voor nieuwe klanten kun je de schema's via CLI pushen. We hebben een base migration toegevoegd:

- `supabase/migrations/20260204160000_base.sql`

Gebruik:

```
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Let op: voor bestaande live klanten draai je bij voorkeur alleen nieuwe migrations (niet opnieuw de base),
of voer je gerichte SQL uit via de editor.

## Teamleader Focus (optioneel)

1. Zet secrets in Supabase:
   - `TEAMLEADER_CLIENT_ID`
   - `TEAMLEADER_CLIENT_SECRET`
   - `TEAMLEADER_REDIRECT_URL` (standaard: `https://<project-ref>.supabase.co/functions/v1/teamleader-oauth/callback`)
   - `TEAMLEADER_SCOPES` (optioneel)
2. Deploy edge functions:
   - `supabase functions deploy teamleader-oauth --project-ref YOUR_PROJECT_REF`
   - `supabase functions deploy teamleader-sync --project-ref YOUR_PROJECT_REF`
3. Koppel Teamleader via:
   - `https://YOUR_PROJECT_REF.supabase.co/functions/v1/teamleader-oauth/start?location_id=YOUR_LOCATION_ID`
4. Plan de sync (15 min) via `supabase/schedule.sql`.
5. Plan daarnaast een dagelijkse reconcile-run voor deals (aanbevolen tegen stale/deleted deals):
   - `POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/teamleader-sync`
   - body: `{"entities":["deals"],"lookback_months":2,"reconcile_deals_window":true,"deal_info_max":0}`

Optionele sync settings (Supabase secrets):
`TEAMLEADER_LOOKBACK_MONTHS`, `TEAMLEADER_PAGE_SIZE`, `TEAMLEADER_UPSERT_BATCH_SIZE`, `SYNC_OVERLAP_MINUTES`.

## Per klant setup (1 database per klant)

Gebruik de bootstrap script om klant-specifieke config + env templates aan te maken:

```
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-client.ps1
```

De script maakt o.a.:
- `clients/<slug>/dashboard_config.sql`
- `clients/<slug>/dashboard_layout.json`
- `clients/<slug>/env.dashboard.example` (incl. branding + webpreview meta vars, plus `VITE_DASHBOARD_TIMEZONE`)
- `clients/<slug>/env.sync.example`

## Local onboarding app (voor maximale automatisering)

Start de lokale onboarding UI:

```
npm run onboard
```

Open daarna `http://localhost:8787`. Vul de klantgegevens in en start de run.
De app roept intern `scripts/bootstrap-client.ps1` aan en kan optioneel:

- Supabase CLI login (met access token)
- project linken + schema pushen
- dashboard_config upserten via REST (service role key)
- edge functions deployen

Tip: met een Supabase access token kan de onboarding automatisch de publishable + service role key ophalen.

**Logo’s (makkelijkst):** gebruik een publieke URL (bijv. Supabase Storage of een CDN) en zet die in `dashboard_logo_url`.
De onboarding vult daarmee ook de preview vars (`VITE_PREVIEW_*`) zodat `title`, Open Graph en Twitter preview per klant mee veranderen.

### Netlify env sync (optioneel)

Je kunt env vars naar een Netlify site pushen via CLI:

```
powershell -ExecutionPolicy Bypass -File scripts/netlify-env-sync.ps1
```

Of via de onboarding UI (Netlify section).

### Volledig geautomatiseerd (optioneel)

Als je een Supabase access token + DB password + service role key hebt, kan de script alles doen:

```
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-client.ps1 `
  -Slug immobeguin `
  -SupabaseUrl https://YOUR_REF.supabase.co `
  -LocationId YOUR_LOCATION_ID `
  -AccessToken YOUR_SUPABASE_ACCESS_TOKEN `
  -DbPassword YOUR_DB_PASSWORD `
  -ServiceRoleKey YOUR_SUPABASE_SERVICE_ROLE_KEY `
  -PublishableKey YOUR_SUPABASE_PUBLISHABLE_KEY `
  -GhlPrivateIntegrationToken YOUR_GHL_PRIVATE_TOKEN `
  -ApplyConfig `
  -LinkProject `
  -PushSchema `
  -DeployFunctions
```

`-ApplyConfig` doet een REST upsert naar `dashboard_config` via de service role key (RLS-bypass).

### Extra automatisering

De bootstrap script kan ook:
- Git branch aanmaken + pushen
- Netlify site aanmaken
- Production branch instellen
- Custom domain toevoegen
- Netlify DNS CNAME records aanmaken (alleen subdomeinen)

Gebruik de onboarding UI of voeg flags toe aan `scripts/bootstrap-client.ps1`.

## Teamleader OAuth (sales dashboard)

Voor de Teamleader Focus integratie gebruiken we een Supabase Edge Function:

- `teamleader-oauth` (routes: `/start` en `/callback`)

Zet deze secrets in Supabase (via onboarding of CLI):

- `TEAMLEADER_CLIENT_ID`
- `TEAMLEADER_CLIENT_SECRET`
- `TEAMLEADER_REDIRECT_URL` (bijv. `https://PROJECT_REF.functions.supabase.co/teamleader-oauth/callback`)
- `TEAMLEADER_SCOPES` (optioneel, space-separated)

Deploy daarna de functie:

```
supabase functions deploy teamleader-oauth --project-ref YOUR_PROJECT_REF
```

Optioneel per entity:

```
npm run sync:contacts
npm run sync:opportunities
npm run sync:appointments
```

## Live sync via Supabase Edge Function (aanbevolen)

Als je de sync in Supabase zelf wilt laten draaien (cron elke 15 min):

1) **Deploy de Edge Function**

```
supabase functions deploy ghl-sync --no-verify-jwt
```

Of gebruik `supabase/config.toml` (hier al toegevoegd) met `verify_jwt = false`.

2) **Secrets zetten in Supabase**

```
supabase secrets set SYNC_SECRET=YOUR_SYNC_SECRET
```

Let op: Supabase Edge Functions vullen standaard `SUPABASE_URL`, `SUPABASE_ANON_KEY` en **`SUPABASE_SERVICE_ROLE_KEY`**.  
De CLI blokkeert env-namen die met `SUPABASE_` beginnen, dus je hoeft (en kunt) `SUPABASE_SECRET_KEY` hier niet zetten.  
De Edge Function gebruikt automatisch `SUPABASE_SERVICE_ROLE_KEY` als admin key.

Optioneel (als je wilt overriden):

```
supabase secrets set GHL_BASE_URL=https://services.leadconnectorhq.com
supabase secrets set GHL_API_VERSION=2021-07-28
supabase secrets set GHL_CALENDARS_VERSION=2021-04-15
supabase secrets set FULL_SYNC_INTERVAL_HOURS=24
```

3) **Cron job instellen**

- Zet de extensions **pg_cron** en **pg_net** aan in Supabase.
- Run `supabase/schedule.sql` en vervang `PROJECT_REF` en `SYNC_SECRET`.

Daarna draait de sync automatisch elke 15 minuten in Supabase.
De sync haalt ook (indien mogelijk) de **lost reason** namen op en slaat die op in `public.lost_reason_lookup`.

## Meta leadkosten via Supabase Edge Function (optioneel)

Gebruik deze als je dagelijks Meta spend/leads wilt opslaan voor **Totale Leadkosten** en **Kost per Lead**.

1) **Deploy de Edge Function**

```
supabase functions deploy meta-sync --no-verify-jwt
```

2) **Secrets zetten in Supabase**

```
supabase secrets set META_ACCESS_TOKEN=YOUR_LONG_LIVED_TOKEN
supabase secrets set META_AD_ACCOUNT_ID=act_1234567890
supabase secrets set META_LOCATION_ID=YOUR_GHL_LOCATION_ID
```

Optioneel:

```
supabase secrets set META_TIMEZONE=Europe/Brussels
supabase secrets set META_LOOKBACK_DAYS=7
supabase secrets set META_END_OFFSET_DAYS=1
supabase secrets set META_LEAD_ACTION_TYPES=lead,omni_lead,offsite_conversion.fb_pixel_lead,onsite_conversion.lead
supabase secrets set META_API_VERSION=v21.0
supabase secrets set META_SOURCE_NAME=META
supabase secrets set META_SYNC_SECRET=YOUR_SYNC_SECRET
```

3) **Cron job instellen**

- Zet de extensions **pg_cron** en **pg_net** aan in Supabase.
- Run de Meta-block uit `supabase/schedule.sql` (let op: cron draait in UTC; pas het tijdstip aan voor CET/CEST).

Als `META_LOCATION_ID` leeg is, gebruikt de functie `dashboard_config.id=1`.

De functie schrijft naar `public.marketing_spend_daily`. Het dashboard leest via `get_finance_summary`.

## Google Ads kosten via Supabase Edge Function (optioneel)

Gebruik deze als je dagelijks Google Ads spend/leads wilt opslaan voor **Totale Leadkosten** en **Kost per Lead**.

1) **Deploy de Edge Function**

```
supabase functions deploy google-sync --no-verify-jwt
```

2) **Secrets zetten in Supabase**

```
supabase secrets set GOOGLE_ADS_DEVELOPER_TOKEN=YOUR_DEVELOPER_TOKEN
supabase secrets set GOOGLE_ADS_CLIENT_ID=YOUR_OAUTH_CLIENT_ID
supabase secrets set GOOGLE_ADS_CLIENT_SECRET=YOUR_OAUTH_CLIENT_SECRET
supabase secrets set GOOGLE_ADS_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
supabase secrets set GOOGLE_ADS_CUSTOMER_ID=1234567890
supabase secrets set GOOGLE_LOCATION_ID=YOUR_GHL_LOCATION_ID
```

Optioneel:

```
supabase secrets set GOOGLE_ADS_LOGIN_CUSTOMER_ID=YOUR_MCC_ID
supabase secrets set GOOGLE_ADS_API_VERSION=v17
supabase secrets set GOOGLE_TIMEZONE=Europe/Brussels
supabase secrets set GOOGLE_LOOKBACK_DAYS=7
supabase secrets set GOOGLE_END_OFFSET_DAYS=1
supabase secrets set GOOGLE_SOURCE_NAME="Google Ads"
```

3) **Cron job instellen**

- Zet de extensions **pg_cron** en **pg_net** aan in Supabase.
- Run de Google-block uit `supabase/schedule.sql` (let op: cron draait in UTC; pas het tijdstip aan voor CET/CEST).

Als `GOOGLE_LOCATION_ID` leeg is, gebruikt de functie `dashboard_config.id=1`.

De functie schrijft naar `public.marketing_spend_daily`. Het dashboard leest via `get_finance_summary`.

## Google Ads via Google Sheets (tijdelijk alternatief)

Als je Google Ads developer token nog in **Test** staat, kun je toch automatiseren via een geplande Google Ads‑rapportage naar Google Sheets.

1) **Maak Google Ads rapport**
- Ga naar **Reports → Custom**.
- Voeg kolommen toe (zoals in Google Ads export): **Day, Cost, Conversions, Currency code** (Account ID is optioneel).
- Schedule dagelijks naar **Google Sheets**.

2) **Maak de sheet publiek (read‑only)**
- Open de sheet → **Share** → “Anyone with the link can view”.
- Gebruik de CSV‑export link:
  ```
  https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID
  ```
  *GID vind je in de URL van de sheet (tabblad).*

3) **Deploy de Edge Function**
```
supabase functions deploy google-sheet-sync --no-verify-jwt
```

4) **Secrets zetten in Supabase**
```
supabase secrets set SHEET_CSV_URL="https://docs.google.com/spreadsheets/d/SHEET_ID/export?format=csv&gid=GID"
supabase secrets set SHEET_LOCATION_ID=YOUR_GHL_LOCATION_ID
```

Optioneel (kolomnamen aanpassen / headerrij instellen):
```
supabase secrets set SHEET_DATE_COLUMN=Day
supabase secrets set SHEET_COST_COLUMN=Cost
supabase secrets set SHEET_CONVERSIONS_COLUMN=Conversions
supabase secrets set SHEET_CURRENCY_COLUMN="Currency code"
supabase secrets set SHEET_ACCOUNT_COLUMN="Account ID"
supabase secrets set SHEET_DATE_FORMAT=YYYY-MM-DD
supabase secrets set SHEET_SOURCE_NAME="Google Ads"
supabase secrets set SHEET_HEADER_ROW=3
```

5) **Cron job instellen**
- Zet **pg_cron** en **pg_net** aan.
- Run de Google‑sheet block uit `supabase/schedule.sql`.

De functie schrijft naar `public.marketing_spend_daily`. Het dashboard leest via `get_finance_summary`.

## GHL config in Supabase (optioneel)

Als je niet elke keer lokaal de GHL credentials wilt zetten, kun je ze per klant opslaan in Supabase.
De tabel `ghl_integrations` heeft **RLS aan** zodat de PIT niet via de anon key uitlekt.  
Gebruik de SQL editor (of service role) om de rij te inserten. De sync gebruikt service role en kan dit gewoon lezen.
De tabel `dashboard_config` bevat enkel de **publieke** `location_id` (leesbaar via anon) zodat het dashboard automatisch kan filteren.
Optioneel kun je hier ook custom field IDs bewaren:
- `hook_field_id` + `campaign_field_id` (hook/campagne performance)
- `lost_reason_field_id` (verloren lead redenen)
Als je geen `lost_reason_field_id` hebt, probeert het dashboard een aantal standaard keys uit `raw_data`.
Gebruik `get_lost_reason_key_candidates` om te ontdekken welke key jouw GHL payload gebruikt.
Als GHL enkel `lostReasonId` teruggeeft, voeg dan een lookup toe zodat het dashboard de **naam** toont:

```sql
-- 1) Bekijk welke IDs voorkomen
select *
from public.get_lost_reason_id_candidates('YOUR_LOCATION_ID', now() - interval '90 days', now());

-- 2) Koppel ID aan naam
insert into public.lost_reason_lookup (location_id, reason_id, reason_name)
values
  ('YOUR_LOCATION_ID', 'ID_1', 'Wilt zelf verkopen'),
  ('YOUR_LOCATION_ID', 'ID_2', 'Timing niet goed')
on conflict (location_id, reason_id)
do update set reason_name = excluded.reason_name, updated_at = now();
```

### Raw data + views (Optie A)

Alle velden die de GHL list/search endpoints teruggeven worden al opgeslagen in `raw_data` (JSONB).
Voor convenience hebben we views toegevoegd met een `source_guess` kolom:

- `public.contacts_view`
- `public.opportunities_view`
- `public.appointments_view`

Als jouw payload een andere key gebruikt voor source, pas de `coalesce(...)` in `src/schemas/views.sql` aan.
De source breakdown gebruikt `get_source_breakdown` uit `src/schemas/functions.sql`.

### GHL integratie via onboarding (aanbevolen)

De admin setup UI is verwijderd. Gebruik de onboarding om de GHL Private Integration Token op te slaan
in `ghl_integrations` (server-side via service role key).

Voorbeeld:

```
insert into public.ghl_integrations (location_id, private_integration_token, active)
values ('YOUR_LOCATION_ID', 'YOUR_PRIVATE_INTEGRATION_TOKEN', true);
```

Optioneel (handmatig voor het dashboard):

```
insert into public.dashboard_config (id, location_id)
values (1, 'YOUR_LOCATION_ID')
on conflict (id) do update set location_id = excluded.location_id, updated_at = now();
```

### Dashboard layout config (per klant)

Naast `location_id` kun je in `dashboard_config` ook de dashboard content/metrics configureren:

- `dashboard_title` (text)
- `dashboard_subtitle` (text)
- `dashboard_logo_url` (text, relatief of absolute URL)
- `dashboard_layout` (jsonb)
- `dashboard_layout.theme` (optioneel, bv. `belivert`)
- `sales_monthly_deals_target` (integer, default target voor Sales)
- `sales_monthly_deals_targets` (jsonb, maandelijkse overrides)
- `sales_quotes_from_phase_id` (text, Teamleader fase voor offerte-telling)
- `billing_portal_url` (text, Stripe Billing Portal link)
- `billing_checkout_url` (text, Stripe Payment Link / checkout URL)
- `billing_checkout_embed` (boolean, toon checkout URL als embed in dashboard)

### Seats billing flow (kaart eerst, bedrag later)

Voor sales seats (per vertegenwoordiger) kan je de nieuwe flow gebruiken:

1. Klant kiest seats op `/billing-seats-setup.html?client=belivert-sales`
2. Stripe Checkout draait in `setup` mode (kaart koppelen, geen directe seat-afrekening)
3. Backoffice finaliseert seats via `/billing-seats-admin.html?client=belivert-sales`
4. Backend maakt/updated Stripe subscription met `quantity = seats`

Publieke entrypoints:

- `/billing-belivert.html` (Belivert overzichtspagina)
- `/billing-belivert-sales.html` (Belivert Sales seats landing)

Tip voor betaal-links:

- Zet `billing_flow: "seats_setup"` in `dashboard/public/billing-clients.json` voor het klantprofiel.
- `billing-checkout.html` detecteert dit en redirect automatisch naar `billing-seats-setup.html`.

Optionele seats UI config (`billing-clients.json`, defaults of profiel):

- `seats_price_hint` (vrije tekst, bv. "EUR 99 per vertegenwoordiger per maand. Je wordt later gefactureerd.")
- `seats_price_per_rep` + `seats_price_currency` + `seats_price_interval` (automatische prijs-hint zonder totaal)

Benodigde edge function: `supabase/functions/stripe-seats-billing/index.ts`

Vereiste function env vars:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SALES_PRICE_ID` (default recurring price per vertegenwoordiger)
- `BILLING_ADMIN_TOKEN` (vereist voor finalize endpoint)

Webhook endpoint in Stripe:

- `POST https://PROJECT_REF.supabase.co/functions/v1/stripe-seats-billing`

Deze function verwacht:

- gewone JSON requests voor `action=create_setup_session` en `action=finalize_subscription`
- intern overzicht via `action=admin_overview` (vereist `x-admin-token`)
- Stripe webhook events op hetzelfde endpoint (met `Stripe-Signature` header)

Interne overzichtspagina:

- `/billing-overview-admin.html`
- toont publieke betaal-links uit `billing-clients.json`
- haalt subscription-overzicht uit `billing_customers` via `admin_overview`

Interne operations hub (voor `app.profitpulse.be`):

- `/hub.html` (billing + onboarding navigatie)
- `/onboarding-hub.html` (gehoste onboarding wizard met snippets/checklists voor nieuwe klanten)

Provision endpoint (Netlify Function):

- `POST /.netlify/functions/provision-client`
- Vereist header: `x-admin-token`
- Vereiste Netlify env var: `PROVISION_ADMIN_TOKEN` (of fallback `BILLING_ADMIN_TOKEN`)
- Optionele env vars voor automatische checks:
  - `NETLIFY_AUTH_TOKEN`
  - `SUPABASE_ACCESS_TOKEN`
  - `STRIPE_SECRET_KEY`
  - `INTERNAL_NETLIFY_SITE_ID`
  - `DEFAULT_CUSTOMER_NETLIFY_SITE_ID`
- Write-acties vanuit onboarding-hub:
  - `create_customer_site` (maakt/update klantsite via Netlify API)
  - `write_supabase_secrets` (zet function secrets in Supabase project)

`dashboard_layout` kan een array zijn of een object met `sections`. Elke section:

- `kind`: `funnel_metrics` | `source_breakdown` | `finance_metrics` | `hook_performance` | `lost_reasons`
- `title` / `description` (optioneel)
- `metric_labels` (optioneel, alleen voor funnel/finance)
- `columns` (optioneel, CSS grid classes)
- `enabled` (optioneel, `false` = verbergen)

Je kunt ook de dashboards in de sidebar bepalen via `dashboards`:

- `dashboards`: array van `{ id, label?, enabled? }`
- `id`: `lead` | `sales` | `call-center`
- `label`: optioneel, override van de titel
- `enabled`: `false` om te verbergen

Voorbeeld:

```sql
update public.dashboard_config
set dashboard_title = 'Immo Beguin',
    dashboard_subtitle = 'Lead & Marketing Dashboard',
    dashboard_logo_url = '/assets/logos/immogbeguinlogo.png',
    dashboard_layout = '{
      "sections": [
        {
          "kind": "funnel_metrics",
          "title": "Leads & afspraken",
          "metric_labels": ["Totaal Leads", "Totaal Afspraken", "Confirmed"]
        },
        { "kind": "source_breakdown", "title": "Kanalen" },
        {
          "kind": "finance_metrics",
          "title": "Kosten",
          "metric_labels": ["Totale Leadkosten", "Kost per Lead"]
        }
      ]
    }'::jsonb
where id = 1;
```

Als `dashboard_layout` leeg of `null` is, gebruikt de frontend de default layout.

Optioneel kan je branding ook via dashboard env vars meegeven (handig per Netlify site):

- `VITE_DASHBOARD_TITLE`
- `VITE_DASHBOARD_SUBTITLE`
- `VITE_DASHBOARD_LOGO_URL`
- `VITE_DASHBOARD_THEME`
- `VITE_META_TITLE`
- `VITE_META_DESCRIPTION`
- `VITE_META_IMAGE`

Als er meerdere actieve records zijn, wordt de meest recent bijgewerkte gebruikt.
Als `GHL_LOCATION_ID` en `GHL_PRIVATE_INTEGRATION_TOKEN` leeg zijn in `.env`, wordt automatisch deze tabel gebruikt.

### Stripe abonnement tracking (automatisch)

Er is een extra migration + edge function voorzien om abonnementstatus per klant automatisch bij te houden:

- tabel `billing_customers` (huidige status per klant)
- tabel `billing_webhook_events` (ruwe webhook events, idempotent op `event_id`)
- functie `stripe-webhook` (`supabase/functions/stripe-webhook`)

#### Vereiste function secrets

- `STRIPE_WEBHOOK_SECRET` (uit Stripe webhook endpoint)
- `SUPABASE_SECRET_KEY` of `SUPABASE_SERVICE_ROLE_KEY` (server-side writes)

Optioneel:

- `STRIPE_WEBHOOK_TOLERANCE_SECONDS` (default `300`)
- `STRIPE_WEBHOOK_ALLOW_UNSIGNED` (default `false`, alleen voor lokale testing)

#### Deploy

```bash
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
```

#### Stripe webhook endpoint

Gebruik als webhook URL:

`https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`

Aan te zetten events:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

#### Klant koppeling

De checkout pagina zet automatisch `client-reference-id` op basis van `?client=<slug>`.
Zo kunnen events rechtstreeks aan `billing_customers.slug` gelinkt worden.

Voorbeeld link:

`https://profitpulse.be/billing-checkout.html?client=immo-beguin`

#### Snel statusoverzicht

```sql
select
  slug,
  company,
  subscription_status,
  current_period_end,
  cancel_at_period_end,
  last_invoice_status,
  updated_at
from public.billing_customers
order by updated_at desc;
```

## Hoe de sync werkt

- **Contacts**: gebruikt `GET /contacts/` (deprecated, maar stabiel voor bulk sync). Paginatie via `startAfter` en `startAfterId`.
- **Opportunities**: gebruikt `GET /opportunities/search` met `status=all`, `order=added_asc` en cursors.
- **Appointments**: haalt eerst alle calendars op en vraagt daarna events op per calendar binnen een tijdswindow.
- **Lost reasons**: probeert definitions uit pipelines en/of custom fields te lezen en vult `lost_reason_lookup`.

Alle records worden **idempotent** ge-upsert via Supabase (geen duplicaten).  
De **eerste sync per location** is altijd een full sync (er is nog geen `sync_state`).  
Standaard wordt er daarna elke 24 uur opnieuw een full sync gedaan om verwijderde records te prunen (contacts, opportunities, appointments).  
Let op: bij appointments geldt dit binnen het lookback/lookahead‑window.

### Incremental sync

- Er wordt een `sync_state` tabel bijgehouden met cursors en `last_synced_at`.
- Standaard wordt er een **refresh window** gebruikt om recente updates opnieuw mee te nemen:
  - `CONTACTS_REFRESH_DAYS` (default 30)
  - `OPPORTUNITIES_REFRESH_DAYS` (default 30)
- Voor appointments wordt gewerkt met een tijdsrange:
  - `APPOINTMENTS_LOOKBACK_DAYS` (default 365)
  - `APPOINTMENTS_LOOKAHEAD_DAYS` (default 365)

Je kunt altijd forceren om alles opnieuw te syncen:

```
FULL_SYNC=true
```

Wil je slechts één keer draaien:

```
RUN_ONCE=true
```

Of via CLI:

```
npm run sync -- --once
```

## Configuratie (optioneel)

Altijd verplicht:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Optioneel (alleen nodig als je niet opslaat in Supabase):

- `GHL_LOCATION_ID`
- `GHL_PRIVATE_INTEGRATION_TOKEN`

Voor het dashboard:

- `VITE_GHL_LOCATION_ID` is **optioneel** (override).
- Als die leeg is, wordt `dashboard_config.location_id` gebruikt.
- `VITE_DASHBOARD_TIMEZONE` (default `UTC`) bepaalt de timezone voor daggrenzen in de dashboard queries (bijv. `Europe/Brussels`).

Voor Meta spend (edge function):

- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_LOCATION_ID` (optioneel als `dashboard_config.id=1` gevuld is)
- `META_SYNC_SECRET`
- `META_LEAD_ACTION_TYPES`
- `META_LOOKBACK_DAYS`
- `META_END_OFFSET_DAYS`
- `META_TIMEZONE`
- `META_API_VERSION`

Voor Google Ads spend (edge function):

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_LOCATION_ID` (optioneel als `dashboard_config.id=1` gevuld is)
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `GOOGLE_ADS_API_VERSION`
- `GOOGLE_TIMEZONE`
- `GOOGLE_LOOKBACK_DAYS`
- `GOOGLE_END_OFFSET_DAYS`
- `GOOGLE_SOURCE_NAME`

Voor Google Ads via Sheets (edge function):

- `SHEET_CSV_URL`
- `SHEET_LOCATION_ID` (optioneel als `dashboard_config.id=1` gevuld is)
- `SHEET_SOURCE_NAME`
- `SHEET_ACCOUNT_ID`
- `SHEET_DATE_COLUMN`
- `SHEET_COST_COLUMN`
- `SHEET_CONVERSIONS_COLUMN`
- `SHEET_CURRENCY_COLUMN`
- `SHEET_ACCOUNT_COLUMN`
- `SHEET_DATE_FORMAT`

Overige opties staan in `.env.example`:

- `GHL_BASE_URL` (default: `https://services.leadconnectorhq.com`)
- `GHL_API_VERSION` (default: `2021-07-28`)
- `GHL_CALENDARS_VERSION` (default: `2021-04-15`)
- `SYNC_BATCH_SIZE` (max 100)
- `REQUEST_TIMEOUT_MS`
- `MAX_RETRIES`, `RETRY_BASE_DELAY_MS`
- `SYNC_INTERVAL_MINUTES` (default: 15)
- `PRUNE_ON_FULL_SYNC` (default: true, verwijdert records die niet meer bestaan in GHL na een full sync)
- `FULL_SYNC_INTERVAL_HOURS` (default: 24, zet op 0 om te disable)
- `LOG_LEVEL`

## Cleanup checklist bij gelekte secrets

Gebruik deze stappen als er ooit per ongeluk een secret in Git terechtkomt:

1. **Rotate** de gelekte keys (Supabase service role, GHL PIT, sync secret).
2. **Verwijder** secrets uit `.env.example`/docs en vervang door placeholders.
3. **Rewrite history** met `git filter-repo` en een `--replace-text` bestand.
4. **Force-push**:

```
git push --force --all origin
git push --force --tags origin
```

5. **Laat iedereen** die de repo heeft opnieuw clonen (of history cleanen).
6. **Her-scan** (GitGuardian / GitHub secret scanning).

## Uitbreiden met nieuwe endpoints

1. Maak een nieuwe tabel + schema in `src/schemas/`.
2. Voeg een sync-module toe in `src/sync/`.
3. Voeg een method toe in `src/clients/ghlClient.ts`.
4. Registreer in `src/index.ts`.

## Opmerkingen

- Deze template gebruikt de **officiele GHL API v2** met Private Integration Token.
- Voor contacts is de Search endpoint niet volledig gespecificeerd in de officiele OpenAPI spec; daarom is de deprecated list endpoint gebruikt voor bulk sync.
- Appointments worden opgehaald via `GET /calendars/events`, omdat er geen globale “list all appointments” endpoint beschikbaar is.
