#!/usr/bin/env node
/**
 * Seed an email+password Supabase Auth user across one or more client projects.
 *
 * What it does (per client):
 * - Loads Supabase URL from clients/<client>/env.dashboard.example
 * - Fetches the project's service role key via Supabase CLI
 * - Creates (or updates) the Auth user with `email_confirm=true` + password
 * - Ensures the email is present in public.dashboard_access (allowlist), if table exists
 *
 * Usage:
 *   DASHBOARD_USER_PASSWORD='...' node scripts/admin_seed_password_user.js <client|all> <email> [password]
 *
 * Notes:
 * - Prefer passing the password via DASHBOARD_USER_PASSWORD to avoid shell history leaks.
 * - Requires Supabase CLI installed + authenticated (supabase login), or ~/.supabase/access-token present.
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
      '  node scripts/admin_seed_password_user.js <client|all> <email> [password]',
      '',
      'Examples:',
      "  DASHBOARD_USER_PASSWORD='...' node scripts/admin_seed_password_user.js all office@red-pepper.be",
      "  node scripts/admin_seed_password_user.js belivert office@red-pepper.be '...'"
    ].join('\n')
  );
};

const clientArg = String(process.argv[2] || '').trim();
const email = String(process.argv[3] || '').trim();
const passwordArg = String(process.argv[4] || '').trim();
const password = passwordArg || String(process.env.DASHBOARD_USER_PASSWORD || '').trim();

if (!clientArg || !email || !email.includes('@') || !password) {
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
  try {
    const hostname = new URL(String(supabaseUrl || '')).hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length < 3) return '';
    const [projectRef, domain, tld] = parts;
    if (!projectRef || domain !== 'supabase' || tld !== 'co') return '';
    return projectRef;
  } catch {
    return '';
  }
};

const listClients = async () => {
  const clientsDir = join(repoRoot, 'clients');
  const entries = await readdir(clientsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
};

const resolveClientEnvPath = async (clientNameOrSlug) => {
  const clients = await listClients();
  const nameLower = String(clientNameOrSlug).toLowerCase();
  const folder = clients.find((name) => name.toLowerCase() === nameLower);
  if (!folder) {
    throw new Error(`Unknown client "${clientNameOrSlug}". Expected one of: ${clients.join(', ')}`);
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

const isUserAlreadyRegisteredError = (error) => {
  const message = (error?.message || String(error)).toLowerCase();
  return (
    (message.includes('already') && message.includes('registered')) ||
    message.includes('duplicate') ||
    message.includes('exists')
  );
};

const findUserIdByEmail = async (admin, emailAddress) => {
  const normalized = String(emailAddress || '').trim().toLowerCase();
  if (!normalized) return null;

  let page = 1;
  const perPage = 200;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }
    const users = Array.isArray(data?.users) ? data.users : [];
    const match = users.find((user) => String(user?.email || '').trim().toLowerCase() === normalized);
    if (match?.id) return String(match.id);

    if (!data?.nextPage) break;
    page = Number(data.nextPage) || page + 1;
  }

  return null;
};

const ensureAuthUserWithPassword = async (admin, emailAddress, passwordValue) => {
  const { data, error } = await admin.auth.admin.createUser({
    email: emailAddress,
    password: passwordValue,
    email_confirm: true
  });

  if (!error) return { ok: true, created: true, updated: false, userId: data?.user?.id || null };

  if (!isUserAlreadyRegisteredError(error)) {
    return { ok: false, created: false, updated: false, userId: null, error };
  }

  const existingUserId = await findUserIdByEmail(admin, emailAddress);
  if (!existingUserId) {
    return { ok: false, created: false, updated: false, userId: null, error: new Error('User exists but id not found.') };
  }

  const update = await admin.auth.admin.updateUserById(existingUserId, {
    password: passwordValue,
    email_confirm: true
  });
  if (update.error) {
    return { ok: false, created: false, updated: false, userId: existingUserId, error: update.error };
  }

  return { ok: true, created: false, updated: true, userId: existingUserId };
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

const runForClient = async (clientName) => {
  const envPath = await resolveClientEnvPath(clientName);
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

  const userResult = await ensureAuthUserWithPassword(admin, email, password);
  if (!userResult.ok) {
    throw new Error(`Failed to create/update Auth user: ${userResult.error?.message || userResult.error}`);
  }

  const allowlist = await ensureDashboardAllowlist(admin, email);
  if (!allowlist.ok) {
    throw new Error(`Failed to upsert dashboard_access: ${allowlist.error?.message || allowlist.error}`);
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        client: clientName,
        projectRef,
        user: { email, created: userResult.created, updated: userResult.updated },
        allowlist: { inserted: Boolean(allowlist.inserted), skipped: Boolean(allowlist.skipped) }
      },
      null,
      2
    )
  );
};

const main = async () => {
  const clients = clientArg.toLowerCase() === 'all' ? await listClients() : [clientArg];
  for (const clientName of clients) {
    await runForClient(clientName);
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`admin_seed_password_user failed: ${error?.message || error}`);
  process.exit(1);
});
