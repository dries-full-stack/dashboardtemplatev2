#!/usr/bin/env node
/**
 * Apply SQL migrations to one or more Supabase projects using the Supabase Management API.
 *
 * Why:
 * - Avoid needing direct DB passwords/links for each project.
 * - Works well for "fleet" updates (Belivert/Recotex/Immo Beguin, ...).
 *
 * Requirements:
 * - A Supabase Personal Access Token (PAT) available as:
 *   - env var SUPABASE_ACCESS_TOKEN, OR
 *   - file ~/.supabase/access-token (Supabase CLI stores it here)
 *
 * Usage:
 *   node scripts/apply_migrations_management_api.js --project-ref <ref> --file supabase/migrations/2026....sql
 *   node scripts/apply_migrations_management_api.js --project-ref ref1,ref2 --file supabase/migrations/2026....sql
 *
 * Options:
 *   --dry-run   Print what would run, but do not execute queries.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('..', import.meta.url).pathname);

const redacted = (value) => {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 10) return '***';
  return `${text.slice(0, 3)}***${text.slice(-3)}`;
};

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
};

const readAccessToken = async () => {
  const fromEnv = (process.env.SUPABASE_ACCESS_TOKEN || '').trim();
  if (fromEnv) return fromEnv;

  const home = process.env.HOME || '';
  if (!home) return '';

  try {
    return (await readFile(resolve(home, '.supabase', 'access-token'), 'utf8')).trim();
  } catch {
    return '';
  }
};

const normalizeProjectRefs = (value) => {
  const raw = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  // De-dupe, keep order.
  const seen = new Set();
  return raw.filter((ref) => {
    if (seen.has(ref)) return false;
    seen.add(ref);
    return true;
  });
};

const normalizeFiles = (value) => {
  const raw = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  const seen = new Set();
  return raw
    .map((file) => resolve(repoRoot, file))
    .filter((file) => {
      if (seen.has(file)) return false;
      seen.add(file);
      return true;
    });
};

const runSql = async ({ projectRef, accessToken, sql, fileLabel }) => {
  const url = `https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/database/query`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (resp.ok) return { ok: true, status: resp.status };

  const text = await resp.text();
  return {
    ok: false,
    status: resp.status,
    error: `${fileLabel}: ${text.slice(0, 400)}`
  };
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);

  const projectRefs = normalizeProjectRefs(args['project-ref']);
  const files = normalizeFiles(args.file);

  if (projectRefs.length === 0 || files.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      'Usage: node scripts/apply_migrations_management_api.js --project-ref <ref[,ref2]> --file <path[,path2]> [--dry-run]'
    );
    process.exit(2);
  }

  const accessToken = await readAccessToken();
  if (!accessToken) {
    // eslint-disable-next-line no-console
    console.error('Missing SUPABASE_ACCESS_TOKEN and ~/.supabase/access-token. Run `supabase login` first.');
    process.exit(2);
  }

  // eslint-disable-next-line no-console
  console.log(`[apply_migrations] projects=${projectRefs.join(',')} files=${files.length} pat=${redacted(accessToken)}`);

  for (const filePath of files) {
    const sql = await readFile(filePath, 'utf8');
    const fileLabel = filePath.replace(`${repoRoot}/`, '');

    for (const projectRef of projectRefs) {
      // eslint-disable-next-line no-console
      console.log(`[apply_migrations] ${dryRun ? 'DRY' : 'RUN'} project=${projectRef} file=${fileLabel}`);
      if (dryRun) continue;

      const result = await runSql({ projectRef, accessToken, sql, fileLabel });
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.error(`[apply_migrations] FAIL status=${result.status} ${result.error || ''}`.trim());
        process.exit(1);
      }

      // eslint-disable-next-line no-console
      console.log(`[apply_migrations] OK status=${result.status}`);
    }
  }
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[apply_migrations] ERROR ${error?.message || error}`);
  process.exit(1);
});

