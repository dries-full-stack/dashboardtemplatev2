# GoHighLevel → Supabase Dashboard Template

Doel: herbruikbare template om GoHighLevel (GHL) data automatisch te synchroniseren naar Supabase (PostgreSQL), zodat je direct dashboards/analyses kunt bouwen.

## Vereisten

- Node.js 18+
- Supabase project (publishable + secret key nodig)
- GoHighLevel Private Integration Token + Location ID (in `.env` of opgeslagen in Supabase)

## Installatie

1. Maak de tabellen aan in Supabase met de SQL-bestanden:
   - `src/schemas/all.sql` (alles-in-1)
   - of los: `src/schemas/contacts.sql`, `src/schemas/opportunities.sql`, `src/schemas/appointments.sql`, `src/schemas/sync_state.sql`, `src/schemas/ghl_integrations.sql`, `src/schemas/dashboard_config.sql`, `src/schemas/views.sql`, `src/schemas/functions.sql`

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

## GHL config in Supabase (optioneel)

Als je niet elke keer lokaal de GHL credentials wilt zetten, kun je ze per klant opslaan in Supabase.
De tabel `ghl_integrations` heeft **RLS aan** zodat de PIT niet via de anon key uitlekt.  
Gebruik de SQL editor (of service role) om de rij te inserten. De sync gebruikt service role en kan dit gewoon lezen.
De tabel `dashboard_config` bevat enkel de **publieke** `location_id` (leesbaar via anon) zodat het dashboard automatisch kan filteren.

### Raw data + views (Optie A)

Alle velden die de GHL list/search endpoints teruggeven worden al opgeslagen in `raw_data` (JSONB).
Voor convenience hebben we views toegevoegd met een `source_guess` kolom:

- `public.contacts_view`
- `public.opportunities_view`
- `public.appointments_view`

Als jouw payload een andere key gebruikt voor source, pas de `coalesce(...)` in `src/schemas/views.sql` aan.
De source breakdown gebruikt `get_source_breakdown` uit `src/schemas/functions.sql`.

### Admin setup UI (publiek)

Je kunt via de dashboard UI de integratie opslaan met Supabase Auth (magic link).

1) Zet Supabase Auth klaar:

- **Email provider** aanzetten
- **Site URL** invullen (voor magic link redirect)
- Optioneel: zet **signups uit** na setup of gebruik een allowlist/invite-only

2) Deploy de function:

```
supabase functions deploy ghl-admin
```

`supabase/config.toml` staat al op `verify_jwt = true` voor `ghl-admin`.

3) Zet in `dashboard/.env`:

```
VITE_ADMIN_MODE=true
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Dan verschijnt een **Setup** knop in de header. Log in met je email en sla `location_id` + PIT op in `ghl_integrations`.
Daarna wordt automatisch `dashboard_config` bijgewerkt.

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

Als er meerdere actieve records zijn, wordt de meest recent bijgewerkte gebruikt.
Als `GHL_LOCATION_ID` en `GHL_PRIVATE_INTEGRATION_TOKEN` leeg zijn in `.env`, wordt automatisch deze tabel gebruikt.

## Hoe de sync werkt

- **Contacts**: gebruikt `GET /contacts/` (deprecated, maar stabiel voor bulk sync). Paginatie via `startAfter` en `startAfterId`.
- **Opportunities**: gebruikt `GET /opportunities/search` met `status=all`, `order=added_asc` en cursors.
- **Appointments**: haalt eerst alle calendars op en vraagt daarna events op per calendar binnen een tijdswindow.

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

## Uitbreiden met nieuwe endpoints

1. Maak een nieuwe tabel + schema in `src/schemas/`.
2. Voeg een sync-module toe in `src/sync/`.
3. Voeg een method toe in `src/clients/ghlClient.ts`.
4. Registreer in `src/index.ts`.

## Opmerkingen

- Deze template gebruikt de **officiele GHL API v2** met Private Integration Token.
- Voor contacts is de Search endpoint niet volledig gespecificeerd in de officiele OpenAPI spec; daarom is de deprecated list endpoint gebruikt voor bulk sync.
- Appointments worden opgehaald via `GET /calendars/events`, omdat er geen globale “list all appointments” endpoint beschikbaar is.

