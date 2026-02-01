import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type QueryValue = string | number | boolean | null | undefined;

type RequestOptions = {
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: unknown;
  version?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GhlClient {
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

        logger.warn(`GHL API rate limit or server error. Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } catch (error) {
        clearTimeout(timeout);
        if (attempt >= env.MAX_RETRIES) throw error;
        const backoff = env.RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 250);
        logger.warn(`GHL API request failed. Retrying in ${backoff}ms...`, error);
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
    query?: string;
  }) {
    return this.request<{ contacts: unknown[]; count?: number }>({
      method: 'GET',
      path: '/contacts/',
      query: {
        locationId: params.locationId,
        limit: params.limit,
        startAfter: params.startAfter ?? undefined,
        startAfterId: params.startAfterId ?? undefined,
        query: params.query
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

export const createGhlClient = (token: string) => new GhlClient(env.GHL_BASE_URL, token);
