import { config } from 'dotenv';

config();

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.length > 0 ? value : fallback;
};

const parseNumber = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Invalid number for env var ${key}: ${raw}`);
  }
  return value;
};

const parseBool = (key: string, fallback: boolean): boolean => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const normalized = raw.toLowerCase();
  return ['true', '1', 'yes', 'y'].includes(normalized);
};

const normalizeUrl = (value: string): string => value.replace(/\/$/, '');

const syncBatchSize = Math.min(100, Math.max(1, parseNumber('SYNC_BATCH_SIZE', 100)));

export const env = {
  GHL_LOCATION_ID: optional('GHL_LOCATION_ID', ''),
  GHL_PRIVATE_INTEGRATION_TOKEN: optional('GHL_PRIVATE_INTEGRATION_TOKEN', ''),
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: required('SUPABASE_PUBLISHABLE_KEY'),
  SUPABASE_SECRET_KEY: required('SUPABASE_SECRET_KEY'),

  GHL_BASE_URL: normalizeUrl(optional('GHL_BASE_URL', 'https://services.leadconnectorhq.com')),
  GHL_API_VERSION: optional('GHL_API_VERSION', '2021-07-28'),
  GHL_CALENDARS_VERSION: optional('GHL_CALENDARS_VERSION', '2021-04-15'),

  SYNC_BATCH_SIZE: syncBatchSize,
  REQUEST_TIMEOUT_MS: parseNumber('REQUEST_TIMEOUT_MS', 30000),
  MAX_RETRIES: parseNumber('MAX_RETRIES', 5),
  RETRY_BASE_DELAY_MS: parseNumber('RETRY_BASE_DELAY_MS', 1000),

  FULL_SYNC: parseBool('FULL_SYNC', false),
  RUN_ONCE: parseBool('RUN_ONCE', false),
  SYNC_INTERVAL_MINUTES: parseNumber('SYNC_INTERVAL_MINUTES', 15),
  PRUNE_ON_FULL_SYNC: parseBool('PRUNE_ON_FULL_SYNC', true),
  FULL_SYNC_INTERVAL_HOURS: parseNumber('FULL_SYNC_INTERVAL_HOURS', 24),
  CONTACTS_REFRESH_DAYS: parseNumber('CONTACTS_REFRESH_DAYS', 30),
  OPPORTUNITIES_REFRESH_DAYS: parseNumber('OPPORTUNITIES_REFRESH_DAYS', 30),
  APPOINTMENTS_LOOKBACK_DAYS: parseNumber('APPOINTMENTS_LOOKBACK_DAYS', 365),
  APPOINTMENTS_LOOKAHEAD_DAYS: parseNumber('APPOINTMENTS_LOOKAHEAD_DAYS', 365),

  LOG_LEVEL: optional('LOG_LEVEL', 'info')
};
