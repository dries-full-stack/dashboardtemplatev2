import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type InsightAction = {
  action_type?: string;
  value?: string | number;
};

type InsightRow = {
  date_start?: string;
  date_stop?: string;
  account_id?: string;
  account_name?: string;
  account_currency?: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  spend?: string | number;
  actions?: InsightAction[];
};

type RequestConfig = {
  lookbackDays: number;
  endOffsetDays: number;
};

const optional = (key: string, fallback: string) => {
  const value = Deno.env.get(key);
  return value && value.length > 0 ? value : fallback;
};

const required = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const parseNumber = (value: string | null | undefined, fallback: number) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (value: string | null | undefined, fallback: boolean) => {
  if (value === null || value === undefined || value === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
};

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',

  META_ACCESS_TOKEN: required('META_ACCESS_TOKEN'),
  META_AD_ACCOUNT_ID: required('META_AD_ACCOUNT_ID'),
  META_API_VERSION: optional('META_API_VERSION', 'v21.0'),
  META_SOURCE_NAME: optional('META_SOURCE_NAME', 'META'),
  META_FETCH_ADSET: parseBoolean(Deno.env.get('META_FETCH_ADSET'), true),
  META_FETCH_AD: parseBoolean(Deno.env.get('META_FETCH_AD'), true),
  META_LOCATION_ID: Deno.env.get('META_LOCATION_ID') ?? '',
  META_TIMEZONE: optional('META_TIMEZONE', 'Europe/Brussels'),
  META_LOOKBACK_DAYS: parseNumber(Deno.env.get('META_LOOKBACK_DAYS'), 7),
  META_END_OFFSET_DAYS: parseNumber(Deno.env.get('META_END_OFFSET_DAYS'), 1),
  META_LEAD_ACTION_TYPES: optional(
    'META_LEAD_ACTION_TYPES',
    'lead,omni_lead,onsite_conversion.lead,offsite_conversion.fb_pixel_lead'
  ),
  META_SYNC_SECRET: Deno.env.get('META_SYNC_SECRET') ?? ''
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

const leadActionTypes = new Set(
  env.META_LEAD_ACTION_TYPES.split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
);

const normalizeAccountId = (value: string) => (value.startsWith('act_') ? value : `act_${value}`);

const formatDateInTimeZone = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

const shiftDate = (dateStr: string, days: number) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const parseConfig = async (req: Request): Promise<RequestConfig> => {
  const url = new URL(req.url);
  let lookbackDays = parseNumber(url.searchParams.get('lookback_days'), env.META_LOOKBACK_DAYS);
  let endOffsetDays = parseNumber(url.searchParams.get('end_offset_days'), env.META_END_OFFSET_DAYS);

  if (req.method !== 'GET') {
    try {
      const body = await req.json();
      lookbackDays = parseNumber(body?.lookback_days, lookbackDays);
      endOffsetDays = parseNumber(body?.end_offset_days, endOffsetDays);
    } catch {
      // ignore body parse errors
    }
  }

  lookbackDays = Math.max(1, Math.floor(lookbackDays));
  endOffsetDays = Math.max(0, Math.floor(endOffsetDays));

  return { lookbackDays, endOffsetDays };
};

type InsightLevel = 'account' | 'adset' | 'ad';

const fieldsByLevel: Record<InsightLevel, string> = {
  account: 'date_start,date_stop,account_id,account_name,account_currency,spend,actions',
  adset:
    'date_start,date_stop,account_id,account_name,account_currency,spend,actions,campaign_id,campaign_name,adset_id,adset_name',
  ad:
    'date_start,date_stop,account_id,account_name,account_currency,spend,actions,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name'
};

const buildInsightsUrl = (accountId: string, since: string, until: string, level: InsightLevel) => {
  const url = new URL(`https://graph.facebook.com/${env.META_API_VERSION}/${accountId}/insights`);
  url.searchParams.set('access_token', env.META_ACCESS_TOKEN);
  url.searchParams.set('fields', fieldsByLevel[level]);
  url.searchParams.set('level', level);
  url.searchParams.set('time_increment', '1');
  url.searchParams.set('time_range', JSON.stringify({ since, until }));
  return url;
};

const fetchAllInsights = async (accountId: string, since: string, until: string, level: InsightLevel) => {
  const rows: InsightRow[] = [];
  let nextUrl: string | null = buildInsightsUrl(accountId, since, until, level).toString();

  while (nextUrl) {
    const response = await fetch(nextUrl);
    const payload = await response.json();

    if (!response.ok || payload?.error) {
      const message =
        payload?.error?.message ??
        `Meta API ${response.status} ${response.statusText}`;
      throw new Error(message);
    }

    const pageRows = Array.isArray(payload?.data) ? (payload.data as InsightRow[]) : [];
    rows.push(...pageRows);
    nextUrl = payload?.paging?.next ?? null;
  }

  return rows;
};

const parseNumberValue = (value: string | number | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const sumLeadActions = (actions: InsightAction[] | undefined) => {
  if (!Array.isArray(actions)) return 0;
  return actions.reduce((total, action) => {
    const actionType = String(action?.action_type ?? '').toLowerCase();
    if (!leadActionTypes.has(actionType)) return total;
    return total + parseNumberValue(action?.value);
  }, 0);
};

const resolveLocationId = async () => {
  if (env.META_LOCATION_ID) return env.META_LOCATION_ID;
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('location_id')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data?.location_id ?? '';
};

const upsertSpendRows = async (rows: InsightRow[], locationId: string, syncedAt: string) => {
  if (rows.length === 0) return 0;

  const payload = rows
    .filter((row) => row?.date_start)
    .map((row) => ({
      date: row.date_start,
      location_id: locationId,
      source: env.META_SOURCE_NAME,
      account_id: row.account_id ?? normalizeAccountId(env.META_AD_ACCOUNT_ID),
      spend: parseNumberValue(row.spend),
      leads: sumLeadActions(row.actions),
      currency: row.account_currency ?? null,
      raw: row,
      synced_at: syncedAt
    }));

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('marketing_spend_daily').upsert(chunk, {
      onConflict: 'date,location_id,source,account_id'
    });
    if (error) throw error;
    inserted += chunk.length;
  }

  return inserted;
};

const upsertAdsetRows = async (rows: InsightRow[], locationId: string, syncedAt: string) => {
  if (rows.length === 0) return 0;

  const payload = rows
    .filter((row) => row?.date_start && row?.adset_id)
    .map((row) => ({
      date: row.date_start,
      location_id: locationId,
      source: env.META_SOURCE_NAME,
      account_id: row.account_id ?? normalizeAccountId(env.META_AD_ACCOUNT_ID),
      campaign_id: row.campaign_id ?? null,
      campaign_name: row.campaign_name ?? null,
      adset_id: row.adset_id ?? '',
      adset_name: row.adset_name ?? null,
      spend: parseNumberValue(row.spend),
      leads: sumLeadActions(row.actions),
      currency: row.account_currency ?? null,
      raw: row,
      synced_at: syncedAt
    }));

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('marketing_spend_adset_daily').upsert(chunk, {
      onConflict: 'date,location_id,source,account_id,adset_id'
    });
    if (error) throw error;
    inserted += chunk.length;
  }

  return inserted;
};

const upsertAdRows = async (rows: InsightRow[], locationId: string, syncedAt: string) => {
  if (rows.length === 0) return 0;

  const payload = rows
    .filter((row) => row?.date_start && row?.ad_id)
    .map((row) => ({
      date: row.date_start,
      location_id: locationId,
      source: env.META_SOURCE_NAME,
      account_id: row.account_id ?? normalizeAccountId(env.META_AD_ACCOUNT_ID),
      campaign_id: row.campaign_id ?? null,
      campaign_name: row.campaign_name ?? null,
      adset_id: row.adset_id ?? null,
      adset_name: row.adset_name ?? null,
      ad_id: row.ad_id ?? '',
      ad_name: row.ad_name ?? null,
      spend: parseNumberValue(row.spend),
      leads: sumLeadActions(row.actions),
      currency: row.account_currency ?? null,
      raw: row,
      synced_at: syncedAt
    }));

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('marketing_spend_ad_daily').upsert(chunk, {
      onConflict: 'date,location_id,source,account_id,ad_id'
    });
    if (error) throw error;
    inserted += chunk.length;
  }

  return inserted;
};

Deno.serve(async (req) => {
  if (env.META_SYNC_SECRET) {
    const authHeader = req.headers.get('authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const syncHeader = req.headers.get('x-sync-secret') ?? '';

    if (bearer !== env.META_SYNC_SECRET && syncHeader !== env.META_SYNC_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { lookbackDays, endOffsetDays } = await parseConfig(req);
    const today = formatDateInTimeZone(new Date(), env.META_TIMEZONE);
    const endDate = shiftDate(today, -endOffsetDays);
    const startDate = shiftDate(endDate, -(lookbackDays - 1));

    const locationId = await resolveLocationId();
    if (!locationId) {
      throw new Error('Missing location_id. Set META_LOCATION_ID or fill dashboard_config.id=1.');
    }

    const accountId = normalizeAccountId(env.META_AD_ACCOUNT_ID);
    const syncedAt = new Date().toISOString();
    const insights = await fetchAllInsights(accountId, startDate, endDate, 'account');
    const upserted = await upsertSpendRows(insights, locationId, syncedAt);

    let adsetInsights: InsightRow[] = [];
    let adsetUpserted = 0;
    if (env.META_FETCH_ADSET) {
      adsetInsights = await fetchAllInsights(accountId, startDate, endDate, 'adset');
      adsetUpserted = await upsertAdsetRows(adsetInsights, locationId, syncedAt);
    }

    let adInsights: InsightRow[] = [];
    let adUpserted = 0;
    if (env.META_FETCH_AD) {
      adInsights = await fetchAllInsights(accountId, startDate, endDate, 'ad');
      adUpserted = await upsertAdRows(adInsights, locationId, syncedAt);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        range: { start: startDate, end: endDate },
        rows: insights.length,
        upserted,
        adset: env.META_FETCH_ADSET ? { rows: adsetInsights.length, upserted: adsetUpserted } : null,
        ad: env.META_FETCH_AD ? { rows: adInsights.length, upserted: adUpserted } : null
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
