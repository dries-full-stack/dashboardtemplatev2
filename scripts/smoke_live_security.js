#!/usr/bin/env node
/**
 * Live smoke checks for Supabase auth + RLS after security hardening.
 *
 * What it does:
 * - Reads client env templates (Belivert + Recotex) to get Supabase URL + publishable key + location id.
 * - Uses Supabase CLI to fetch the service role key for each project.
 * - Ensures the provided email exists as an Auth user (invite-only dashboards require pre-created users).
 * - Generates a magic-link and extracts an access_token from the redirect, without printing secrets.
 * - Performs authenticated read checks against the key tables/views/RPCs used by the dashboard.
 *
 * Usage:
 *   node scripts/smoke_live_security.js dries@red-pepper.be
 *
 * Notes:
 * - This script performs only minimal, idempotent mutations: it may create the Auth user if missing.
 * - It does not write to dashboard tables.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const email = (process.argv[2] || '').trim();
if (!email || !email.includes('@')) {
  // eslint-disable-next-line no-console
  console.error('Usage: node scripts/smoke_live_security.js <email>');
  process.exit(2);
}

const redacted = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 10) return '***';
  return `${text.slice(0, 3)}***${text.slice(-3)}`;
};

const parseEnvFile = async (filePath) => {
  const raw = await readFile(filePath, 'utf-8');
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!key) continue;
    env[key] = value;
  }

  return env;
};

const extractProjectRef = (supabaseUrl) => {
  const match = String(supabaseUrl || '').match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] || '';
};

const fetchLocationIdFromConfig = async ({ supabaseUrl, publishableKey, accessToken }) => {
  const url = new URL(`${supabaseUrl}/rest/v1/dashboard_config`);
  url.searchParams.set('select', 'location_id');
  url.searchParams.set('id', 'eq.1');
  url.searchParams.set('limit', '1');

  const resp = await fetch(url.toString(), {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (!resp.ok) return null;
  const body = await resp.json();
  const row = Array.isArray(body) ? body[0] : body;
  const locationId = row && typeof row === 'object' ? row.location_id : null;
  return typeof locationId === 'string' && locationId.trim() ? locationId.trim() : null;
};

const loadClients = async () => {
  const clients = [
    { name: 'Belivert', envPath: join(repoRoot, 'clients', 'belivert', 'env.dashboard.example') },
    { name: 'Recotex', envPath: join(repoRoot, 'clients', 'Recotex', 'env.dashboard.example') },
    { name: 'Immo Beguin', envPath: join(repoRoot, 'clients', 'immobeguin', 'env.dashboard.example') }
  ];

  const resolved = [];
  for (const client of clients) {
    const env = await parseEnvFile(client.envPath);
    const supabaseUrl = env.VITE_SUPABASE_URL || '';
    const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    const locationId = env.VITE_GHL_LOCATION_ID || '';
    const projectRef = extractProjectRef(supabaseUrl);

    if (!supabaseUrl || !publishableKey || !projectRef) {
      throw new Error(
        `${client.name}: missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / projectRef in ${client.envPath}`
      );
    }

    resolved.push({
      name: client.name,
      envPath: client.envPath,
      projectRef,
      supabaseUrl,
      publishableKey,
      locationId
    });
  }

  return resolved;
};

const fetchServiceRoleKey = async (projectRef) => {
  const accessTokenPath = join(process.env.HOME || '', '.supabase', 'access-token');
  let accessToken = '';
  try {
    accessToken = (await readFile(accessTokenPath, 'utf-8')).trim();
  } catch {
    accessToken = '';
  }

  const env = { ...process.env };
  if (accessToken) env.SUPABASE_ACCESS_TOKEN = accessToken;

  const { stdout } = await execFileAsync(
    'supabase',
    ['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json'],
    { cwd: repoRoot, env }
  );

  const keys = JSON.parse(stdout || '[]');
  if (!Array.isArray(keys) || keys.length === 0) {
    throw new Error(`Supabase CLI returned no api keys for project ${projectRef}.`);
  }

  const apiKeyValue = (key) => String(key?.api_key || key?.key || key?.apiKey || '');
  const toKeyText = (key) =>
    `${key?.name || ''} ${key?.type || ''} ${key?.prefix || ''} ${key?.description || ''}`.toLowerCase();

  const serviceKey =
    keys.find((key) => key?.type === 'service_role')?.api_key ||
    apiKeyValue(keys.find((key) => toKeyText(key).includes('service') && toKeyText(key).includes('role'))) ||
    apiKeyValue(keys.find((key) => apiKeyValue(key).startsWith('sb_secret_')));

  if (!serviceKey) {
    throw new Error(`Unable to identify service role key for project ${projectRef} from CLI output.`);
  }

  return String(serviceKey);
};

const ensureAuthUserExists = async (admin, emailAddress) => {
  const { data, error } = await admin.auth.admin.createUser({
    email: emailAddress,
    email_confirm: true
  });

  if (!error) return { ok: true, created: true, userId: data?.user?.id || null };

  const message = (error?.message || String(error)).toLowerCase();
  // Gotrue typically returns variants like "User already registered".
  if (message.includes('already') && message.includes('registered')) {
    return { ok: true, created: false, userId: null };
  }

  // If createUser fails due to a conflict, treat as existing.
  if (message.includes('duplicate') || message.includes('exists')) {
    return { ok: true, created: false, userId: null };
  }

  return { ok: false, created: false, userId: null, error };
};

const generateAccessToken = async (admin, emailAddress) => {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: emailAddress
  });

  if (error) throw error;
  const actionLink = data?.properties?.action_link || data?.properties?.actionLink;
  if (!actionLink) {
    throw new Error('generateLink returned no action_link.');
  }

  let current = String(actionLink);
  for (let hop = 0; hop < 8; hop += 1) {
    const resp = await fetch(current, { method: 'GET', redirect: 'manual' });
    const location = resp.headers.get('location');
    if (!location) {
      const body = await resp.text();
      throw new Error(`Expected redirect from verify endpoint but got ${resp.status}. Body: ${body.slice(0, 200)}`);
    }

    const next = new URL(location, current).toString();
    const parsed = new URL(next);
    const hash = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    if (accessToken) return accessToken;
    current = next;
  }

  throw new Error('Unable to resolve access_token from magic-link redirects.');
};

const restGet = async ({ supabaseUrl, publishableKey, accessToken }, tableOrView) => {
  const url = new URL(`${supabaseUrl}/rest/v1/${tableOrView}`);
  url.searchParams.set('select', '*');
  url.searchParams.set('limit', '1');

  const resp = await fetch(url.toString(), {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  if (resp.ok) return { ok: true, status: resp.status };
  const text = await resp.text();
  return { ok: false, status: resp.status, error: text.slice(0, 200) };
};

const rpcCall = async ({ supabaseUrl, publishableKey, accessToken }, fnName, args) => {
  const resp = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(args ?? {})
  });

  if (resp.ok) return { ok: true, status: resp.status };
  const text = await resp.text();
  return { ok: false, status: resp.status, error: text.slice(0, 200) };
};

const REQUIRED_READS = [
  'dashboard_config',
  'opportunity_pipeline_lookup',
  'opportunities_view',
  'opportunities',
  'contacts_view',
  'contacts',
  'appointments_view',
  'appointments',
  'marketing_spend_daily',
  'marketing_spend_source_mapping',
  'marketing_spend_campaign_daily',
  'marketing_spend_adset_daily',
  'marketing_spend_ad_daily',
  'lost_reason_lookup',
  'lost_reason_overrides',
  'sync_state',
  'teamleader_deal_sources',
  'teamleader_lost_reasons',
  'teamleader_deal_phases',
  'teamleader_deals',
  'teamleader_companies',
  'teamleader_contacts',
  'teamleader_users',
  'teamleader_meetings'
];

const runForClient = async (client) => {
  const { name, projectRef, supabaseUrl, publishableKey } = client;
  let locationId = client.locationId;

  // eslint-disable-next-line no-console
  console.log(`\n[${name}] project=${projectRef} url=${supabaseUrl} publishable=${redacted(publishableKey)}`);

  const serviceRoleKey = await fetchServiceRoleKey(projectRef);
  // eslint-disable-next-line no-console
  console.log(`[${name}] service_role=${redacted(serviceRoleKey)} (fetched via supabase CLI)`);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const userResult = await ensureAuthUserExists(admin, email);
  if (!userResult.ok) {
    throw new Error(`[${name}] Failed to ensure auth user exists: ${userResult.error?.message || userResult.error}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[${name}] auth_user=${email} status=${userResult.created ? 'created' : 'exists'}`);

  const accessToken = await generateAccessToken(admin, email);
  // eslint-disable-next-line no-console
  console.log(`[${name}] access_token=${redacted(accessToken)} (generated via magic-link)`);

  const ctx = { supabaseUrl, publishableKey, accessToken };
  if (!locationId) {
    locationId = await fetchLocationIdFromConfig(ctx);
    if (locationId) {
      // eslint-disable-next-line no-console
      console.log(`[${name}] location_id=${locationId} (from dashboard_config)`);
    }
  }

  let okCount = 0;
  let failCount = 0;
  for (const tableOrView of REQUIRED_READS) {
    const result = await restGet(ctx, tableOrView);
    if (result.ok) {
      okCount += 1;
      // eslint-disable-next-line no-console
      console.log(`[${name}] read ${tableOrView}: OK (${result.status})`);
      continue;
    }
    failCount += 1;
    // eslint-disable-next-line no-console
    console.log(`[${name}] read ${tableOrView}: FAIL (${result.status}) ${result.error || ''}`.trim());
  }

  const start = '2018-01-01T00:00:00Z';
  const end = '2035-12-31T23:59:59Z';
  const rpcArgs = { p_location_id: locationId, p_start: start, p_end: end };

  if (locationId) {
    const lostCandidates = await rpcCall(ctx, 'get_lost_reason_id_candidates', rpcArgs);
    // eslint-disable-next-line no-console
    console.log(
      `[${name}] rpc get_lost_reason_id_candidates: ${lostCandidates.ok ? 'OK' : 'FAIL'} (${lostCandidates.status})`
    );
    if (!lostCandidates.ok) {
      // eslint-disable-next-line no-console
      console.log(`[${name}] rpc error: ${lostCandidates.error || ''}`.trim());
    }

    const finance = await rpcCall(ctx, 'get_finance_summary', rpcArgs);
    // eslint-disable-next-line no-console
    console.log(`[${name}] rpc get_finance_summary: ${finance.ok ? 'OK' : 'FAIL'} (${finance.status})`);
    if (!finance.ok) {
      // eslint-disable-next-line no-console
      console.log(`[${name}] rpc error: ${finance.error || ''}`.trim());
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(`[${name}] rpc checks skipped (missing location_id).`);
  }

  if (failCount > 0) {
    throw new Error(`[${name}] FAIL: ${failCount} read checks failed (${okCount} ok).`);
  }

  // eslint-disable-next-line no-console
  console.log(`[${name}] OK: ${okCount} read checks passed.`);
};

const main = async () => {
  const clients = await loadClients();

  for (const client of clients) {
    await runForClient(client);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`\nsmoke_live_security failed: ${error?.message || error}`);
  process.exit(1);
});
