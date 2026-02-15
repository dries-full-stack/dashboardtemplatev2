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

type CustomFieldRecord = Record<string, unknown> & {
  id?: string;
  name?: string;
  label?: string;
  fieldKey?: string;
  key?: string;
  model?: string;
  object?: string;
  objectKey?: string;
  type?: string;
  options?: unknown[];
};

type PipelineRecord = Record<string, unknown> & {
  id?: string;
  name?: string;
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
  // Hard cap so we always return before the Edge Function gateway timeout.
  MAX_SYNC_RUNTIME_MS: Math.min(parseNumber('MAX_SYNC_RUNTIME_MS', 110000), 110000),
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

type SyncBudget = {
  deadlineMs: number;
  shouldStop: (estimatedWorkMs?: number) => boolean;
};

const createSyncBudget = (): SyncBudget => {
  const startedMs = Date.now();
  const deadlineMs = startedMs + env.MAX_SYNC_RUNTIME_MS;
  const bufferMs = 4000;
  return {
    deadlineMs,
    // Stop when we don't have enough runway left for the next unit of work.
    shouldStop: (estimatedWorkMs = 0) =>
      Date.now() > deadlineMs - bufferMs - Math.max(0, estimatedWorkMs)
  };
};

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

  getCustomFields(params: { locationId: string }) {
    return this.request<{ customFields?: unknown[]; custom_fields?: unknown[]; fields?: unknown[] } | unknown[]>({
      method: 'GET',
      path: `/locations/${params.locationId}/customFields`,
      version: env.GHL_API_VERSION
    });
  }

  getPipelines(params: { locationId: string }) {
    return this.request<{ pipelines?: unknown[]; data?: unknown[] } | unknown[]>({
      method: 'GET',
      path: '/opportunities/pipelines',
      query: { locationId: params.locationId },
      version: env.GHL_API_VERSION
    });
  }

  getPipelineLostReasons(params: { locationId: string }) {
    return this.request<unknown>({
      method: 'GET',
      path: '/opportunities/pipelines/lostReasons',
      query: { locationId: params.locationId },
      version: env.GHL_API_VERSION
    });
  }

  getPipelineSettings(params: { locationId: string }) {
    return this.request<unknown>({
      method: 'GET',
      path: '/opportunities/pipelines/settings',
      query: { locationId: params.locationId },
      version: env.GHL_API_VERSION
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

const normalizeString = (value: unknown): string => (value === null || value === undefined ? '' : String(value).trim());

const normalizeLower = (value: unknown): string => normalizeString(value).toLowerCase();

const isLostReasonLabel = (value: unknown): boolean => {
  const text = normalizeLower(value);
  if (!text) return false;
  return (
    text.includes('lost reason') ||
    text.includes('lostreason') ||
    text.includes('lost_reason') ||
    text.includes('lost-reason') ||
    text.includes('verlies') ||
    text.includes('verloren') ||
    text === 'reason' ||
    text === 'reden' ||
    (text.includes('lost') && text.includes('reason'))
  );
};

const isOpportunityField = (field: CustomFieldRecord): boolean => {
  const marker = normalizeLower(field.model ?? field.object ?? field.objectKey ?? field.type ?? field.fieldKey ?? field.key);
  if (!marker) return true;
  return marker.includes('opportunity');
};

const extractOptionList = (field: CustomFieldRecord): unknown[] => {
  const record = field as Record<string, unknown>;
  const meta = record.meta;
  const metaOptions =
    meta && typeof meta === 'object' && meta !== null && 'options' in (meta as Record<string, unknown>)
      ? (meta as Record<string, unknown>).options
      : undefined;

  const candidates = [
    field.options,
    record.choices,
    record.allowedValues,
    record.values,
    record.items,
    record.enum,
    record.picklistOptions,
    record.selectOptions,
    record.textBoxListOptions,
    metaOptions
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }

  return [];
};

const mapOption = (option: unknown): { id: string; name: string } | null => {
  if (option === null || option === undefined) return null;
  if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
    const value = normalizeString(option);
    if (!value) return null;
    return { id: value, name: value };
  }

  const record = option as Record<string, unknown>;
  const id = normalizeString(record.id ?? record.value ?? record.key ?? record._id ?? record.optionId ?? record.code);
  const name = normalizeString(record.name ?? record.label ?? record.value ?? record.text ?? record.title ?? record.displayName);

  if (!id && !name) return null;
  return { id: id || name, name: name || id };
};

const extractLostReasonsFromCustomFields = (payload: unknown): { id: string; name: string }[] => {
  const fields = Array.isArray(payload)
    ? payload
    : (payload as Record<string, unknown>)?.customFields ??
      (payload as Record<string, unknown>)?.custom_fields ??
      (payload as Record<string, unknown>)?.fields ??
      [];

  const list = Array.isArray(fields) ? fields : [];
  const reasons: { id: string; name: string }[] = [];

  list.forEach((entry) => {
    const field = entry as CustomFieldRecord;
    const fieldName = field.name ?? field.label ?? field.fieldKey ?? field.key ?? '';
    if (!isLostReasonLabel(fieldName)) return;
    if (!isOpportunityField(field)) return;

    const options = extractOptionList(field);
    options.forEach((option) => {
      const mapped = mapOption(option);
      if (mapped) reasons.push(mapped);
    });
  });

  return reasons;
};

const extractLostReasonsFromPipelines = (payload: unknown): { id: string; name: string }[] => {
  const pipelines = Array.isArray(payload)
    ? payload
    : (payload as Record<string, unknown>)?.pipelines ??
      (payload as Record<string, unknown>)?.data ??
      [];

  const list = Array.isArray(pipelines) ? pipelines : [];
  const reasons: { id: string; name: string }[] = [];

  const keyMatches = (key: string) => {
    const lowered = normalizeLower(key);
    return (
      lowered.includes('lost') ||
      lowered.includes('reason') ||
      lowered.includes('verloren') ||
      lowered.includes('verlies')
    );
  };

  const collectFromValue = (value: unknown, matchContext: boolean) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (matchContext) {
          const mapped = mapOption(item);
          if (mapped) reasons.push(mapped);
        }
        collectFromValue(item, matchContext);
      });
      return;
    }
    if (typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    const idCandidate = normalizeString(
      record.lostReasonId ?? record.lost_reason_id ?? record.reasonId ?? record.reason_id ?? record.lostReasonID
    );
    const nameCandidate = normalizeString(
      record.lostReasonName ?? record.lost_reason_name ?? record.reasonName ?? record.reason_name
    );

    if (idCandidate && nameCandidate) {
      reasons.push({ id: idCandidate, name: nameCandidate });
    }

    if (matchContext && !idCandidate) {
      const mapped = mapOption(record);
      if (mapped) reasons.push(mapped);
    }

    Object.entries(record).forEach(([key, child]) => {
      const nextMatch = matchContext || keyMatches(key);
      collectFromValue(child, nextMatch);
    });
  };

  list.forEach((entry) => {
    const pipeline = entry as PipelineRecord;
    const candidates = [
      (pipeline as Record<string, unknown>)?.lostReasons,
      (pipeline as Record<string, unknown>)?.lost_reasons,
      (pipeline as Record<string, unknown>)?.lostReasonOptions
    ];

    candidates.forEach((candidate) => {
      if (!Array.isArray(candidate)) return;
      candidate.forEach((option) => {
        const mapped = mapOption(option);
        if (mapped) reasons.push(mapped);
      });
    });

    collectFromValue(pipeline, false);
  });

  return reasons;
};

const extractPipelinesFromPayload = (payload: unknown): { id: string; name: string }[] => {
  const pipelines = Array.isArray(payload)
    ? payload
    : (payload as Record<string, unknown>)?.pipelines ??
      (payload as Record<string, unknown>)?.data ??
      [];

  const list = Array.isArray(pipelines) ? pipelines : [];
  const items: { id: string; name: string }[] = [];

  list.forEach((entry) => {
    const pipeline = entry as PipelineRecord;
    const id = normalizeString(
      pipeline.id ??
      (pipeline as Record<string, unknown>)?.pipelineId ??
      (pipeline as Record<string, unknown>)?.pipeline_id ??
      (pipeline as Record<string, unknown>)?.value
    );
    if (!id) return;

    const name = normalizeString(
      pipeline.name ??
      (pipeline as Record<string, unknown>)?.pipelineName ??
      (pipeline as Record<string, unknown>)?.pipeline_name ??
      (pipeline as Record<string, unknown>)?.label ??
      (pipeline as Record<string, unknown>)?.title
    );

    items.push({ id, name: name || id });
  });

  return items;
};

const dedupeReasons = (items: { id: string; name: string }[]) => {
  const map = new Map<string, { id: string; name: string }>();
  items.forEach((item) => {
    if (!item?.id || !item?.name) return;
    if (!map.has(item.id)) {
      map.set(item.id, item);
      return;
    }
    const existing = map.get(item.id);
    if (existing && existing.name.length < item.name.length) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const dedupePipelines = (items: { id: string; name: string }[]) => {
  const map = new Map<string, { id: string; name: string }>();
  items.forEach((item) => {
    if (!item?.id || !item?.name) return;
    if (!map.has(item.id)) {
      map.set(item.id, item);
      return;
    }
    const existing = map.get(item.id);
    if (existing && existing.name.length < item.name.length) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
};

const upsertOpportunityPipelineLookup = async (
  locationId: string,
  items: { id: string; name: string }[]
) => {
  const pipelines = dedupePipelines(items);
  if (!pipelines.length) return 0;

  const updatedAt = new Date().toISOString();
  const rows = pipelines.map((pipeline) => ({
    location_id: locationId,
    pipeline_id: pipeline.id,
    pipeline_name: pipeline.name,
    updated_at: updatedAt
  }));

  for (const chunk of chunkArray(rows, 500)) {
    const { error } = await supabase.from('opportunity_pipeline_lookup').upsert(chunk, {
      onConflict: 'location_id,pipeline_id'
    });
    if (error) throw error;
  }

  return rows.length;
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

const parsePositiveInt = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.floor(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
};

const getFullSyncFlags = (
  state: SyncState | null,
  forceFullSync: boolean,
  syncStartedAt?: string,
  initialWindowDays?: number | null
) => {
  const now = Date.now();
  const allowInitialWindow = Number.isFinite(initialWindowDays) && initialWindowDays > 0;
  const lastFullSyncAt = state?.cursor && typeof state.cursor.lastFullSyncAt === 'string'
    ? (state.cursor.lastFullSyncAt as string)
    : null;
  const effectiveLastFullSyncAt =
    !state && allowInitialWindow && !forceFullSync && !env.FULL_SYNC && syncStartedAt
      ? syncStartedAt
      : lastFullSyncAt;
  const lastFullSyncMs = effectiveLastFullSyncAt ? Date.parse(effectiveLastFullSyncAt) : NaN;
  const fullSyncIntervalMs = env.FULL_SYNC_INTERVAL_HOURS * 60 * 60 * 1000;
  const shouldFullByInterval = env.FULL_SYNC_INTERVAL_HOURS > 0 && (
    !effectiveLastFullSyncAt || Number.isNaN(lastFullSyncMs) || now - lastFullSyncMs >= fullSyncIntervalMs
  );
  const isFullSync = env.FULL_SYNC || forceFullSync || (!state && !allowInitialWindow) || shouldFullByInterval;

  return { isFullSync, lastFullSyncAt: effectiveLastFullSyncAt };
};

const syncContacts = async (
  client: GhlClient,
  locationId: string,
  forceFullSync: boolean,
  budget: SyncBudget,
  initialWindowDays: number | null = null
) => {
  const state = await getSyncState('contacts', locationId);
  const now = Date.now();
  const invocationStartedAt = new Date().toISOString();
  const cursor = state?.cursor as Record<string, unknown> | null;
  const cursorFullSyncStartedAt =
    cursor && typeof cursor.fullSyncStartedAt === 'string' ? (cursor.fullSyncStartedAt as string) : null;
  const fullSyncInProgress = cursor?.fullSyncInProgress === true && Boolean(cursorFullSyncStartedAt);

  const { isFullSync: shouldFullSync, lastFullSyncAt } = getFullSyncFlags(
    state,
    forceFullSync,
    invocationStartedAt,
    initialWindowDays
  );
  const freshFullSync = shouldFullSync && !fullSyncInProgress;
  const isFullSync = shouldFullSync || fullSyncInProgress;
  const fullSyncStartedAt = isFullSync ? cursorFullSyncStartedAt || invocationStartedAt : null;
  const syncStartedAt = fullSyncStartedAt || invocationStartedAt;

  let allowStartAfter = !(cursor && cursor.contactsStartAfterDisabled === true);

  let startAfter = state?.cursor && typeof state.cursor.startAfter === 'number'
    ? (state.cursor.startAfter as number)
    : null;
  let startAfterId = state?.cursor && typeof state.cursor.startAfterId === 'string'
    ? (state.cursor.startAfterId as string)
    : null;

  if (freshFullSync) {
    startAfter = null;
    startAfterId = null;
  } else if (
    !state &&
    !isFullSync &&
    allowStartAfter &&
    Number.isFinite(initialWindowDays) &&
    initialWindowDays > 0
  ) {
    const refreshStart = now - initialWindowDays * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  } else if (!isFullSync && allowStartAfter && env.CONTACTS_REFRESH_DAYS > 0) {
    const refreshStart = now - env.CONTACTS_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  console.log('Syncing contacts...');

  // Persist the full sync marker before we start paging, so the next invocation can continue with the same timestamp.
  if (freshFullSync && fullSyncStartedAt) {
    await saveSyncState(
      'contacts',
      locationId,
      {
        startAfter: null,
        startAfterId: null,
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: true,
        fullSyncStartedAt,
        contactsStartAfterDisabled: !allowStartAfter
      },
      new Date().toISOString()
    );
  }

  let total = 0;
  let completed = false;
  let lastPageMs = 0;
  while (true) {
    if (budget.shouldStop(lastPageMs)) {
      console.warn('Contacts sync: time budget reached, returning partial progress.');
      break;
    }

    const pageStartedMs = Date.now();
    let response: { contacts: unknown[]; count?: number };
    try {
      response = await client.getContacts({
        locationId,
        limit: env.SYNC_BATCH_SIZE,
        startAfter: allowStartAfter ? startAfter ?? undefined : undefined,
        startAfterId: startAfterId ?? undefined
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (allowStartAfter && message.includes('search_after')) {
        console.warn('Contacts sync: startAfter rejected, retrying with startAfterId only.');
        allowStartAfter = false;
        response = await client.getContacts({
          locationId,
          limit: env.SYNC_BATCH_SIZE,
          startAfterId: startAfterId ?? undefined
        });
      } else {
        throw error;
      }
    }

    const contacts = (response.contacts ?? []) as ContactRecord[];
    if (contacts.length === 0) {
      completed = true;
      break;
    }

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
    if (allowStartAfter && lastTimestamp) {
      startAfter = lastTimestamp;
    } else {
      startAfter = null;
    }
    if (last.id) startAfterId = last.id;

    await saveSyncState(
      'contacts',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: isFullSync,
        fullSyncStartedAt: isFullSync ? fullSyncStartedAt : null,
        contactsStartAfterDisabled: !allowStartAfter
      },
      new Date().toISOString()
    );

    lastPageMs = Date.now() - pageStartedMs;
    console.log(`Contacts page synced: ${contacts.length} records (total ${total}).`);

    if (contacts.length < env.SYNC_BATCH_SIZE) {
      completed = true;
      break;
    }
  }

  console.log(`Contacts sync complete. Total records: ${total}.`);

  if (isFullSync && completed && fullSyncStartedAt) {
    await saveSyncState(
      'contacts',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: fullSyncStartedAt,
        fullSyncInProgress: false,
        fullSyncStartedAt: null,
        contactsStartAfterDisabled: !allowStartAfter
      },
      new Date().toISOString()
    );
  }

  if (isFullSync && completed && fullSyncStartedAt && env.PRUNE_ON_FULL_SYNC) {
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

const syncOpportunities = async (
  client: GhlClient,
  locationId: string,
  forceFullSync: boolean,
  budget: SyncBudget,
  initialWindowDays: number | null = null
) => {
  const state = await getSyncState('opportunities', locationId);
  const now = Date.now();
  const invocationStartedAt = new Date().toISOString();
  const cursor = state?.cursor as Record<string, unknown> | null;
  const cursorFullSyncStartedAt =
    cursor && typeof cursor.fullSyncStartedAt === 'string' ? (cursor.fullSyncStartedAt as string) : null;
  const fullSyncInProgress = cursor?.fullSyncInProgress === true && Boolean(cursorFullSyncStartedAt);
  const { isFullSync: shouldFullSync, lastFullSyncAt } = getFullSyncFlags(
    state,
    forceFullSync,
    invocationStartedAt,
    initialWindowDays
  );
  const freshFullSync = shouldFullSync && !fullSyncInProgress;
  const isFullSync = shouldFullSync || fullSyncInProgress;
  const fullSyncStartedAt = isFullSync ? cursorFullSyncStartedAt || invocationStartedAt : null;
  const syncStartedAt = fullSyncStartedAt || invocationStartedAt;

  let startAfter = state?.cursor && typeof state.cursor.startAfter === 'number'
    ? (state.cursor.startAfter as number)
    : null;
  let startAfterId = state?.cursor && typeof state.cursor.startAfterId === 'string'
    ? (state.cursor.startAfterId as string)
    : null;

  if (freshFullSync) {
    startAfter = null;
    startAfterId = null;
  } else if (!state && !isFullSync && Number.isFinite(initialWindowDays) && initialWindowDays > 0) {
    const refreshStart = now - initialWindowDays * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  } else if (!isFullSync && env.OPPORTUNITIES_REFRESH_DAYS > 0) {
    const refreshStart = now - env.OPPORTUNITIES_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  console.log('Syncing opportunities...');

  if (freshFullSync && fullSyncStartedAt) {
    await saveSyncState(
      'opportunities',
      locationId,
      {
        startAfter: null,
        startAfterId: null,
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: true,
        fullSyncStartedAt
      },
      new Date().toISOString()
    );
  }

  let total = 0;
  let completed = false;
  let lastPageMs = 0;
  while (true) {
    if (budget.shouldStop(lastPageMs)) {
      console.warn('Opportunities sync: time budget reached, returning partial progress.');
      break;
    }

    const pageStartedMs = Date.now();
    const response = await client.searchOpportunities({
      locationId,
      limit: env.SYNC_BATCH_SIZE,
      startAfter: startAfter ?? undefined,
      startAfterId: startAfterId ?? undefined,
      status: 'all',
      order: 'added_asc'
    });

    const opportunities = (response.opportunities ?? []) as OpportunityRecord[];
    if (opportunities.length === 0) {
      completed = true;
      break;
    }

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
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: isFullSync,
        fullSyncStartedAt: isFullSync ? fullSyncStartedAt : null
      },
      new Date().toISOString()
    );

    lastPageMs = Date.now() - pageStartedMs;
    console.log(`Opportunities page synced: ${opportunities.length} records (total ${total}).`);

    if (opportunities.length < env.SYNC_BATCH_SIZE) {
      completed = true;
      break;
    }
  }

  console.log(`Opportunities sync complete. Total records: ${total}.`);

  if (isFullSync && completed && fullSyncStartedAt) {
    await saveSyncState(
      'opportunities',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: fullSyncStartedAt,
        fullSyncInProgress: false,
        fullSyncStartedAt: null
      },
      new Date().toISOString()
    );
  }

  if (isFullSync && completed && fullSyncStartedAt && env.PRUNE_ON_FULL_SYNC) {
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

const syncAppointments = async (
  client: GhlClient,
  locationId: string,
  forceFullSync: boolean,
  budget: SyncBudget
) => {
  const state = await getSyncState('appointments', locationId);
  const now = Date.now();
  const invocationStartedAt = new Date().toISOString();
  const cursor = state?.cursor as Record<string, unknown> | null;
  const cursorFullSyncStartedAt =
    cursor && typeof cursor.fullSyncStartedAt === 'string' ? (cursor.fullSyncStartedAt as string) : null;
  const fullSyncInProgress = cursor?.fullSyncInProgress === true && Boolean(cursorFullSyncStartedAt);
  const { isFullSync: shouldFullSync, lastFullSyncAt } = getFullSyncFlags(state, forceFullSync);
  const freshFullSync = shouldFullSync && !fullSyncInProgress;
  const isFullSync = shouldFullSync || fullSyncInProgress;
  const fullSyncStartedAt = isFullSync ? cursorFullSyncStartedAt || invocationStartedAt : null;
  const syncStartedAt = fullSyncStartedAt || invocationStartedAt;

  const windowInProgress = cursor?.windowInProgress === true &&
    typeof cursor.windowSyncStartedAt === 'string' &&
    typeof cursor.windowStartTime === 'number' &&
    typeof cursor.windowEndTime === 'number' &&
    typeof cursor.calendarOffset === 'number';

  const lookbackMs = env.APPOINTMENTS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const lookaheadMs = env.APPOINTMENTS_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;

  let windowSyncStartedAt = windowInProgress ? (cursor.windowSyncStartedAt as string) : syncStartedAt;
  let startTime = windowInProgress ? (cursor.windowStartTime as number) : now - lookbackMs;
  if (!windowInProgress && !isFullSync && state?.last_synced_at) {
    const lastSynced = Date.parse(state.last_synced_at);
    if (!Number.isNaN(lastSynced)) startTime = lastSynced - lookbackMs;
  }
  const endTime = windowInProgress ? (cursor.windowEndTime as number) : now + lookaheadMs;

  let calendarOffset = windowInProgress ? (cursor.calendarOffset as number) : 0;

  console.log('Syncing appointments...');

  if (!windowInProgress || freshFullSync) {
    await saveSyncState(
      'appointments',
      locationId,
      {
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: isFullSync,
        fullSyncStartedAt: isFullSync ? fullSyncStartedAt : null,
        windowInProgress: true,
        windowSyncStartedAt,
        windowStartTime: startTime,
        windowEndTime: endTime,
        calendarOffset
      },
      new Date().toISOString()
    );
  }

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

  let completed = false;
  let lastCalendarMs = 0;
  for (let idx = calendarOffset; idx < calendars.length; idx += 1) {
    if (budget.shouldStop(lastCalendarMs)) {
      console.warn('Appointments sync: time budget reached, returning partial progress.');
      calendarOffset = idx;
      break;
    }

    const calendar = calendars[idx];
    if (!calendar.id) continue;

    const calendarStartedMs = Date.now();
    const eventsResponse = await client.getCalendarEvents({
      locationId,
      calendarId: calendar.id,
      startTime,
      endTime
    });

    const events = (eventsResponse.events ?? []) as CalendarEventRecord[];
    if (events.length === 0) {
      lastCalendarMs = Date.now() - calendarStartedMs;
      continue;
    }

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
    lastCalendarMs = Date.now() - calendarStartedMs;

    calendarOffset = idx + 1;
    await saveSyncState(
      'appointments',
      locationId,
      {
        lastFullSyncAt: lastFullSyncAt ?? null,
        fullSyncInProgress: isFullSync,
        fullSyncStartedAt: isFullSync ? fullSyncStartedAt : null,
        windowInProgress: true,
        windowSyncStartedAt,
        windowStartTime: startTime,
        windowEndTime: endTime,
        calendarOffset
      },
      new Date().toISOString()
    );
  }

  if (calendarOffset >= calendars.length) {
    completed = true;
    await saveSyncState(
      'appointments',
      locationId,
      {
        lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt ?? null,
        fullSyncInProgress: false,
        fullSyncStartedAt: null,
        windowInProgress: false,
        windowSyncStartedAt: null,
        windowStartTime: null,
        windowEndTime: null,
        calendarOffset: 0
      },
      new Date().toISOString()
    );
  }

  console.log(`Appointments sync complete. Total records: ${total}.`);

  if (isFullSync && completed && env.PRUNE_ON_FULL_SYNC) {
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

const syncLostReasonLookup = async (client: GhlClient, locationId: string) => {
  console.log('Syncing lost reason lookup...');
  const collected: { id: string; name: string }[] = [];
  let pipelineLookupSynced = 0;

  try {
    const pipelineResponse = await client.getPipelines({ locationId });
    const pipelinesList = Array.isArray(pipelineResponse)
      ? pipelineResponse
      : ((pipelineResponse as Record<string, unknown>)?.pipelines ??
        (pipelineResponse as Record<string, unknown>)?.data ??
        []);
    console.log(`Lost reason lookup: pipelines fetched (${Array.isArray(pipelinesList) ? pipelinesList.length : 0}).`);
    try {
      pipelineLookupSynced = await upsertOpportunityPipelineLookup(
        locationId,
        extractPipelinesFromPayload(pipelineResponse)
      );
      if (pipelineLookupSynced > 0) {
        console.log(`Pipeline lookup sync complete. Total records: ${pipelineLookupSynced}.`);
      }
    } catch (pipelineLookupError) {
      console.warn('Pipeline lookup sync failed.', pipelineLookupError);
    }
    collected.push(...extractLostReasonsFromPipelines(pipelineResponse));
  } catch (error) {
    console.warn('Lost reason lookup: pipeline fetch failed.', error);
  }

  try {
    const lostReasonsResponse = await client.getPipelineLostReasons({ locationId });
    collected.push(...extractLostReasonsFromPipelines(lostReasonsResponse));
  } catch (error) {
    console.warn('Lost reason lookup: lost reasons endpoint fetch failed.', error);
  }

  try {
    const settingsResponse = await client.getPipelineSettings({ locationId });
    collected.push(...extractLostReasonsFromPipelines(settingsResponse));
  } catch (error) {
    console.warn('Lost reason lookup: pipeline settings fetch failed.', error);
  }

  try {
    const fieldResponse = await client.getCustomFields({ locationId });
    const fieldList = Array.isArray(fieldResponse)
      ? fieldResponse
      : ((fieldResponse as Record<string, unknown>)?.customFields ??
        (fieldResponse as Record<string, unknown>)?.custom_fields ??
        (fieldResponse as Record<string, unknown>)?.fields ??
        []);
    console.log(`Lost reason lookup: custom fields fetched (${Array.isArray(fieldList) ? fieldList.length : 0}).`);
    collected.push(...extractLostReasonsFromCustomFields(fieldResponse));
  } catch (error) {
    console.warn('Lost reason lookup: custom fields fetch failed.', error);
  }

  const reasons = dedupeReasons(collected);
  if (!reasons.length) {
    console.warn('Lost reason lookup: no reasons found.');
    return 0;
  }

  console.log(`Lost reason lookup: ${reasons.length} reasons extracted.`);

  const updatedAt = new Date().toISOString();
  const rows = reasons.map((reason) => ({
    location_id: locationId,
    reason_id: reason.id,
    reason_name: reason.name,
    updated_at: updatedAt
  }));

  for (const chunk of chunkArray(rows, 500)) {
    const { error } = await supabase.from('lost_reason_lookup').upsert(chunk, {
      onConflict: 'location_id,reason_id'
    });
    if (error) throw error;
  }

  console.log(`Lost reason lookup sync complete. Total records: ${reasons.length}.`);
  return reasons.length;
};

const parseRequestConfig = async (req: Request) => {
  const url = new URL(req.url);
  const entitiesParam = url.searchParams.get('entities');
  const fullSyncParam = url.searchParams.get('full_sync') ?? url.searchParams.get('fullSync');
  const initialWindowParam =
    url.searchParams.get('initial_window_days') ?? url.searchParams.get('initialWindowDays');
  const entities = new Set<string>();
  let fullSyncFromBody: unknown;
  let initialWindowFromBody: unknown;

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
      initialWindowFromBody = body?.initial_window_days ?? body?.initialWindowDays;
    } catch {
      // ignore body parse errors
    }
  }

  const initialWindowDays = parsePositiveInt(initialWindowParam ?? initialWindowFromBody);

  if (entities.size === 0 || entities.has('all')) {
    return {
      entities: ['contacts', 'opportunities', 'appointments', 'lost_reasons'],
      forceFullSync: parseBoolValue(fullSyncParam ?? fullSyncFromBody),
      initialWindowDays
    };
  }

  return {
    entities: Array.from(entities),
    forceFullSync: parseBoolValue(fullSyncParam ?? fullSyncFromBody),
    initialWindowDays
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
    const { entities, forceFullSync, initialWindowDays } = await parseRequestConfig(req);
    const integration = await loadIntegration();
    const client = new GhlClient(env.GHL_BASE_URL, integration.token);
    const budget = createSyncBudget();
    const entityEstimatesMs: Record<string, number> = {
      // Lost reasons endpoints can be slow (rate limits / retries). Don't start them unless we have runway.
      lost_reasons: 80000
    };

    const results: Record<string, number> = {};
    const errors: Record<string, string> = {};
    const skipped: string[] = [];

    for (let idx = 0; idx < entities.length; idx += 1) {
      const entity = entities[idx];
      const estimate = entityEstimatesMs[entity] ?? 0;
      if (budget.shouldStop(estimate)) {
        skipped.push(...entities.slice(idx));
        break;
      }
      try {
        if (entity === 'contacts') {
          results.contacts = await syncContacts(
            client,
            integration.locationId,
            forceFullSync,
            budget,
            initialWindowDays
          );
        } else if (entity === 'opportunities') {
          results.opportunities = await syncOpportunities(
            client,
            integration.locationId,
            forceFullSync,
            budget,
            initialWindowDays
          );
        } else if (entity === 'appointments') {
          results.appointments = await syncAppointments(client, integration.locationId, forceFullSync, budget);
        } else if (entity === 'lost_reasons') {
          results.lost_reasons = await syncLostReasonLookup(client, integration.locationId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Sync for ${entity} failed:`, error);
        errors[entity] = message;
      }
    }

    const ok = Object.keys(errors).length === 0;

    return new Response(JSON.stringify({
      ok,
      results,
      errors,
      skipped,
      partial: skipped.length > 0,
      deadline_ms: budget.deadlineMs,
      force_full_sync: forceFullSync,
      initial_window_days: initialWindowDays
    }), {
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
