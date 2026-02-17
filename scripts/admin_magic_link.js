#!/usr/bin/env node
/**
 * Generate a Supabase magic-link without sending email (workaround for email rate limits).
 *
 * What it does:
 * - Loads Supabase URL from clients/<client>/env.dashboard.example
 * - Fetches the project's service role key via Supabase CLI
 * - Creates the Auth user if missing (email_confirm=true)
 * - Ensures the email is present in public.dashboard_access (allowlist), if table exists
 * - Generates a magic-link and prints the action_link (treat as secret)
 *
 * Usage:
 *   node scripts/admin_magic_link.js belivert user@domain.tld https://your-dashboard-domain.tld
 *
 * Notes:
 * - Requires Supabase CLI installed + authenticated (supabase login), or ~/.supabase/access-token present.
 * - The printed link grants access to that user; share it only with the intended recipient.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, readdir } from 'node:fs/promises';

import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const usage = () => {
  // eslint-disable-next-line no-console
  console.error(
    [
      'Usage:',
      '  node scripts/admin_magic_link.js <client> <email> [redirectTo]',
      '',
      'Examples:',
      '  node scripts/admin_magic_link.js belivert user@domain.tld https://dashboard.example.com',
      "  node scripts/admin_magic_link.js belivert user@domain.tld 'http://localhost:5173'"
    ].join('\n')
  );
};

const clientArg = String(process.argv[2] || '').trim();
const email = String(process.argv[3] || '').trim();
const redirectTo = String(process.argv[4] || '').trim();

if (!clientArg || !email || !email.includes('@')) {
  usage();
  process.exit(2);
}

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

const resolveClientEnvPath = async (clientNameOrSlug) => {
  const clientsDir = join(repoRoot, 'clients');
  const entries = await readdir(clientsDir, { withFileTypes: true });
  const nameLower = String(clientNameOrSlug).toLowerCase();

  const folder = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .find((name) => name.toLowerCase() === nameLower);

  if (!folder) {
    throw new Error(
      `Unknown client "${clientNameOrSlug}". Expected one of: ${entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
        .join(', ')}`
    );
  }

  return join(repoRoot, 'clients', folder, 'env.dashboard.example');
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
  if (message.includes('already') && message.includes('registered')) {
    return { ok: true, created: false, userId: null };
  }
  if (message.includes('duplicate') || message.includes('exists')) {
    return { ok: true, created: false, userId: null };
  }

  return { ok: false, created: false, userId: null, error };
};

const ensureDashboardAllowlist = async (admin, emailAddress) => {
  const normalized = String(emailAddress).trim().toLowerCase();
  if (!normalized) return { ok: true, inserted: false, skipped: true };

  const { error } = await admin.from('dashboard_access').upsert({ email: normalized }, { onConflict: 'email' });
  if (!error) return { ok: true, inserted: true };

  // For projects that don't have the allowlist migration yet.
  const message = (error?.message || String(error)).toLowerCase();
  if (message.includes('does not exist') || message.includes('relation') || message.includes('schema cache')) {
    return { ok: true, inserted: false, skipped: true };
  }

  return { ok: false, inserted: false, error };
};

const generateMagicLink = async (admin, emailAddress, redirectTarget) => {
  const payload = { type: 'magiclink', email: emailAddress };
  if (redirectTarget) payload.options = { redirectTo: redirectTarget };

  const { data, error } = await admin.auth.admin.generateLink(payload);
  if (error) throw error;

  const actionLink = data?.properties?.action_link || data?.properties?.actionLink;
  if (!actionLink) throw new Error('generateLink returned no action_link.');
  return String(actionLink);
};

const main = async () => {
  const envPath = await resolveClientEnvPath(clientArg);
  const env = await parseEnvFile(envPath);
  const supabaseUrl = env.VITE_SUPABASE_URL || '';
  const projectRef = extractProjectRef(supabaseUrl);

  if (!supabaseUrl || !projectRef) {
    throw new Error(`Missing VITE_SUPABASE_URL or invalid Supabase URL in ${envPath}`);
  }

  const serviceRoleKey = await fetchServiceRoleKey(projectRef);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const userResult = await ensureAuthUserExists(admin, email);
  if (!userResult.ok) {
    throw new Error(`Failed to create/ensure Auth user: ${userResult.error?.message || userResult.error}`);
  }

  const allowlist = await ensureDashboardAllowlist(admin, email);
  if (!allowlist.ok) {
    throw new Error(`Failed to upsert dashboard_access: ${allowlist.error?.message || allowlist.error}`);
  }

  const link = await generateMagicLink(admin, email, redirectTo);

  // eslint-disable-next-line no-console
  console.log(link);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`admin_magic_link failed: ${error?.message || error}`);
  process.exit(1);
});

