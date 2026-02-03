import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type GoogleRow = {
  segments?: { date?: string };
  metrics?: {
    cost_micros?: string | number;
    costMicros?: string | number;
    conversions?: string | number;
  };
  customer?: {
    id?: string | number;
    currency_code?: string;
    currencyCode?: string;
  };
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

const normalizeApiVersion = (value: string | undefined, fallback: string) => {
  const cleaned = (value ?? '').trim().replace(/^['"]|['"]$/g, '');
  const digits = cleaned.replace(/\D/g, '');
  const fallbackDigits = fallback.replace(/\D/g, '');
  if (!digits) {
    return `v${fallbackDigits || '16'}`;
  }
  return `v${digits}`;
};

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',

  GOOGLE_ADS_DEVELOPER_TOKEN: required('GOOGLE_ADS_DEVELOPER_TOKEN'),
  GOOGLE_ADS_CLIENT_ID: required('GOOGLE_ADS_CLIENT_ID'),
  GOOGLE_ADS_CLIENT_SECRET: required('GOOGLE_ADS_CLIENT_SECRET'),
  GOOGLE_ADS_REFRESH_TOKEN: required('GOOGLE_ADS_REFRESH_TOKEN'),
  GOOGLE_ADS_CUSTOMER_ID: required('GOOGLE_ADS_CUSTOMER_ID'),
  GOOGLE_ADS_LOGIN_CUSTOMER_ID: Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID') ?? '',
  GOOGLE_ADS_API_VERSION: normalizeApiVersion(Deno.env.get('GOOGLE_ADS_API_VERSION'), 'v16'),
  GOOGLE_SOURCE_NAME: optional('GOOGLE_SOURCE_NAME', 'Google Ads'),
  GOOGLE_LOCATION_ID: Deno.env.get('GOOGLE_LOCATION_ID') ?? '',
  GOOGLE_TIMEZONE: optional('GOOGLE_TIMEZONE', 'Europe/Brussels'),
  GOOGLE_LOOKBACK_DAYS: parseNumber(Deno.env.get('GOOGLE_LOOKBACK_DAYS'), 7),
  GOOGLE_END_OFFSET_DAYS: parseNumber(Deno.env.get('GOOGLE_END_OFFSET_DAYS'), 1)
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

const normalizeCustomerId = (value: string) => value.replace(/[^\d]/g, '');

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
  let lookbackDays = parseNumber(url.searchParams.get('lookback_days'), env.GOOGLE_LOOKBACK_DAYS);
  let endOffsetDays = parseNumber(url.searchParams.get('end_offset_days'), env.GOOGLE_END_OFFSET_DAYS);

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

const readJsonResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 300);
    throw new Error(
      `Google Ads API returned non-JSON response (status ${response.status} ${response.statusText}). Snippet: ${snippet}`
    );
  }
};

const getAccessToken = async () => {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const payload = await readJsonResponse(response);
  if (!response.ok || payload?.error) {
    const message = payload?.error_description ?? payload?.error ?? response.statusText;
    throw new Error(`Google OAuth error: ${message}`);
  }

  const token = payload?.access_token;
  if (!token) throw new Error('Google OAuth error: missing access_token.');
  return token as string;
};

const buildQuery = (startDate: string, endDate: string) => `
  SELECT
    segments.date,
    customer.id,
    customer.currency_code,
    metrics.cost_micros,
    metrics.conversions
  FROM customer
  WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
`;

const fetchSearchStream = async (
  accessToken: string,
  customerId: string,
  query: string,
  apiVersion: string
) => {
  const url = `https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:searchStream`;
  const body: Record<string, unknown> = { query };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
    'Content-Type': 'application/json',
    'User-Agent': 'google-sync/1.0'
  };

  if (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID) {
    headers['login-customer-id'] = normalizeCustomerId(env.GOOGLE_ADS_LOGIN_CUSTOMER_ID);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (response.status === 404) {
    const snippet = (await response.text()).replace(/\s+/g, ' ').trim().slice(0, 300);
    const error = new Error(
      `Google Ads API returned 404 for ${apiVersion}. Snippet: ${snippet}`
    ) as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const payload = await readJsonResponse(response);
  if (!response.ok || payload?.error) {
    const message = payload?.error?.message ?? response.statusText;
    throw new Error(`Google Ads API error: ${message}`);
  }

  const responses = Array.isArray(payload) ? payload : [payload];
  const results: GoogleRow[] = [];
  responses.forEach((entry) => {
    if (Array.isArray(entry?.results)) {
      results.push(...(entry.results as GoogleRow[]));
    }
  });

  return results;
};

const buildVersionCandidates = (baseVersion: string, span = 3) => {
  const baseNumber = Number(baseVersion.replace(/\D/g, '')) || 16;
  const candidates: number[] = [baseNumber];
  for (let step = 1; step <= span; step += 1) {
    candidates.push(baseNumber + step, baseNumber - step);
  }
  return candidates
    .filter((value, index) => value > 0 && candidates.indexOf(value) === index)
    .map((value) => `v${value}`);
};

const fetchAllRows = async (accessToken: string, customerId: string, startDate: string, endDate: string) => {
  const query = buildQuery(startDate, endDate);
  const versions = buildVersionCandidates(env.GOOGLE_ADS_API_VERSION, 3);

  let lastError: Error | null = null;
  for (const version of versions) {
    try {
      return await fetchSearchStream(accessToken, customerId, query, version);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(message);
      if (status === 404 || message.includes('returned 404')) {
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error('Google Ads API returned 404 for all tested versions.');
};

const resolveLocationId = async () => {
  if (env.GOOGLE_LOCATION_ID) return env.GOOGLE_LOCATION_ID;
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('location_id')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data?.location_id ?? '';
};

const parseCostMicros = (row: GoogleRow) =>
  parseNumber(String(row.metrics?.cost_micros ?? row.metrics?.costMicros ?? 0), 0);

const parseConversions = (row: GoogleRow) =>
  parseNumber(String(row.metrics?.conversions ?? 0), 0);

const resolveCurrency = (row: GoogleRow) =>
  row.customer?.currency_code ?? row.customer?.currencyCode ?? null;

const resolveAccountId = (row: GoogleRow, fallback: string) => {
  const id = row.customer?.id;
  return id === undefined || id === null ? fallback : String(id);
};

const upsertSpendRows = async (rows: GoogleRow[], locationId: string, customerId: string, syncedAt: string) => {
  if (rows.length === 0) return 0;

  const aggregated = new Map<string, { spend: number; leads: number; currency: string | null; raw: GoogleRow[]; accountId: string }>();

  rows.forEach((row) => {
    const date = row.segments?.date;
    if (!date) return;

    const spend = parseCostMicros(row) / 1_000_000;
    const leads = parseConversions(row);
    const currency = resolveCurrency(row);
    const accountId = resolveAccountId(row, customerId);

    const existing = aggregated.get(date) ?? {
      spend: 0,
      leads: 0,
      currency: currency ?? null,
      raw: [],
      accountId
    };

    existing.spend += spend;
    existing.leads += leads;
    if (!existing.currency && currency) existing.currency = currency;
    existing.raw.push(row);
    aggregated.set(date, existing);
  });

  const payload = Array.from(aggregated.entries()).map(([date, entry]) => ({
    date,
    location_id: locationId,
    source: env.GOOGLE_SOURCE_NAME,
    account_id: entry.accountId,
    spend: entry.spend,
    leads: entry.leads,
    currency: entry.currency,
    raw: entry.raw.length === 1 ? entry.raw[0] : { rows: entry.raw },
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

Deno.serve(async (req) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { lookbackDays, endOffsetDays } = await parseConfig(req);
    const today = formatDateInTimeZone(new Date(), env.GOOGLE_TIMEZONE);
    const endDate = shiftDate(today, -endOffsetDays);
    const startDate = shiftDate(endDate, -(lookbackDays - 1));

    const locationId = await resolveLocationId();
    if (!locationId) {
      throw new Error('Missing location_id. Set GOOGLE_LOCATION_ID or fill dashboard_config.id=1.');
    }

    const customerId = normalizeCustomerId(env.GOOGLE_ADS_CUSTOMER_ID);
    if (!customerId) {
      throw new Error('Invalid GOOGLE_ADS_CUSTOMER_ID.');
    }

    const accessToken = await getAccessToken();
    const rows = await fetchAllRows(accessToken, customerId, startDate, endDate);
    const syncedAt = new Date().toISOString();
    const upserted = await upsertSpendRows(rows, locationId, customerId, syncedAt);

    return new Response(
      JSON.stringify({
        ok: true,
        range: { start: startDate, end: endDate },
        rows: rows.length,
        upserted
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
