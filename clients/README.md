# Clients (one database per klant)

Per klant gebruiken we een eigen Supabase project. Dit voorkomt schema-conflicten en maakt klant-specifieke DB wijzigingen veilig.

## Snelstart

1. Maak een nieuw Supabase project aan (noteer de Supabase URL of project ref).
2. Run de bootstrap script:

```
powershell -ExecutionPolicy Bypass -File scripts/bootstrap-client.ps1
```

3. Run base schema via CLI:

```
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. Run client config:

```
clients/<slug>/dashboard_config.sql
```

5. Deploy edge functions (per klant):

```
supabase functions deploy ghl-sync --project-ref YOUR_PROJECT_REF
supabase functions deploy meta-sync --project-ref YOUR_PROJECT_REF
supabase functions deploy google-sync --project-ref YOUR_PROJECT_REF
supabase functions deploy google-sheet-sync --project-ref YOUR_PROJECT_REF
supabase functions deploy teamleader-oauth --project-ref YOUR_PROJECT_REF
supabase functions deploy teamleader-sync --project-ref YOUR_PROJECT_REF
```

## Wat maakt de script aan?

- `dashboard_config.sql` (per klant layout/branding + location_id)
- `dashboard_layout.json` (optioneel, makkelijk te editen)
- `env.dashboard.example` (Netlify/Vite vars)
- `env.sync.example` (sync vars)

## Volledig geautomatiseerd (optioneel)

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

## Netlify env sync

```
powershell -ExecutionPolicy Bypass -File scripts/netlify-env-sync.ps1
```

Of gebruik de onboarding UI en vul `Netlify site ID/naam` in.

## Git + Netlify automatisering

De onboarding UI ondersteunt:
- Git branch aanmaken + pushen
- Netlify site create
- Production branch zetten
- Custom domain instellen
- Netlify DNS CNAME records (subdomains)

## Teamleader OAuth

Gebruik de onboarding UI om Teamleader secrets te zetten:
- `TEAMLEADER_CLIENT_ID`
- `TEAMLEADER_CLIENT_SECRET`
- `TEAMLEADER_REDIRECT_URL`
- `TEAMLEADER_SCOPES` (optioneel)

Deploy de functies:

```
supabase functions deploy teamleader-oauth --project-ref YOUR_PROJECT_REF
supabase functions deploy teamleader-sync --project-ref YOUR_PROJECT_REF
```

Plan de Teamleader sync (15 min) via `supabase/schedule.sql`.
