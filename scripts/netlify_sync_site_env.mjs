#!/usr/bin/env node
/**
 * Sync Netlify site-level environment variables from a .env-style file.
 *
 * Why this exists:
 * - This repo is a monorepo; dashboards are per-client by Netlify site env.
 * - Netlify CLI `netlify api getSiteEnvVars` is currently unreliable due to an
 *   OpenAPI path mismatch; we call the stable REST endpoints directly.
 *
 * Usage:
 *   node scripts/netlify_sync_site_env.mjs --site <site_id> --env-file <path>
 *
 * Auth:
 * - Uses NETLIFY_AUTH_TOKEN if present, else reads ~/.config/netlify/config.json
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';
const DEFAULT_SCOPES = ['builds', 'functions', 'post_processing', 'runtime'];

function parseArgs(argv) {
  const args = { siteId: null, envFile: null };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--site') {
      args.siteId = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
    if (token === '--env-file') {
      args.envFile = argv[i + 1] ?? null;
      i += 1;
      continue;
    }
  }
  return args;
}

function parseDotEnv(contents) {
  const out = new Map();
  const lines = contents.split(/\r?\n/);
  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1);
    if (!key) continue;
    out.set(key, value);
  }
  return out;
}

function loadNetlifyToken() {
  const envToken = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_TOKEN;
  if (envToken) return envToken;

  const configPath = path.join(os.homedir(), '.config', 'netlify', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const userId = cfg.userId;
  const token = cfg?.users?.[userId]?.auth?.token;
  if (!token) {
    throw new Error(`Unable to read Netlify auth token from ${configPath}`);
  }
  return token;
}

async function apiFetch(url, { token, method = 'GET', body } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : null)
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Netlify API ${method} ${url} failed: ${res.status} ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

async function main() {
  const { siteId, envFile } = parseArgs(process.argv.slice(2));
  if (!siteId || !envFile) {
    console.error('Usage: node scripts/netlify_sync_site_env.mjs --site <site_id> --env-file <path>');
    process.exit(1);
  }

  const token = loadNetlifyToken();
  const envContents = fs.readFileSync(envFile, 'utf8');
  const desired = parseDotEnv(envContents);

  if (desired.size === 0) {
    console.error(`No env vars found in ${envFile}`);
    process.exit(1);
  }

  const site = await apiFetch(`${NETLIFY_API_BASE}/sites/${encodeURIComponent(siteId)}`, { token });
  const accountId = site?.account_id;
  if (!accountId) throw new Error('Unable to determine account_id from site payload');

  const current = await apiFetch(
    `${NETLIFY_API_BASE}/accounts/${encodeURIComponent(accountId)}/env?site_id=${encodeURIComponent(siteId)}`,
    { token }
  );

  const currentByKey = new Map();
  for (const item of Array.isArray(current) ? current : []) {
    if (item?.key) currentByKey.set(item.key, item);
  }

  const toCreate = [];
  const toUpdate = [];

  for (const [key, value] of desired.entries()) {
    const existing = currentByKey.get(key);
    if (!existing) {
      toCreate.push({ key, value });
      continue;
    }
    const existingValue = existing?.values?.find((v) => v?.context === 'all')?.value ?? null;
    if (existingValue !== value) {
      toUpdate.push({ key, value });
    }
  }

  if (toCreate.length) {
    const payload = toCreate.map(({ key, value }) => ({
      key,
      scopes: DEFAULT_SCOPES,
      values: [{ context: 'all', value: value ?? '' }],
      is_secret: false
    }));
    await apiFetch(
      `${NETLIFY_API_BASE}/accounts/${encodeURIComponent(accountId)}/env?site_id=${encodeURIComponent(siteId)}`,
      { token, method: 'POST', body: payload }
    );
  }

  for (const { key, value } of toUpdate) {
    await apiFetch(
      `${NETLIFY_API_BASE}/accounts/${encodeURIComponent(accountId)}/env/${encodeURIComponent(key)}?site_id=${encodeURIComponent(siteId)}`,
      { token, method: 'PATCH', body: { context: 'all', value: value ?? '' } }
    );
  }

  console.log(
    JSON.stringify(
      {
        site: { id: siteId, name: site?.name ?? null, url: site?.url ?? null },
        envFile,
        desiredKeys: desired.size,
        created: toCreate.length,
        updated: toUpdate.length
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

