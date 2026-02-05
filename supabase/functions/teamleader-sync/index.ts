import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type SyncState = {
  entity: string;
  location_id: string;
  cursor: Record<string, unknown> | null;
  last_synced_at: string | null;
  updated_at: string | null;
};

type TeamleaderIntegration = {
  location_id: string;
  access_token: string;
  refresh_token: string;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
};

type ListResponse<T> = {
  data?: T[];
  meta?: Record<string, unknown>;
};

type RequestOptions = {
  path: string;
  body: Record<string, unknown>;
};

const required = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (key: string, fallback: string) => {
  const value = Deno.env.get(key);
  return value && value.length > 0 ? value : fallback;
};

const parseNumber = (key: string, fallback: number) => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid number for env var ${key}: ${raw}`);
  return value;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  TEAMLEADER_BASE_URL: optional('TEAMLEADER_BASE_URL', 'https://api.focus.teamleader.eu').replace(/\/$/, ''),
  TEAMLEADER_CLIENT_ID: required('TEAMLEADER_CLIENT_ID'),
  TEAMLEADER_CLIENT_SECRET: required('TEAMLEADER_CLIENT_SECRET'),
  TEAMLEADER_PAGE_SIZE: clamp(parseNumber('TEAMLEADER_PAGE_SIZE', 50), 1, 100),
  TEAMLEADER_UPSERT_BATCH_SIZE: clamp(parseNumber('TEAMLEADER_UPSERT_BATCH_SIZE', 200), 1, 500),
  LOOKBACK_MONTHS: parseNumber('TEAMLEADER_LOOKBACK_MONTHS', 12),
  SYNC_OVERLAP_MINUTES: parseNumber('SYNC_OVERLAP_MINUTES', 60),
  TOKEN_REFRESH_BUFFER_MINUTES: parseNumber('TOKEN_REFRESH_BUFFER_MINUTES', 5),
  REQUEST_TIMEOUT_MS: parseNumber('REQUEST_TIMEOUT_MS', 30000),
  MAX_RETRIES: parseNumber('MAX_RETRIES', 5),
  RETRY_BASE_DELAY_MS: parseNumber('RETRY_BASE_DELAY_MS', 1000),
  SYNC_SECRET: Deno.env.get('SYNC_SECRET') ?? ''
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const toDateString = (value: Date) => value.toISOString().slice(0, 10);
const toOffsetDateTime = (value: Date) => value.toISOString().replace(/\.\d{3}Z$/, '+00:00');

const computeCutoff = (months: number) => {
  const cutoff = new Date();
  cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
  return cutoff;
};

const parseIso = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const pickPrimary = (items: unknown, key: string) => {
  if (!Array.isArray(items)) return null;
  const primary = items.find((item) => item && typeof item === 'object' && (item as Record<string, unknown>).type === 'primary');
  const primaryValue = primary && typeof primary === 'object' ? (primary as Record<string, unknown>)[key] : null;
  if (primaryValue) return String(primaryValue);
  const fallback = items.find((item) => item && typeof item === 'object' && (item as Record<string, unknown>)[key]);
  const fallbackValue = fallback && typeof fallback === 'object' ? (fallback as Record<string, unknown>)[key] : null;
  return fallbackValue ? String(fallbackValue) : null;
};

const parseMoney = (value: Record<string, unknown> | null | undefined) => {
  if (!value || typeof value !== 'object') return { amount: null as number | null, currency: null as string | null };
  const amount = typeof value.amount === 'number' ? value.amount : null;
  const currency = typeof value.currency === 'string' ? value.currency : null;
  return { amount, currency };
};

class TeamleaderClient {
  private accessToken: string;

  constructor(
    private readonly baseUrl: string,
    accessToken: string,
    private readonly refreshToken?: () => Promise<string>
  ) {
    this.accessToken = accessToken;
  }

  setToken(token: string) {
    this.accessToken = token;
  }

  async request<T>({ path, body }: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    let refreshed = false;

    for (let attempt = 0; attempt <= env.MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          return (await response.json()) as T;
        }

        if (response.status === 401 && this.refreshToken && !refreshed) {
          refreshed = true;
          const newToken = await this.refreshToken();
          this.accessToken = newToken;
          continue;
        }

        const retryable = response.status === 429 || response.status >= 500;
        const errorBody = await response.text();

        if (!retryable || attempt >= env.MAX_RETRIES) {
          throw new Error(`Teamleader API ${response.status} ${response.statusText}: ${errorBody}`);
        }

        const retryAfter = Number(response.headers.get('retry-after'));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : env.RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);
        await sleep(backoff);
      } catch (error) {
        clearTimeout(timeout);
        if (attempt >= env.MAX_RETRIES) throw error;
        await sleep(env.RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250));
      }
    }

    throw new Error('Teamleader request failed after retries.');
  }
}

const getSyncState = async (entity: string, locationId: string): Promise<SyncState | null> => {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('entity', entity)
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) throw error;
  return data as SyncState | null;
};

const saveSyncState = async (entity: string, locationId: string, lastSyncedAt: string) => {
  const payload = {
    entity,
    location_id: locationId,
    last_synced_at: lastSyncedAt,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('sync_state').upsert(payload, {
    onConflict: 'entity,location_id'
  });

  if (error) throw error;
};

const refreshAccessToken = async (integration: TeamleaderIntegration): Promise<TeamleaderIntegration> => {
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', integration.refresh_token);
  body.set('client_id', env.TEAMLEADER_CLIENT_ID);
  body.set('client_secret', env.TEAMLEADER_CLIENT_SECRET);

  const response = await fetch('https://app.teamleader.eu/oauth2/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Teamleader token: ${errorText}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number | string;
    token_type?: string;
    scope?: string;
  };

  if (!data.access_token) {
    throw new Error('Refresh token response missing access_token.');
  }

  const expiresIn = Number(data.expires_in);
  const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null;

  const updated: TeamleaderIntegration = {
    ...integration,
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? integration.refresh_token,
    token_type: data.token_type ?? integration.token_type,
    scope: data.scope ?? integration.scope,
    expires_at: expiresAt ?? integration.expires_at
  };

  const { error } = await supabase
    .from('teamleader_integrations')
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      token_type: updated.token_type,
      scope: updated.scope,
      expires_at: updated.expires_at
    })
    .eq('location_id', integration.location_id);

  if (error) throw error;

  return updated;
};

const ensureValidToken = async (integration: TeamleaderIntegration): Promise<TeamleaderIntegration> => {
  const bufferMs = env.TOKEN_REFRESH_BUFFER_MINUTES * 60 * 1000;
  const expiresAt = parseIso(integration.expires_at);
  if (!expiresAt) return integration;
  if (expiresAt.getTime() - Date.now() <= bufferMs) {
    return await refreshAccessToken(integration);
  }
  return integration;
};

const buildSinceDate = (state: SyncState | null, cutoff: Date) => {
  const overlapMs = env.SYNC_OVERLAP_MINUTES * 60 * 1000;
  if (!state?.last_synced_at) return toDateString(cutoff);
  const last = parseIso(state.last_synced_at);
  if (!last) return toDateString(cutoff);
  const since = new Date(last.getTime() - overlapMs);
  return toDateString(since < cutoff ? cutoff : since);
};

const buildSinceDateTime = (state: SyncState | null, cutoff: Date) => {
  const overlapMs = env.SYNC_OVERLAP_MINUTES * 60 * 1000;
  if (!state?.last_synced_at) return toOffsetDateTime(cutoff);
  const last = parseIso(state.last_synced_at);
  if (!last) return toOffsetDateTime(cutoff);
  const since = new Date(last.getTime() - overlapMs);
  return toOffsetDateTime(since < cutoff ? cutoff : since);
};

const isUpdatedSinceError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('filter.updated_since');
};

const paginateWithUpdatedSince = async <T>(
  client: TeamleaderClient,
  path: string,
  baseBody: Record<string, unknown>,
  sinceDate: string,
  sinceDateTime: string,
  onPage: (items: T[], meta?: Record<string, unknown>) => Promise<void>
) => {
  const baseFilter = (baseBody.filter ?? {}) as Record<string, unknown>;
  const bodyWithDate = {
    ...baseBody,
    filter: {
      ...baseFilter,
      updated_since: sinceDate
    }
  };

  try {
    await paginate<T>(client, path, bodyWithDate, onPage);
  } catch (error) {
    if (!isUpdatedSinceError(error)) throw error;
    const bodyWithDateTime = {
      ...baseBody,
      filter: {
        ...baseFilter,
        updated_since: sinceDateTime
      }
    };
    await paginate<T>(client, path, bodyWithDateTime, onPage);
  }
};

const upsertRows = async (table: string, rows: Record<string, unknown>[]) => {
  if (!rows.length) return;
  for (const group of chunk(rows, env.TEAMLEADER_UPSERT_BATCH_SIZE)) {
    const { error } = await supabase.from(table).upsert(group, { onConflict: 'id,location_id' });
    if (error) throw error;
  }
};

const fetchPage = async <T>(
  client: TeamleaderClient,
  options: RequestOptions
): Promise<ListResponse<T>> => {
  return await client.request<ListResponse<T>>(options);
};

const paginate = async <T>(
  client: TeamleaderClient,
  path: string,
  baseBody: Record<string, unknown>,
  onPage: (items: T[], meta?: Record<string, unknown>) => Promise<void>
) => {
  let page = 1;
  while (true) {
    const body = {
      ...baseBody,
      page: {
        size: env.TEAMLEADER_PAGE_SIZE,
        number: page
      }
    };
    const response = await fetchPage<T>(client, { path, body });
    const data = Array.isArray(response.data) ? response.data : [];
    await onPage(data, response.meta);
    if (data.length < env.TEAMLEADER_PAGE_SIZE) break;
    page += 1;
  }
};

const syncUsers = async (client: TeamleaderClient, locationId: string, syncedAt: string) => {
  const rows: Record<string, unknown>[] = [];
  await paginate<Record<string, unknown>>(client, '/users.list', {
    filter: { status: ['active', 'deactivated'] }
  }, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      rows.push({
        id,
        location_id: locationId,
        first_name: item.first_name ?? null,
        last_name: item.last_name ?? null,
        email: item.email ?? null,
        phone: pickPrimary(item.telephones, 'number'),
        status: item.status ?? null,
        function: item.function ?? null,
        language: item.language ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_users', rows);
  await saveSyncState('teamleader_users', locationId, syncedAt);
};

const syncContacts = async (client: TeamleaderClient, locationId: string, cutoff: Date) => {
  const state = await getSyncState('teamleader_contacts', locationId);
  const sinceDate = buildSinceDate(state, cutoff);
  const sinceDateTime = buildSinceDateTime(state, cutoff);
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  await paginateWithUpdatedSince<Record<string, unknown>>(client, '/contacts.list', {
    filter: {},
    includes: 'custom_fields'
  }, sinceDate, sinceDateTime, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      rows.push({
        id,
        location_id: locationId,
        first_name: item.first_name ?? null,
        last_name: item.last_name ?? null,
        email: pickPrimary(item.emails, 'email'),
        phone: pickPrimary(item.telephones, 'number'),
        status: item.status ?? null,
        tags: Array.isArray(item.tags) ? item.tags : null,
        created_at: item.added_at ?? null,
        updated_at: item.updated_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_contacts', rows);
  await saveSyncState('teamleader_contacts', locationId, syncedAt);
};

const syncCompanies = async (client: TeamleaderClient, locationId: string, cutoff: Date) => {
  const state = await getSyncState('teamleader_companies', locationId);
  const sinceDate = buildSinceDate(state, cutoff);
  const sinceDateTime = buildSinceDateTime(state, cutoff);
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  await paginateWithUpdatedSince<Record<string, unknown>>(client, '/companies.list', {
    filter: {},
    includes: 'custom_fields'
  }, sinceDate, sinceDateTime, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      rows.push({
        id,
        location_id: locationId,
        name: item.name ?? null,
        status: item.status ?? null,
        email: pickPrimary(item.emails, 'email'),
        phone: pickPrimary(item.telephones, 'number'),
        vat_number: item.vat_number ?? null,
        tags: Array.isArray(item.tags) ? item.tags : null,
        created_at: item.added_at ?? null,
        updated_at: item.updated_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_companies', rows);
  await saveSyncState('teamleader_companies', locationId, syncedAt);
};

const syncDealPipelines = async (client: TeamleaderClient, locationId: string) => {
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];
  let defaultPipelineId: string | null = null;

  await paginate<Record<string, unknown>>(client, '/dealPipelines.list', {}, async (items, meta) => {
    if (meta && typeof meta.default === 'string') {
      defaultPipelineId = meta.default;
    }
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      rows.push({
        id,
        location_id: locationId,
        name: item.name ?? null,
        is_default: defaultPipelineId ? defaultPipelineId === id : false,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_deal_pipelines', rows);
  await saveSyncState('teamleader_deal_pipelines', locationId, syncedAt);
};

const syncDealPhases = async (client: TeamleaderClient, locationId: string) => {
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  await paginate<Record<string, unknown>>(client, '/dealPhases.list', {}, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      rows.push({
        id,
        location_id: locationId,
        name: item.name ?? null,
        probability: typeof item.probability === 'number' ? item.probability : null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_deal_phases', rows);
  await saveSyncState('teamleader_deal_phases', locationId, syncedAt);
};

const syncDeals = async (client: TeamleaderClient, locationId: string, cutoff: Date) => {
  const state = await getSyncState('teamleader_deals', locationId);
  const sinceDate = buildSinceDate(state, cutoff);
  const sinceDateTime = buildSinceDateTime(state, cutoff);
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];
  const quotationIds = new Set<string>();

  await paginateWithUpdatedSince<Record<string, unknown>>(client, '/deals.list', {
    filter: {},
    includes: 'custom_fields'
  }, sinceDate, sinceDateTime, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      const estimatedValue = parseMoney(item.estimated_value as Record<string, unknown> | null);
      const weightedValue = parseMoney(item.weighted_value as Record<string, unknown> | null);
      const lead = item.lead as Record<string, unknown> | undefined;
      const customer = lead?.customer as Record<string, unknown> | undefined;
      const contactPerson = lead?.contact_person as Record<string, unknown> | undefined;
      const responsible = item.responsible_user as Record<string, unknown> | undefined;
      const pipeline = item.pipeline as Record<string, unknown> | undefined;
      const phase = item.current_phase as Record<string, unknown> | undefined;

      rows.push({
        id,
        location_id: locationId,
        title: item.title ?? null,
        status: item.status ?? null,
        customer_type: customer?.type ?? null,
        customer_id: customer?.id ?? null,
        contact_person_id: contactPerson?.id ?? null,
        responsible_user_id: responsible?.id ?? null,
        pipeline_id: pipeline?.id ?? null,
        phase_id: phase?.id ?? null,
        estimated_value: estimatedValue.amount,
        estimated_value_currency: estimatedValue.currency,
        weighted_value: weightedValue.amount,
        weighted_value_currency: weightedValue.currency,
        estimated_closing_date: item.estimated_closing_date ?? null,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        closed_at: item.closed_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });

      if (Array.isArray(item.quotations)) {
        for (const quotation of item.quotations) {
          if (quotation && typeof quotation === 'object' && typeof quotation.id === 'string') {
            quotationIds.add(quotation.id);
          }
        }
      }
    }
  });

  await upsertRows('teamleader_deals', rows);
  await saveSyncState('teamleader_deals', locationId, syncedAt);

  return quotationIds;
};

const syncQuotations = async (
  client: TeamleaderClient,
  locationId: string,
  cutoff: Date,
  quotationIds: Set<string>
) => {
  const syncedAt = new Date().toISOString();
  const ids = Array.from(quotationIds);
  if (!ids.length) {
    await saveSyncState('teamleader_quotations', locationId, syncedAt);
    return;
  }

  const rows: Record<string, unknown>[] = [];
  for (const group of chunk(ids, env.TEAMLEADER_PAGE_SIZE)) {
    const response = await fetchPage<Record<string, unknown>>(client, {
      path: '/quotations.list',
      body: { filter: { ids: group } }
    });

    const data = Array.isArray(response.data) ? response.data : [];
    for (const item of data) {
      const id = item.id as string | undefined;
      if (!id) continue;
      const createdAt = parseIso(item.created_at as string | null);
      const updatedAt = parseIso(item.updated_at as string | null);
      const shouldKeep = (updatedAt ?? createdAt) ? (updatedAt ?? createdAt)! >= cutoff : true;
      if (!shouldKeep) continue;

      const totals = item.total as Record<string, unknown> | undefined;
      const taxExclusive = parseMoney(totals?.tax_exclusive as Record<string, unknown> | undefined);
      const taxInclusive = parseMoney(totals?.tax_inclusive as Record<string, unknown> | undefined);
      const deal = item.deal as Record<string, unknown> | undefined;

      rows.push({
        id,
        location_id: locationId,
        deal_id: deal?.id ?? null,
        status: item.status ?? null,
        name: item.name ?? null,
        total_tax_exclusive: taxExclusive.amount,
        total_tax_inclusive: taxInclusive.amount,
        currency: taxInclusive.currency ?? taxExclusive.currency,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  }

  await upsertRows('teamleader_quotations', rows);
  await saveSyncState('teamleader_quotations', locationId, syncedAt);
};

const syncInvoices = async (client: TeamleaderClient, locationId: string, cutoff: Date) => {
  const state = await getSyncState('teamleader_invoices', locationId);
  const sinceDate = buildSinceDate(state, cutoff);
  const sinceDateTime = buildSinceDateTime(state, cutoff);
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];

  await paginateWithUpdatedSince<Record<string, unknown>>(client, '/invoices.list', {
    filter: {
      invoice_date_after: toDateString(cutoff)
    }
  }, sinceDate, sinceDateTime, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      const totals = item.total as Record<string, unknown> | undefined;
      const taxExclusive = parseMoney(totals?.tax_exclusive as Record<string, unknown> | undefined);
      const taxInclusive = parseMoney(totals?.tax_inclusive as Record<string, unknown> | undefined);
      const deal = item.deal as Record<string, unknown> | undefined;

      rows.push({
        id,
        location_id: locationId,
        deal_id: deal?.id ?? null,
        status: item.status ?? null,
        invoice_number: item.invoice_number ?? null,
        invoice_date: item.invoice_date ?? null,
        due_on: item.due_on ?? null,
        total_tax_exclusive: taxExclusive.amount,
        total_tax_inclusive: taxInclusive.amount,
        currency: taxInclusive.currency ?? taxExclusive.currency,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_invoices', rows);
  await saveSyncState('teamleader_invoices', locationId, syncedAt);
};

const syncMeetings = async (client: TeamleaderClient, locationId: string, cutoff: Date) => {
  const syncedAt = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];
  const now = new Date();

  await paginate<Record<string, unknown>>(client, '/meetings.list', {
    filter: {
      start_date: toDateString(cutoff),
      end_date: toDateString(now)
    }
  }, async (items) => {
    for (const item of items) {
      const id = item.id as string | undefined;
      if (!id) continue;
      const scheduledAt = item.scheduled_at as string | null;
      const durationValue = item.duration && typeof item.duration === 'object'
        ? (item.duration as Record<string, unknown>).value
        : null;
      const durationMinutes = typeof durationValue === 'number' ? durationValue : null;
      const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
      const endTime = scheduledDate && durationMinutes !== null
        ? new Date(scheduledDate.getTime() + durationMinutes * 60 * 1000).toISOString()
        : null;
      const customer = item.customer as Record<string, unknown> | undefined;

      rows.push({
        id,
        location_id: locationId,
        title: item.title ?? null,
        description: item.description ?? null,
        customer_type: customer?.type ?? null,
        customer_id: customer?.id ?? null,
        scheduled_at: scheduledAt ?? null,
        duration_minutes: durationMinutes,
        end_time: endTime,
        created_at: item.created_at ?? null,
        raw_data: item,
        synced_at: syncedAt
      });
    }
  });

  await upsertRows('teamleader_meetings', rows);
  await saveSyncState('teamleader_meetings', locationId, syncedAt);
};

const parseRequestConfig = async (req: Request) => {
  const url = new URL(req.url);
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};

  const rawEntities = url.searchParams.get('entities') ?? body.entities;
  const entities = new Set<string>();
  const defaults = [
    'users',
    'contacts',
    'companies',
    'deal_pipelines',
    'deal_phases',
    'deals'
  ];

  if (!rawEntities) {
    defaults.forEach((item) => entities.add(item));
  } else if (Array.isArray(rawEntities)) {
    rawEntities.forEach((item) => entities.add(String(item)));
  } else if (typeof rawEntities === 'string') {
    rawEntities.split(',').map((item) => item.trim()).filter(Boolean).forEach((item) => entities.add(item));
  }

  const lookbackParam = url.searchParams.get('lookback_months') ?? body.lookback_months;
  const lookbackMonths = lookbackParam ? Number(lookbackParam) : env.LOOKBACK_MONTHS;

  const locationId = url.searchParams.get('location_id') ?? body.location_id ?? null;

  return {
    entities,
    lookbackMonths: Number.isFinite(lookbackMonths) && lookbackMonths > 0 ? lookbackMonths : env.LOOKBACK_MONTHS,
    locationId: locationId ? String(locationId) : null
  };
};

const loadIntegrations = async (locationId: string | null) => {
  let query = supabase
    .from('teamleader_integrations')
    .select('location_id, access_token, refresh_token, token_type, scope, expires_at');

  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TeamleaderIntegration[];
};

Deno.serve(async (req) => {
  if (env.SYNC_SECRET) {
    const authHeader = req.headers.get('authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const syncHeader = req.headers.get('x-sync-secret') ?? '';

    if (bearer !== env.SYNC_SECRET && syncHeader !== env.SYNC_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  if (!['GET', 'POST'].includes(req.method)) {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { entities, lookbackMonths, locationId } = await parseRequestConfig(req);
    if (entities.has('quotations')) {
      entities.add('deals');
    }

    const integrations = await loadIntegrations(locationId);
    if (!integrations.length) {
      return jsonResponse(200, { message: 'No Teamleader integrations found.' });
    }

    const results: Record<string, number> = {};
    const cutoff = computeCutoff(lookbackMonths);

    for (const integration of integrations) {
      let currentIntegration = await ensureValidToken(integration);
      const client = new TeamleaderClient(
        env.TEAMLEADER_BASE_URL,
        currentIntegration.access_token,
        async () => {
          currentIntegration = await refreshAccessToken(currentIntegration);
          return currentIntegration.access_token;
        }
      );

      if (entities.has('users')) {
        await syncUsers(client, integration.location_id, new Date().toISOString());
        results.users = (results.users ?? 0) + 1;
      }

      if (entities.has('contacts')) {
        await syncContacts(client, integration.location_id, cutoff);
        results.contacts = (results.contacts ?? 0) + 1;
      }

      if (entities.has('companies')) {
        await syncCompanies(client, integration.location_id, cutoff);
        results.companies = (results.companies ?? 0) + 1;
      }

      if (entities.has('deal_pipelines')) {
        await syncDealPipelines(client, integration.location_id);
        results.deal_pipelines = (results.deal_pipelines ?? 0) + 1;
      }

      if (entities.has('deal_phases')) {
        await syncDealPhases(client, integration.location_id);
        results.deal_phases = (results.deal_phases ?? 0) + 1;
      }

      let quotationIds = new Set<string>();
      if (entities.has('deals')) {
        quotationIds = await syncDeals(client, integration.location_id, cutoff);
        results.deals = (results.deals ?? 0) + 1;
      }

      if (entities.has('quotations')) {
        await syncQuotations(client, integration.location_id, cutoff, quotationIds);
        results.quotations = (results.quotations ?? 0) + 1;
      }

      if (entities.has('invoices')) {
        await syncInvoices(client, integration.location_id, cutoff);
        results.invoices = (results.invoices ?? 0) + 1;
      }

      if (entities.has('meetings')) {
        await syncMeetings(client, integration.location_id, cutoff);
        results.meetings = (results.meetings ?? 0) + 1;
      }
    }

    return jsonResponse(200, { ok: true, results });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
