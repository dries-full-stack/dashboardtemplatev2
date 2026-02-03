import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Papa from 'https://esm.sh/papaparse@5.4.1';

type CsvRow = Record<string, unknown>;

type RequestConfig = {
  lookbackDays: number | null;
  endOffsetDays: number | null;
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

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',

  SHEET_CSV_URL: required('SHEET_CSV_URL'),
  SHEET_LOCATION_ID: Deno.env.get('SHEET_LOCATION_ID') ?? '',
  SHEET_SOURCE_NAME: optional('SHEET_SOURCE_NAME', 'Google Ads'),
  SHEET_ACCOUNT_ID: optional('SHEET_ACCOUNT_ID', 'google-ads-sheet'),
  SHEET_DATE_COLUMN: optional('SHEET_DATE_COLUMN', 'Date'),
  SHEET_COST_COLUMN: optional('SHEET_COST_COLUMN', 'Cost'),
  SHEET_CONVERSIONS_COLUMN: optional('SHEET_CONVERSIONS_COLUMN', 'Conversions'),
  SHEET_CURRENCY_COLUMN: optional('SHEET_CURRENCY_COLUMN', 'Currency'),
  SHEET_ACCOUNT_COLUMN: optional('SHEET_ACCOUNT_COLUMN', 'Account ID'),
  SHEET_CAMPAIGN_COLUMN: optional('SHEET_CAMPAIGN_COLUMN', 'Campaign'),
  SHEET_DATE_FORMAT: optional('SHEET_DATE_FORMAT', 'YYYY-MM-DD'),
  SHEET_CURRENCY_FALLBACK: optional('SHEET_CURRENCY_FALLBACK', ''),
  SHEET_HEADER_ROW: parseNumber(Deno.env.get('SHEET_HEADER_ROW'), 0)
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

const saveSyncState = async (entity: string, locationId: string, lastSyncedAt: string) => {
  const { error } = await supabase
    .from('sync_state')
    .upsert(
      {
        entity,
        location_id: locationId,
        cursor: null,
        last_synced_at: lastSyncedAt,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'entity,location_id' }
    );
  if (error) throw error;
};

const normalizeKey = (value: unknown) => String(value ?? '').trim().toLowerCase();

const pad2 = (value: number | string) => String(value).padStart(2, '0');

const resolveMonthNumber = (value: string) => {
  const cleaned = value.trim().toLowerCase();
  const map: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    maart: 3,
    march: 3,
    mrt: 3,
    apr: 4,
    april: 4,
    may: 5,
    mei: 5,
    jun: 6,
    juni: 6,
    jul: 7,
    juli: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    okt: 10,
    october: 10,
    oct: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };

  if (map[cleaned]) return map[cleaned];
  const short = cleaned.slice(0, 3);
  return map[short] ?? null;
};

const parseNumberFlexible = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  let cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    cleaned = cleaned.replace(',', '.');
  }

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const parseDateValue = (value: unknown) => {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const format = env.SHEET_DATE_FORMAT.toUpperCase();
  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dashMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);

  const match = slashMatch ?? dashMatch;
  if (match) {
    const part1 = match[1];
    const part2 = match[2];
    const year = match[3];
    const isMonthFirst = format.startsWith('MM');
    const month = isMonthFirst ? part1 : part2;
    const day = isMonthFirst ? part2 : part1;
    return `${year}-${month}-${day}`;
  }

  const monthNameMatch = raw.replace(',', '').match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (monthNameMatch) {
    const day = Number(monthNameMatch[1]);
    const monthName = monthNameMatch[2];
    const year = monthNameMatch[3];
    const month = resolveMonthNumber(monthName);
    if (month) {
      return `${year}-${pad2(month)}-${pad2(day)}`;
    }
  }

  return null;
};

const parseConfig = async (req: Request): Promise<RequestConfig> => {
  const url = new URL(req.url);
  const lookbackRaw = url.searchParams.get('lookback_days');
  const endOffsetRaw = url.searchParams.get('end_offset_days');

  let lookbackDays: number | null = lookbackRaw ? parseNumber(lookbackRaw, 0) : null;
  let endOffsetDays: number | null = endOffsetRaw ? parseNumber(endOffsetRaw, 0) : null;

  if (req.method !== 'GET') {
    try {
      const body = await req.json();
      if (body?.lookback_days !== undefined) {
        lookbackDays = parseNumber(body.lookback_days, 0);
      }
      if (body?.end_offset_days !== undefined) {
        endOffsetDays = parseNumber(body.end_offset_days, 0);
      }
    } catch {
      // ignore body parse errors
    }
  }

  return {
    lookbackDays: lookbackDays && lookbackDays > 0 ? Math.floor(lookbackDays) : null,
    endOffsetDays: endOffsetDays && endOffsetDays >= 0 ? Math.floor(endOffsetDays) : null
  };
};

const resolveLocationId = async () => {
  if (env.SHEET_LOCATION_ID) return env.SHEET_LOCATION_ID;
  const { data, error } = await supabase
    .from('dashboard_config')
    .select('location_id')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data?.location_id ?? '';
};

const buildRowsFromMatrix = (matrix: string[][], headerIndex: number) => {
  if (headerIndex < 0 || headerIndex >= matrix.length) return [];
  const headers = matrix[headerIndex] ?? [];
  const rows = matrix.slice(headerIndex + 1);
  return rows.map((row) => {
    const record: CsvRow = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? '';
    });
    return record;
  });
};

const detectHeaderIndex = (matrix: string[][]) => {
  if (env.SHEET_HEADER_ROW && env.SHEET_HEADER_ROW > 0) {
    const index = Math.floor(env.SHEET_HEADER_ROW - 1);
    if (index >= 0 && index < matrix.length) return index;
  }

  const expectedDate = normalizeKey(env.SHEET_DATE_COLUMN);
  const expectedCost = normalizeKey(env.SHEET_COST_COLUMN);

  for (let i = 0; i < matrix.length; i += 1) {
    const row = matrix[i] ?? [];
    const normalized = row.map((cell) => normalizeKey(cell));
    if (normalized.includes(expectedDate) && normalized.includes(expectedCost)) {
      return i;
    }
  }

  return -1;
};

const readCsv = async () => {
  const response = await fetch(env.SHEET_CSV_URL);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch CSV (${response.status}): ${text.slice(0, 200)}`);
  }
  const csvText = await response.text();
  const matrixParsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true
  });

  if (matrixParsed.errors?.length) {
    const message = matrixParsed.errors.map((err) => err.message).join('; ');
    throw new Error(`CSV parse error: ${message}`);
  }

  const matrix = (matrixParsed.data ?? []) as string[][];
  const headerIndex = detectHeaderIndex(matrix);
  if (headerIndex >= 0) {
    return buildRowsFromMatrix(matrix, headerIndex);
  }

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true
  });

  if (parsed.errors?.length) {
    const message = parsed.errors.map((err) => err.message).join('; ');
    throw new Error(`CSV parse error: ${message}`);
  }

  return parsed.data ?? [];
};

const filterByRange = (rows: CsvRow[], range: { start: string; end: string } | null) => {
  if (!range) return rows;
  return rows.filter((row) => {
    const accessor = buildRowAccessor(row);
    const dateValue = parseDateValue(accessor(env.SHEET_DATE_COLUMN));
    if (!dateValue) return false;
    return dateValue >= range.start && dateValue <= range.end;
  });
};

const buildRowAccessor = (row: CsvRow) => {
  const map = new Map<string, unknown>();
  Object.entries(row ?? {}).forEach(([key, value]) => {
    map.set(normalizeKey(key), value);
  });
  return (columnName: string) => map.get(normalizeKey(columnName));
};

const buildRange = (lookbackDays: number | null, endOffsetDays: number | null) => {
  if (!lookbackDays || lookbackDays <= 0) return null;
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const endOffset = endOffsetDays ?? 0;
  end.setUTCDate(end.getUTCDate() - endOffset);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (lookbackDays - 1));
  const toIso = (value: Date) => value.toISOString().slice(0, 10);
  return { start: toIso(start), end: toIso(end) };
};

const upsertSpendRows = async (
  rows: CsvRow[],
  locationId: string,
  range: { start: string; end: string } | null,
  syncedAt: string
) => {
  const aggregated = new Map<
    string,
    { spend: number; leads: number; currency: string | null; raw: CsvRow[]; accountId: string }
  >();
  const campaignAggregated = new Map<
    string,
    {
      spend: number;
      leads: number;
      currency: string | null;
      raw: CsvRow[];
      accountId: string;
      campaignId: string;
      campaignName: string;
    }
  >();

  const filtered = filterByRange(rows, range);

  filtered.forEach((row) => {
    const accessor = buildRowAccessor(row);
    const date = parseDateValue(accessor(env.SHEET_DATE_COLUMN));
    if (!date) return;

    const spend = parseNumberFlexible(accessor(env.SHEET_COST_COLUMN));
    const leads = parseNumberFlexible(accessor(env.SHEET_CONVERSIONS_COLUMN));
    const accountIdRaw = accessor(env.SHEET_ACCOUNT_COLUMN);
    const accountId = accountIdRaw ? String(accountIdRaw).trim() : env.SHEET_ACCOUNT_ID;
    const currencyRaw = accessor(env.SHEET_CURRENCY_COLUMN);
    const currency = currencyRaw ? String(currencyRaw).trim() : env.SHEET_CURRENCY_FALLBACK || null;
    const campaignRaw = accessor(env.SHEET_CAMPAIGN_COLUMN);
    const campaignName = campaignRaw ? String(campaignRaw).trim() : '';

    const key = `${date}|${accountId}`;
    const existing = aggregated.get(key) ?? {
      spend: 0,
      leads: 0,
      currency,
      raw: [],
      accountId
    };

    existing.spend += spend;
    existing.leads += leads;
    if (!existing.currency && currency) existing.currency = currency;
    existing.raw.push(row);
    aggregated.set(key, existing);

    if (campaignName) {
      const campaignKey = `${date}|${accountId}|${campaignName}`;
      const campaignExisting = campaignAggregated.get(campaignKey) ?? {
        spend: 0,
        leads: 0,
        currency,
        raw: [],
        accountId,
        campaignId: campaignName,
        campaignName
      };

      campaignExisting.spend += spend;
      campaignExisting.leads += leads;
      if (!campaignExisting.currency && currency) campaignExisting.currency = currency;
      campaignExisting.raw.push(row);
      campaignAggregated.set(campaignKey, campaignExisting);
    }
  });

  const payload = Array.from(aggregated.entries()).map(([key, entry]) => {
    const [date] = key.split('|');
    return {
      date,
      location_id: locationId,
      source: env.SHEET_SOURCE_NAME,
      account_id: entry.accountId,
      spend: entry.spend,
      leads: entry.leads,
      currency: entry.currency,
      raw: entry.raw.length === 1 ? entry.raw[0] : { rows: entry.raw },
      synced_at: syncedAt
    };
  });

  const campaignPayload = Array.from(campaignAggregated.entries()).map(([key, entry]) => {
    const [date] = key.split('|');
    return {
      date,
      location_id: locationId,
      source: env.SHEET_SOURCE_NAME,
      account_id: entry.accountId,
      campaign_id: entry.campaignId,
      campaign_name: entry.campaignName,
      spend: entry.spend,
      leads: entry.leads,
      currency: entry.currency,
      raw: entry.raw.length === 1 ? entry.raw[0] : { rows: entry.raw },
      synced_at: syncedAt
    };
  });

  if (!payload.length && !campaignPayload.length) return { daily: 0, campaigns: 0 };

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

  let campaignInserted = 0;
  for (let i = 0; i < campaignPayload.length; i += chunkSize) {
    const chunk = campaignPayload.slice(i, i + chunkSize);
    const { error } = await supabase.from('marketing_spend_campaign_daily').upsert(chunk, {
      onConflict: 'date,location_id,source,account_id,campaign_id'
    });
    if (error) throw error;
    campaignInserted += chunk.length;
  }

  return { daily: inserted, campaigns: campaignInserted };
};

Deno.serve(async (req) => {
  if (!['GET', 'POST'].includes(req.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { lookbackDays, endOffsetDays } = await parseConfig(req);
    const range = buildRange(lookbackDays, endOffsetDays);
    const locationId = await resolveLocationId();
    if (!locationId) {
      throw new Error('Missing location_id. Set SHEET_LOCATION_ID or fill dashboard_config.id=1.');
    }

    const rows = await readCsv();
    const syncedAt = new Date().toISOString();
    const upserted = await upsertSpendRows(rows, locationId, range, syncedAt);
    await saveSyncState('google_sheet', locationId, syncedAt);

    return new Response(
      JSON.stringify({
        ok: true,
        rows: rows.length,
        range,
        upserted_daily: upserted.daily,
        upserted_campaigns: upserted.campaigns
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
