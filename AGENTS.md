# dashboardtemplatev2 Agent Notes

Doel van deze file: snelle context voor agents over de repo-architectuur, onboarding/billing flows, en de meest voorkomende problemen.

## Maintenance (Systematisch Updaten)

Deze file is living documentation. Update `AGENTS.md` systematisch in dezelfde PR wanneer je:
- Nieuwe migrations/RPC's toevoegt of preflight/health-check logica wijzigt.
- Edge functions toevoegt/hernoemt of `verify_jwt`/auth headers wijzigt.
- Onboarding wizard UX verandert (velden, defaults, auto-fill, links tussen hub en wizard).
- Nieuwe env vars introduceert of de betekenis van bestaande keys wijzigt (vooral: Supabase PAT vs service role vs publishable).
- Een nieuwe veelvoorkomende fout tegenkomt: voeg een entry toe aan Troubleshooting met 1 oorzaak + 1 fix.

## Repo Map

- `dashboard/`: Vite frontend (customer dashboard UI). `dashboard/src/main.js` is de centrale entrypoint.
- `dashboard/public/`: statische pagina's voor internal hub + billing + hosted onboarding (worden mee gedeployed maar blokkeren zichzelf via host allowlist).
- `onboarding/`: lokale onboarding wizard (Node HTTP server + vanilla JS UI).
- `supabase/migrations/`: Postgres schema + RPC's (push via `supabase db push`).
- `supabase/functions/`: Supabase Edge Functions (Deno). Deploy via `supabase functions deploy <name>`.
- `src/`: lokale Node sync scripts (tsx) als alternatief voor Edge Functions.
- `scripts/`: PowerShell bootstrap + helper scripts.
- `clients/<slug>/`: per-klant scaffolds (dashboard_config.sql, layout json, env templates, schedule.sql).
- `netlify/functions/`: Netlify function(s) voor provisioning (`provision-client.js`).
- `docs/`: interne documentatie + meeting notes (lightweight, repo-local).

## Quick Start (Local Dev)

1. Root deps: `npm install`
2. Dashboard deps (1x): `npm --prefix dashboard install`
3. Start onboarding + dashboard tegelijk: `npm run dev`
4. Enkel onboarding: `npm run onboard`

Ports:
- Onboarding wizard: `http://localhost:8787`
- Dashboard dev server: `http://localhost:5173`

## Env Files (Belangrijk)

- `.env.local` is voor lokale onboarding defaults en wordt door `onboarding/server.mjs` ingelezen. Gebruik `.env.local.example` als template en commit nooit `.env.local`.
- `.env` (repo root) is voor de lokale sync scripts in `src/` (tsx). Gebruik `.env.example` als template.
- `dashboard/.env` is voor de Vite dashboard app (local dev en eventueel Netlify env). Wizard kan dit bestand schrijven.
- `clients/<slug>/env.*.example` zijn de per-klant templates die onboarding/bootstrapping genereert.
- `VITE_REQUIRE_AUTH` (dashboard): default `true`. Als `true` toont de dashboard UI eerst een login scherm (email + password) en verwacht je RLS "authenticated-only" policies in Supabase.

## Onboarding Wizard (Local)

Entry points:
- UI: `onboarding/public/index.html`, logic: `onboarding/public/app.js`
- Server/API: `onboarding/server.mjs`

Wat het doet:
- Preflight checks (`/api/preflight`): Supabase CLI/Node/Git, token checks, schema readiness (`dashboard_config`), cron readiness (`cron_health`).
- Run onboarding (`/api/onboard`): scaffold schrijven in `clients/<slug>/`, optioneel migrations pushen, secrets zetten, edge functions deployen, `dashboard_config` upserten, GHL token opslaan.
- Health check (`/api/health-check`): controleert tables/RPC's en of sync data aanwezig is.
- Cron install (`/api/cron-install`): roept RPC `setup_cron_jobs` aan (vereist migrations + `pg_cron` + `pg_net`).

Belivert defaults:
- Belivert is sales-only: de wizard genereert `dashboard_layout.dashboards` met `lead.enabled = false` wanneer `theme=belivert` gedetecteerd wordt (ook als Leadgeneratie aangevinkt staat).

PowerShell vs Node runner:
- Default runner is `scripts/bootstrap-client.ps1` (PowerShell).
- Op machines zonder `pwsh` (Mac/Linux zonder PowerShell) valt de wizard automatisch terug op een Node runner.
- Force Node runner: zet `ONBOARDING_FORCE_NODE_BOOTSTRAP=1`.
- PowerShell path overriden: zet `ONBOARDING_POWERSHELL_BIN` (bijv. `/usr/local/bin/pwsh`).

Node runner coverage (fallback):
- Doet scaffold schrijven, `supabase login/link/db push`, secrets zetten (Teamleader/Meta/Google), `dashboard_config` + `ghl_integrations` REST upserts, en edge function deploys.
- Doet geen Git branch automation en geen Netlify automation (die zitten in `scripts/bootstrap-client.ps1`).

Outputs:
- `clients/<slug>/dashboard_config.sql`
- `clients/<slug>/dashboard_layout.json`
- `clients/<slug>/env.dashboard.example`
- `clients/<slug>/env.sync.example`
- `clients/<slug>/schedule.sql`
- Optioneel: `dashboard/.env` voor lokaal draaien van de Vite app.

Security defaults:
- Onboarding server bindt standaard op `127.0.0.1` en weigert non-loopback requests.
- Wil je het onboarding scherm toch op je netwerk openzetten: zet `ONBOARDING_ALLOW_NETWORK=1` en (optioneel) `ONBOARDING_HOST=0.0.0.0`.

## Hosted Hub + Billing + Provisioning (Static)

Pages:
- Hub: `dashboard/public/hub.html`
- Hosted onboarding: `dashboard/public/onboarding-hub.html`
- Billing config: `dashboard/public/billing-clients.json`
- Billing flows: `dashboard/public/billing-*.html`

Provisioning backend:
- Netlify function: `netlify/functions/provision-client.js`

UX/security regels (houd dit strikt aan):
- Zet nooit secrets in query params (URLs worden gelogd, gedeeld en gecached).
- Prefill links mogen alleen niet-gevoelige velden bevatten (slug, supabaseUrl, dashboardTitle, dashboardTabs).
- Auto-generatie van slug/client keys/domein enkel op blur of expliciete actie, niet bij elke keystroke.

## Supabase: Schema + RPC's

Migrations:
- Base schema: `supabase/migrations/20260204160000_base.sql` (o.a. `dashboard_config` singleton row `id=1`).
- Billing tables: `supabase/migrations/20260207170000_billing_subscription_tracking.sql` (o.a. `billing_customers`).
- Cron RPC's: `supabase/migrations/20260209153000_cron_jobs_rpc.sql` (RPC `setup_cron_jobs`, `cron_health`).
- Cron RPC invoices patch: `supabase/migrations/20260218170000_cron_jobs_rpc_include_teamleader_invoices.sql` (voegt `invoices` toe aan Teamleader cron entities in `setup_cron_jobs`).
- Security hardening (RLS/auth): `supabase/migrations/20260215170000_security_hardening_auth_rls.sql` (verwijdert anon "customer mode", vereist dashboard login).
- Dashboard access allowlist (RLS): `supabase/migrations/20260215180000_dashboard_access_allowlist.sql` (voegt allowlist toe zodat "authenticated" niet genoeg is als signups aan staan).
- Teamleader deals close-date index: `supabase/migrations/20260217120000_teamleader_deals_closed_at_index.sql` (index op `closed_at` voor filtering op gewonnen/verloren deals).
- Sales breakdown rules (Belivert): `supabase/migrations/20260217173000_dashboard_config_sales_breakdown_rules.sql` (voegt `sales_product_category_rules` + `sales_region_rules` toe aan `dashboard_config`).

Preflight warnings betekenis:
- `dashboard_config ontbreekt`: schema nog niet gepusht naar het Supabase project. Oplossing: `supabase db push`.
- `cron_health RPC ontbreekt`: cron migrations nog niet gepusht. Oplossing: `supabase db push` (migratie `20260209153000_cron_jobs_rpc.sql`).

Scheduling:
- `supabase/schedule.sql` bevat placeholders; vervang `PROJECT_REF`.
- `clients/<slug>/schedule.sql` wordt door onboarding gegenereerd met de juiste `PROJECT_REF`.
- Aanbevolen: gebruik RPC `setup_cron_jobs` via onboarding (`/api/cron-install`) om consistent schedules te krijgen.
- Teamleader schedules gebruiken standaard entities inclusief `invoices` (naast deals/contacten/meetings), zodat factuur-KPI's gevuld blijven.
- Als je `SYNC_SECRET`/`META_SYNC_SECRET` gebruikt en je runt handmatig `schedule.sql`: voeg `x-sync-secret` toe aan de `net.http_post(... headers := ...)` calls (of gebruik `setup_cron_jobs`).

## Core Data Model (High Level)

- `public.dashboard_config` (singleton `id=1`): per-klant config (location_id, titels, logo, `dashboard_layout`, optional normalisatie rules en KPI settings).
- `public.ghl_integrations`: opslag van GHL private integration token (per location_id) voor edge sync.
- `public.sync_state`: sync cursors/last_synced per entity.
- `public.opportunities_view`: view gebruikt door dashboard voor lead/sales aggregaties.
- `public.teamleader_integrations`: OAuth tokens per location_id (Teamleader Focus).
- `public.teamleader_deals`, `public.teamleader_deal_sources`, `public.teamleader_lost_reasons`: Teamleader sync output.
- `public.marketing_spend_*`: spend data (Meta/Google/Sheets).
- `public.billing_customers`: billing status tracking voor seats flow.

## Supabase: Edge Functions

Code: `supabase/functions/<name>/index.ts`

verify_jwt configuratie:
- `supabase/config.toml` zet `verify_jwt = false` voor sync/billing functions zodat cron calls werken.

Auth (optioneel):
- `ghl-sync` en `teamleader-sync` checken `SYNC_SECRET` als die secret gezet is in Supabase.
- `meta-sync` checkt `META_SYNC_SECRET` als die secret gezet is.
- Header opties: `Authorization: Bearer <secret>` of `x-sync-secret: <secret>`.

## Key / Secret Cheat Sheet (Waar Plakken?)

Onboarding wizard velden:
- `Supabase access token`: Supabase Personal Access Token (PAT) van je account. Pattern: `sbp_...`
- `DB password`: database password van het Supabase project (Postgres). Geen prefix.
- `Server key`: service role key van het Supabase project. Pattern: `sb_secret_...` of legacy `eyJ...` (service_role JWT).

Belangrijk:
- PAT (`sbp_...`) is account-level en blijft meestal hetzelfde tot je hem revoke/rotate. Het is niet "per project".
- `sb_secret_...` is project-level en mag nooit naar de browser/frontend.
- `sb_publishable_...` (of legacy anon `eyJ...`) is ok voor frontend en hoort in `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Common Workflows

Nieuwe klant (dashboard):
1. Maak een nieuw Supabase project aan (noteer `projectRef`, `supabaseUrl`, DB password).
2. Start wizard: `npm run onboard` en open `http://localhost:8787`.
3. Vul minimaal in: slug (liefst lowercase), Supabase URL of project ref, GHL location ID.
4. Als je CLI stappen wil (link/db push/functions deploy): vul ook `Supabase access token` (`sbp_...`) en `DB password`.
5. Als je config wil schrijven (`dashboard_config`/cron/health): vul ook `Server key` (`sb_secret_...` of legacy `eyJ...`) of gebruik auto-fetch keys.
6. Run `Preflight` in de wizard, fix warnings, en run daarna onboarding.
7. Als Teamleader aan staat: open de `/functions/v1/teamleader-oauth/start?location_id=...` link en autoriseer.
8. Run `Cron install` (RPC) of gebruik `clients/<slug>/schedule.sql`.
9. Run `Health check` en open dashboard.

Layout/branding aanpassen (zonder code changes):
1. Pas `dashboard_config.dashboard_layout` aan (via onboarding apply config, SQL editor met `clients/<slug>/dashboard_config.sql`, of via dashboard admin settings als die aan staan).
2. Vermijd customer branches; prefer config-driven.

## Troubleshooting (Meest Voorkomend)

- Preflight `401` met `"JWT could not be decoded"` bij access token: meestal werd een project key (`sb_secret_...`, `sb_publishable_...` of `eyJ...`) in het PAT veld geplakt. Oplossing: zet `sbp_...` in `Supabase access token`; project service key hoort in `Server key`.
- `pwsh ENOENT` / "PowerShell starten faalde": installeer PowerShell (`pwsh`), zet `ONBOARDING_POWERSHELL_BIN`, of forceer Node runner met `ONBOARDING_FORCE_NODE_BOOTSTRAP=1`.
- `ERR_CONNECTION_REFUSED` op `http://localhost:8787/...`: onboarding server draait niet of crashte. Start met `npm run onboard` (of `npm run dev`).
- Console errors `bootstrap-autofill-overlay.js`: komt van browser password-manager/autofill extensies, geen repo bug.
- Sidebar chevron (desktop) doet niets of sidebar blijft "ingeklapt": in oudere builds toggelde `toggleSidebar()` enkel op mobile. Fix: update/deploy dashboard. Workaround: clear `localStorage` key `dashboard_sidebar_desktop` (per subdomain/origin) en refresh.
- Dashboard login faalt ("Invalid login credentials" / geen sessie): user bestaat niet of heeft geen password. Oplossing: seed een email+password user via `node scripts/admin_seed_password_user.js <client|all> user@domain.tld` (+ `DASHBOARD_USER_PASSWORD=...`) en check `public.dashboard_access` allowlist.
- Console error `permission denied for table ...` (bv. `opportunity_pipeline_lookup`, code `42501`): dashboard draait zonder Supabase sessie terwijl RLS nu `authenticated-only` is (vaak door `VITE_REQUIRE_AUTH=false`). Oplossing: zet `VITE_REQUIRE_AUTH=true` en log in (en voeg de user toe aan `public.dashboard_access`).
- Marketing costs/spend blijft leeg of stopt met updaten: vaak ontbreken de cron jobs (`meta-sync-daily` / `google-sync-daily` / `google-sheet-sync-daily`). Oplossing: run `Cron install` in de wizard (roept RPC `setup_cron_jobs` aan) of installeer de schedules manueel via `setup_cron_jobs` met `enable_meta=true` en de juiste `google_mode`.
- Google Ads (Sheets) costs blijven steken op een oude datum: een geplande Google Ads report-export maakt vaak elke run een **nieuwe** Sheet in een Drive-folder, waardoor `SHEET_CSV_URL` naar een oud bestand blijft wijzen. Oplossing: gebruik een **stabiele** destination sheet (zelfde sheet ID) die telkens overschreven wordt (via Google Ads Script of Apps Script dat de nieuwste report-sheet kopieert) en zet die sheet op “Anyone with the link can view”; update daarna `SHEET_CSV_URL` naar de CSV-export URL van die stabiele sheet.
- Dashboard deployt nog van een klant-branch (oude UI / verkeerde versie): check Netlify site settings → Build & deploy → `Production branch` en zet die op `main` (en `allowed branches` op `main`).
- Netlify build faalt met `Host key verification failed` na repo-branch/settings update: meestal werd de GitHub App `installation_id` gewist door een `PUT` update. Fix: reconnect repo in Netlify UI of herstel via `PATCH` waarbij je `repo.installation_id` meegeeft; vermijd `PUT` voor site updates.
- `Failed to invite user ... email rate limit exceeded`: Supabase Auth rate-limiteert uitgaande emails (invite/magic link). Oplossing: wacht tot de limiet reset of configureer custom SMTP; workaround zonder email: `node scripts/admin_magic_link.js belivert user@domain.tld https://<dashboard-url>` (maakt user aan, zet allowlist entry, en print een 1x magic link die je handmatig kan delen).
- Magic link redirect naar localhost: Supabase Auth URL config mist je deploy URL (of `Site URL` staat nog op `http://localhost:5173`), waardoor Supabase fallbackt naar de `Site URL`. Oplossing: Supabase Dashboard → Authentication → URL Configuration: zet `Site URL` naar je productie dashboard URL en voeg die URL (plus `http://localhost:5173` voor local dev) toe aan `Redirect URLs`.
- Onverwachte Auth settings na `supabase config push`: de CLI pusht een volledige Auth config; als je enkel `site_url`/redirects wil aanpassen kunnen defaults andere Auth flags overschrijven (bv. MFA TOTP of email confirmations). Oplossing: zet de relevante `[auth.*]` flags expliciet in `supabase/config.toml` (of pas het aan via Supabase Dashboard).
- Dashboard login lukt maar je krijgt 401/403 bij data calls: check of de user in `public.dashboard_access` staat (allowlist). Oplossing: voeg email toe aan `public.dashboard_access` (of draai migratie `20260215180000_dashboard_access_allowlist.sql` opnieuw om bestaande auth users te seeden).
- Sales dashboard: afspraken tonen `--`: `teamleader_deals.had_appointment_phase` is nog niet gedeployed (migraties ontbreken). Oplossing: `supabase db push` + (optioneel) trigger `teamleader-sync` voor deals.
- Sales dashboard: afspraken tonen `123+ (nog X)`: `had_appointment_phase` is `NULL` voor sommige deals terwijl phase history nog bezig is (sync/backfill). Oplossing: wacht of trigger `teamleader-sync` (deals reconcile) zodat `/deals.info` markers gevuld worden.
- Sales dashboard: cyclustijden lijken "te snel" of "te traag": check of marker columns `appointment_phase_first_started_at` en `quote_phase_first_started_at` bestaan en gevuld worden (migraties + sync). Zonder markers wordt er gefallbackt op `created_at`/`updated_at`.
- Sales dashboard: factuur-omzet blijft leeg ondanks correcte Teamleader OAuth scopes: Teamleader sync draaide zonder `invoices` in de `entities` payload (oude cron/schedule defaults). Oplossing: `supabase db push` (migratie `20260218170000_cron_jobs_rpc_include_teamleader_invoices.sql`), run daarna opnieuw `Cron install` en trigger één manuele `teamleader-sync` met `entities=invoices`.
- Sales dashboard: Teamleader invoice sync geeft `403 You have no access to this module` ondanks `invoices` scope in `teamleader_integrations`: de geautoriseerde Teamleader user/account mist module-rechten op Facturen. Oplossing: autoriseer opnieuw met een Teamleader user die toegang heeft tot de Invoices module (of activeer die module/rechten), en trigger daarna opnieuw `teamleader-sync` met `entities=invoices`.

## Timezones / Off-by-One

- Sales/Teamleader counts kunnen verschillen door timezone dag-grenzen.
- Gebruik `VITE_DASHBOARD_TIMEZONE` (bv. `Europe/Brussels`) en behandel dag-ranges als `[start, end)` met timezone-aware UTC instants.
- Als `VITE_DASHBOARD_TIMEZONE` toegevoegd moet worden aan templates, update ook `clients/*/env.dashboard.example` en eventuele docs.

## Working Preference (Dries)

- If unexpected/unrelated git changes appear during work, continue with the requested task and leave those files untouched.
- Do **not** block on those changes unless explicitly asked.
- Never deploy automatically. Only run any deploy command (Netlify/Supabase/other) after explicit user approval in the current conversation.
- You may always run Teamleader deals reconcile/cleanup without extra approval to fix count mismatches
  (including deleting stale `teamleader_deals` rows that are no longer returned by Teamleader in the same lookback window).
- You may always run GHL opportunities full-sync/reconcile without extra approval to fix dashboard-vs-GHL count mismatches,
  including cleanup of stale `opportunities` rows that are no longer returned by GHL.

## Belivert Sales Source Mapping (Dynamic)

- Teamleader deal sources are synced automatically into `public.teamleader_deal_sources`.
- Sales dashboard reads Teamleader `dealSource` IDs from `teamleader_deals.raw_data.source` and maps them to labels via `teamleader_deal_sources`.
- No manual source-ID mapping is required.

## Sales Dashboard (Belivert)

Waar komen de cijfers vandaan?
- Basis: `public.teamleader_deals` (Teamleader Focus deals).
- Funnel/ratio/cyclustijden + "avg deal value" zijn deal-based (`teamleader_deals.*`).
- **Behaalde omzet** KPI's + maandtabel zijn standaard invoice-based: `public.teamleader_invoices` (`invoice_date`, `total_tax_exclusive`).
- Tijdelijke Belivert fallback: als factuurmodule/sync niet bruikbaar is, worden omzet-KPI's en maandtabel berekend op gewonnen/goedgekeurde offertes (`public.teamleader_deals.estimated_value`) met hetzelfde service-exclusie keywordfilter.
- Sales vs service split gebeurt via `dashboard_config.sales_excluded_deal_keywords` (match op `teamleader_deals.title` via gekoppelde `deal_id` in de factuur).
- Breakdown rules (optioneel, Belivert):
  - `dashboard_config.sales_product_category_rules` (match op `teamleader_deals.title`)
  - `dashboard_config.sales_region_rules` (postcode uit `teamleader_contacts/raw_data` of `teamleader_companies/raw_data`)

Offertes tellen (Belivert workflow):
- 1 klant kan meerdere offerteversies krijgen. KPI's bundelen daarom per klant (`customer_type` + `customer_id`) zodat dit 1 traject telt.
- Vanaf wanneer telt iets als "offerte": `dashboard_config.sales_quotes_from_phase_id` (fase threshold; gebruikt `sort_order`, fallback `probability`).

Uitsluiten service/deeltrajecten:
- `dashboard_config.sales_excluded_deal_keywords` (bv. `["service"]`) exclude deals op titel voor de sales KPI's.

Cyclustijden (edge-marker aware):
- "Gem. Tijd tot Offerte" = afspraakfase start -> quote fase start (`appointment_phase_first_started_at` -> `quote_phase_first_started_at`).
- "Gem. Offerte → Close" = quote fase start -> close (`quote_phase_first_started_at` -> `closed_at`).
- "Gem. Sales Cycle" = afspraakfase start -> close (`appointment_phase_first_started_at` -> `closed_at`).
- Fallback als markers ontbreken: `created_at`/`updated_at`/`closed_at`.

Benodigde Teamleader markers:
- Migrations: `supabase/migrations/20260207150000_teamleader_deals_appointment_phase.sql`, `supabase/migrations/20260207231000_teamleader_deals_quote_phase_marker.sql`.
- Sync populatie: `supabase/functions/teamleader-sync/index.ts` vult markers via phase history (`/deals.info`).

Seller KPI targets (hardcoded in UI):
- Omzet KPI per verkoper: EUR 75.000/maand (`SALES_SELLER_MONTHLY_REVENUE_TARGET`).
- Afspraken KPI per verkoper: 52/maand (`SALES_SELLER_MONTHLY_APPOINTMENTS_TARGET`).
- Opgelet: afspraken KPI is momenteel een proxy (aantal trajecten in huidige maand). Als de klant "ingeplande afspraken" letterlijk bedoelt, moeten we afspraken-events expliciet syncen/relateren.

Meeting notes / roadmap:
- Zie `docs/meeting-notes/2026-02-17-belivert-sales-dashboard.md` voor de lijst met klantvragen (Nick D) + implementatie-opties.

## Deploy / Refresh Checklist (Generic)

1. Push DB migrations: `supabase db push`
2. Deploy Teamleader sync function: `supabase functions deploy teamleader-sync`
3. Deploy GHL sync function (als Edge gebruikt): `supabase functions deploy ghl-sync`
4. Trigger source refresh (optioneel, na deploy):

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/teamleader-sync" \
  -H "Content-Type: application/json" \
  -H "apikey: <SUPABASE_PUBLISHABLE_OR_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_PUBLISHABLE_OR_ANON_KEY>" \
  -d '{"entities":["deal_sources"],"location_id":"<LOCATION_ID>"}'
```
