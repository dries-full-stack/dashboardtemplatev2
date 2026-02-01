import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

type QueryValue = string | number | boolean | null | undefined;

type SyncState = {
  entity: string;
  location_id: string;
  cursor: Record<string, unknown> | null;
  last_synced_at: string | null;
  updated_at: string | null;
};

type GhlIntegration = {
  locationId: string;
  token: string;
};

type ContactRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  dateAdded?: string | number;
  dateUpdated?: string | number;
  createdAt?: string | number;
  updatedAt?: string | number;
};

type OpportunityRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  name?: string;
  status?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
  contactId?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
};

type CalendarRecord = Record<string, unknown> & { id?: string };

type CalendarEventRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  calendarId?: string;
  contactId?: string;
  appointmentStatus?: string;
  assignedUserId?: string;
  title?: string;
  startTime?: unknown;
  endTime?: unknown;
  dateAdded?: unknown;
  dateUpdated?: unknown;
};

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type RequestOptions = {
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  version?: string;
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

const parseNumber = (key: string, fallback: number) => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid number for env var ${key}: ${raw}`);
  return value;
};

const parseBool = (key: string, fallback: boolean) => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  return ['true', '1', 'yes', 'y'].includes(normalized);
};

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  GHL_BASE_URL: optional('GHL_BASE_URL', 'https://services.leadconnectorhq.com').replace(/\/$/, ''),
  GHL_API_VERSION: optional('GHL_API_VERSION', '2021-07-28'),
  GHL_CALENDARS_VERSION: optional('GHL_CALENDARS_VERSION', '2021-04-15'),
  SYNC_BATCH_SIZE: Math.min(100, Math.max(1, parseNumber('SYNC_BATCH_SIZE', 100))),
  REQUEST_TIMEOUT_MS: parseNumber('REQUEST_TIMEOUT_MS', 30000),
  MAX_RETRIES: parseNumber('MAX_RETRIES', 5),
  RETRY_BASE_DELAY_MS: parseNumber('RETRY_BASE_DELAY_MS', 1000),
  FULL_SYNC: parseBool('FULL_SYNC', false),
  PRUNE_ON_FULL_SYNC: parseBool('PRUNE_ON_FULL_SYNC', true),
  FULL_SYNC_INTERVAL_HOURS: parseNumber('FULL_SYNC_INTERVAL_HOURS', 24),
  CONTACTS_REFRESH_DAYS: parseNumber('CONTACTS_REFRESH_DAYS', 30),
  OPPORTUNITIES_REFRESH_DAYS: parseNumber('OPPORTUNITIES_REFRESH_DAYS', 30),
  APPOINTMENTS_LOOKBACK_DAYS: parseNumber('APPOINTMENTS_LOOKBACK_DAYS', 365),
  APPOINTMENTS_LOOKAHEAD_DAYS: parseNumber('APPOINTMENTS_LOOKAHEAD_DAYS', 365),
  SYNC_SECRET: Deno.env.get('SYNC_SECRET') ?? ''
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class GhlClient {
  constructor(private baseUrl: string, private token: string) {}

  private buildUrl(path: string, query?: Record<string, QueryValue>) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === '') continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const url = this.buildUrl(options.path, options.query);
    const version = options.version ?? env.GHL_API_VERSION;

    for (let attempt = 0; attempt <= env.MAX_RETRIES; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url.toString(), {
          method: options.method,
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
            Version: version,
            ...(options.body ? { 'Content-Type': 'application/json' } : {})
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (response.ok) {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            return (await response.json()) as T;
          }
          return (await response.text()) as T;
        }

        const retryable = response.status === 429 || response.status >= 500;
        const errorBody = await response.text();

        if (!retryable || attempt >= env.MAX_RETRIES) {
          throw new Error(`GHL API ${response.status} ${response.statusText}: ${errorBody}`);
        }

        const retryAfter = Number(response.headers.get('retry-after'));
        const backoff = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : env.RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);

        console.warn(`GHL API rate limit or server error. Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } catch (error) {
        clearTimeout(timeout);
        if (attempt >= env.MAX_RETRIES) throw error;
        const backoff = env.RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);
        console.warn(`GHL API request failed. Retrying in ${backoff}ms...`, error);
        await sleep(backoff);
      }
    }

    throw new Error('GHL API request failed after retries');
  }

  getContacts(params: {
    locationId: string;
    limit?: number;
    startAfter?: number | null;
    startAfterId?: string | null;
  }) {
    return this.request<{ contacts: unknown[]; count?: number }>({
      method: 'GET',
      path: '/contacts/',
      query: {
        locationId: params.locationId,
        limit: params.limit,
        startAfter: params.startAfter ?? undefined,
        startAfterId: params.startAfterId ?? undefined
      },
      version: env.GHL_API_VERSION
    });
  }

  searchOpportunities(params: {
    locationId: string;
    limit?: number;
    startAfter?: number | null;
    startAfterId?: string | null;
    status?: string;
    order?: string;
  }) {
    return this.request<{ opportunities: unknown[]; meta?: Record<string, unknown> }>({
      method: 'GET',
      path: '/opportunities/search',
      query: {
        location_id: params.locationId,
        limit: params.limit,
        startAfter: params.startAfter ?? undefined,
        startAfterId: params.startAfterId ?? undefined,
        status: params.status,
        order: params.order
      },
      version: env.GHL_API_VERSION
    });
  }

  getCalendars(params: { locationId: string; groupId?: string; showDrafted?: boolean }) {
    return this.request<{ calendars: unknown[] }>({
      method: 'GET',
      path: '/calendars/',
      query: {
        locationId: params.locationId,
        groupId: params.groupId,
        showDrafted: params.showDrafted
      },
      version: env.GHL_CALENDARS_VERSION
    });
  }

  getCalendarEvents(params: {
    locationId: string;
    calendarId?: string;
    userId?: string;
    groupId?: string;
    startTime: number;
    endTime: number;
  }) {
    return this.request<{ events: unknown[] }>({
      method: 'GET',
      path: '/calendars/events',
      query: {
        locationId: params.locationId,
        calendarId: params.calendarId,
        userId: params.userId,
        groupId: params.groupId,
        startTime: params.startTime,
        endTime: params.endTime
      },
      version: env.GHL_CALENDARS_VERSION
    });
  }
}

const chunkArray = <T>(items: T[], size: number): T[][] => {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'string') {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && asNumber.toString() === value.trim()) {
      const dateFromNumber = new Date(asNumber);
      return Number.isNaN(dateFromNumber.getTime()) ? null : dateFromNumber;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = obj.dateTime ?? obj.time ?? obj.value ?? obj.iso ?? obj.startTime ?? obj.endTime;
    return parseDate(candidate);
  }
  return null;
};

const toIsoDate = (value: unknown): string | null => {
  const date = parseDate(value);
  return date ? date.toISOString() : null;
};

const toEpochMs = (value: unknown): number | null => {
  const date = parseDate(value);
  return date ? date.getTime() : null;
};

const getSyncState = async (entity: string, locationId: string): Promise<SyncState | null> => {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('entity', entity)
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

const saveSyncState = async (
  entity: string,
  locationId: string,
  cursor: Record<string, unknown> | null,
  lastSyncedAt: string
) => {
  const payload = {
    entity,
    location_id: locationId,
    cursor,
    last_synced_at: lastSyncedAt,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('sync_state')
    .upsert(payload, { onConflict: 'entity,location_id' });

  if (error) throw error;
};

const loadIntegration = async (): Promise<GhlIntegration> => {
  const { data, error } = await supabase
    .from('ghl_integrations')
    .select('location_id, private_integration_token, active, updated_at')
    .eq('active', true)
    .order('updated_at', { ascending: false })
    .limit(2);

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('No active GHL integration found in Supabase.');
  }
  if (data.length > 1) {
    console.warn('Multiple active GHL integrations found. Using the most recently updated one.');
  }

  const integration = data[0] as { location_id: string; private_integration_token: string };
  return {
    locationId: integration.location_id,
    token: integration.private_integration_token
  };
};

const parseBoolValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', '1', 'yes', 'y'].includes(normalized);
  }
  return false;
};

const getFullSyncFlags = (state: SyncState | null, forceFullSync: boolean) => {
  const now = Date.now();
  const lastFullSyncAt = state?.cursor && typeof state.cursor.lastFullSyncAt === 'string'
    ? (state.cursor.lastFullSyncAt as string)
    : null;
  const lastFullSyncMs = lastFullSyncAt ? Date.parse(lastFullSyncAt) : NaN;
  const fullSyncIntervalMs = env.FULL_SYNC_INTERVAL_HOURS * 60 * 60 * 1000;
  const shouldFullByInterval = env.FULL_SYNC_INTERVAL_HOURS > 0 && (
    !lastFullSyncAt || Number.isNaN(lastFullSyncMs) || now - lastFullSyncMs >= fullSyncIntervalMs
  );
  const isFullSync = env.FULL_SYNC || forceFullSync || !state || shouldFullByInterval;

  return { isFullSync, lastFullSyncAt };
};

const syncContacts = async (client: GhlClient, locationId: string, forceFullSync: boolean) => {
  const state = await getSyncState('contacts', locationId);
  const now = Date.now();
  const syncStartedAt = new Date().toISOString();
  const { isFullSync, lastFullSyncAt } = getFullSyncFlags(state, forceFullSync);

  let startAfter = state?.cursor && typeof state.cursor.startAfter === 'number'
    ? (state.cursor.startAfter as number)
    : null;
  let startAfterId = state?.cursor && typeof state.cursor.startAfterId === 'string'
    ? (state.cursor.startAfterId as string)
    : null;

  if (isFullSync) {
    startAfter = null;
    startAfterId = null;
  } else if (env.CONTACTS_REFRESH_DAYS > 0) {
    const refreshStart = now - env.CONTACTS_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  console.log('Syncing contacts...');

  let total = 0;
  while (true) {
    const response = await client.getContacts({
      locationId,
      limit: env.SYNC_BATCH_SIZE,
      startAfter: startAfter ?? undefined,
      startAfterId: startAfterId ?? undefined
    });

    const contacts = (response.contacts ?? []) as ContactRecord[];
    if (contacts.length === 0) break;

    const rows = contacts.map((contact) => {
      const createdAt = toIsoDate(
        contact.dateAdded ?? contact.createdAt ?? (contact as Record<string, unknown>).created_at
      );
      const updatedAt = toIsoDate(
        contact.dateUpdated ?? contact.updatedAt ?? (contact as Record<string, unknown>).updated_at ?? createdAt
      );

      return {
        id: contact.id,
        location_id: contact.locationId ?? locationId,
        first_name: (contact as Record<string, unknown>).firstName ?? (contact as Record<string, unknown>).first_name ?? null,
        last_name: (contact as Record<string, unknown>).lastName ?? (contact as Record<string, unknown>).last_name ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        tags: contact.tags ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: contact,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, 500)) {
      const { error } = await supabase.from('contacts').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += contacts.length;

    const last = contacts[contacts.length - 1];
    const lastTimestamp = toEpochMs(last.dateAdded ?? last.createdAt ?? last.dateUpdated ?? last.updatedAt);
    if (lastTimestamp) startAfter = lastTimestamp;
    if (last.id) startAfterId = last.id;

    await saveSyncState(
      'contacts',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
      },
      new Date().toISOString()
    );

    console.log(`Contacts page synced: ${contacts.length} records (total ${total}).`);

    if (contacts.length < env.SYNC_BATCH_SIZE) break;
  }

  console.log(`Contacts sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    console.log('Contacts prune complete (removed records not present in full sync).');
  }

  return total;
};

const syncOpportunities = async (client: GhlClient, locationId: string, forceFullSync: boolean) => {
  const state = await getSyncState('opportunities', locationId);
  const now = Date.now();
  const syncStartedAt = new Date().toISOString();
  const { isFullSync, lastFullSyncAt } = getFullSyncFlags(state, forceFullSync);

  let startAfter = state?.cursor && typeof state.cursor.startAfter === 'number'
    ? (state.cursor.startAfter as number)
    : null;
  let startAfterId = state?.cursor && typeof state.cursor.startAfterId === 'string'
    ? (state.cursor.startAfterId as string)
    : null;

  if (isFullSync) {
    startAfter = null;
    startAfterId = null;
  } else if (env.OPPORTUNITIES_REFRESH_DAYS > 0) {
    const refreshStart = now - env.OPPORTUNITIES_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  console.log('Syncing opportunities...');

  let total = 0;
  while (true) {
    const response = await client.searchOpportunities({
      locationId,
      limit: env.SYNC_BATCH_SIZE,
      startAfter: startAfter ?? undefined,
      startAfterId: startAfterId ?? undefined,
      status: 'all',
      order: 'added_asc'
    });

    const opportunities = (response.opportunities ?? []) as OpportunityRecord[];
    if (opportunities.length === 0) break;

    const rows = opportunities.map((opportunity) => {
      const createdAt = toIsoDate(opportunity.createdAt ?? (opportunity as Record<string, unknown>).created_at);
      const updatedAt = toIsoDate(
        opportunity.updatedAt ?? (opportunity as Record<string, unknown>).updated_at ?? createdAt
      );

      return {
        id: opportunity.id,
        location_id: opportunity.locationId ?? locationId,
        name: opportunity.name ?? null,
        status: opportunity.status ?? null,
        pipeline_id: opportunity.pipelineId ?? null,
        pipeline_stage_id: opportunity.pipelineStageId ?? null,
        monetary_value: opportunity.monetaryValue ?? null,
        assigned_to: opportunity.assignedTo ?? null,
        contact_id: opportunity.contactId ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: opportunity,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, 500)) {
      const { error } = await supabase.from('opportunities').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += opportunities.length;

    const meta = response.meta as Record<string, unknown> | undefined;
    const metaStartAfter = typeof meta?.startAfter === 'number' ? (meta.startAfter as number) : null;
    const metaStartAfterId = typeof meta?.startAfterId === 'string' ? (meta.startAfterId as string) : null;

    if (metaStartAfter) {
      startAfter = metaStartAfter;
      startAfterId = metaStartAfterId ?? startAfterId;
    } else {
      const last = opportunities[opportunities.length - 1];
      const lastTimestamp = toEpochMs(last.createdAt ?? last.updatedAt);
      if (lastTimestamp) startAfter = lastTimestamp;
      if (last.id) startAfterId = last.id;
    }

    await saveSyncState(
      'opportunities',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
      },
      new Date().toISOString()
    );

    console.log(`Opportunities page synced: ${opportunities.length} records (total ${total}).`);

    if (opportunities.length < env.SYNC_BATCH_SIZE) break;
  }

  console.log(`Opportunities sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    console.log('Opportunities prune complete (removed records not present in full sync).');
  }

  return total;
};

const syncAppointments = async (client: GhlClient, locationId: string, forceFullSync: boolean) => {
  const state = await getSyncState('appointments', locationId);
  const syncStartedAt = new Date().toISOString();
  const now = Date.now();
  const { isFullSync, lastFullSyncAt } = getFullSyncFlags(state, forceFullSync);

  const lookbackMs = env.APPOINTMENTS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const lookaheadMs = env.APPOINTMENTS_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;

  let startTime = now - lookbackMs;
  if (!isFullSync && state?.last_synced_at) {
    const lastSynced = Date.parse(state.last_synced_at);
    if (!Number.isNaN(lastSynced)) {
      startTime = lastSynced - lookbackMs;
    }
  }
  const endTime = now + lookaheadMs;

  console.log('Syncing appointments...');

  const calendarsResponse = await client.getCalendars({
    locationId,
    showDrafted: true
  });

  const calendars = (calendarsResponse.calendars ?? []) as CalendarRecord[];
  if (calendars.length === 0) {
    console.warn('No calendars found. Skipping appointments sync.');
    return 0;
  }

  let total = 0;

  for (const calendar of calendars) {
    if (!calendar.id) continue;

    const eventsResponse = await client.getCalendarEvents({
      locationId,
      calendarId: calendar.id,
      startTime,
      endTime
    });

    const events = (eventsResponse.events ?? []) as CalendarEventRecord[];
    if (events.length === 0) continue;

    const rows = events.map((event) => {
      const createdAt = toIsoDate(event.dateAdded ?? (event as Record<string, unknown>).createdAt);
      const updatedAt = toIsoDate(
        event.dateUpdated ?? (event as Record<string, unknown>).updatedAt ?? createdAt
      );

      return {
        id: event.id,
        location_id: event.locationId ?? locationId,
        calendar_id: event.calendarId ?? calendar.id,
        contact_id: event.contactId ?? null,
        appointment_status: event.appointmentStatus ?? null,
        assigned_user_id: event.assignedUserId ?? null,
        title: event.title ?? null,
        start_time: toIsoDate(event.startTime) ?? null,
        end_time: toIsoDate(event.endTime) ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: event,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, 500)) {
      const { error } = await supabase.from('appointments').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += events.length;
    console.log(`Appointments synced for calendar ${calendar.id}: ${events.length} records.`);
  }

  await saveSyncState('appointments', locationId, {
    lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
  }, new Date().toISOString());

  console.log(`Appointments sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    console.log('Appointments prune complete (removed records not present in full sync).');
  }

  return total;
};

const parseRequestConfig = async (req: Request) => {
  const url = new URL(req.url);
  const entitiesParam = url.searchParams.get('entities');
  const fullSyncParam = url.searchParams.get('full_sync') ?? url.searchParams.get('fullSync');
  const entities = new Set<string>();
  let fullSyncFromBody: unknown;

  if (entitiesParam) {
    for (const entry of entitiesParam.split(',')) {
      const cleaned = entry.trim().toLowerCase();
      if (cleaned) entities.add(cleaned);
    }
  }

  if (req.method !== 'GET') {
    try {
      const body = await req.json();
      if (Array.isArray(body?.entities)) {
        body.entities.forEach((entry: string) => entities.add(String(entry).toLowerCase()));
      } else if (typeof body?.entities === 'string') {
        body.entities.split(',').forEach((entry: string) => entities.add(entry.trim().toLowerCase()));
      }
      fullSyncFromBody = body?.full_sync ?? body?.fullSync;
    } catch {
      // ignore body parse errors
    }
  }

  if (entities.size === 0 || entities.has('all')) {
    return {
      entities: ['contacts', 'opportunities', 'appointments'],
      forceFullSync: parseBoolValue(fullSyncParam ?? fullSyncFromBody)
    };
  }

  return {
    entities: Array.from(entities),
    forceFullSync: parseBoolValue(fullSyncParam ?? fullSyncFromBody)
  };
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
    const { entities, forceFullSync } = await parseRequestConfig(req);
    const integration = await loadIntegration();
    const client = new GhlClient(env.GHL_BASE_URL, integration.token);

    const results: Record<string, number> = {};

    for (const entity of entities) {
      if (entity === 'contacts') {
        results.contacts = await syncContacts(client, integration.locationId, forceFullSync);
      } else if (entity === 'opportunities') {
        results.opportunities = await syncOpportunities(client, integration.locationId, forceFullSync);
      } else if (entity === 'appointments') {
        results.appointments = await syncAppointments(client, integration.locationId, forceFullSync);
      }
    }

    return new Response(JSON.stringify({ ok: true, results, force_full_sync: forceFullSync }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
