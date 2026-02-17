#!/usr/bin/env node
/**
 * Apply Belivert-specific sales breakdown rules to dashboard_config via Supabase REST.
 *
 * Why:
 * - sales_product_category_rules + sales_region_rules live in dashboard_config and should be upserted
 *   without needing psql locally.
 * - We fetch the service role key via `supabase projects api-keys` to avoid pasting secrets into commands.
 *
 * Usage:
 *   node scripts/apply_belivert_sales_breakdown_config.js
 *   node scripts/apply_belivert_sales_breakdown_config.js --project-ref djikubaydznmgiqajfdz
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_PROJECT_REF = 'djikubaydznmgiqajfdz';
const BELIVERT_LOCATION_ID = 'PLaZB1vgUhy4CCo3vEDi';

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

const getServiceRoleKey = async (projectRef) => {
  const { stdout } = await execFileAsync(
    'supabase',
    ['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json'],
    { maxBuffer: 10 * 1024 * 1024 }
  );

  let items = [];
  try {
    items = JSON.parse(stdout);
  } catch (error) {
    throw new Error(`Unable to parse Supabase API keys JSON (${error?.message || error}).`);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No API keys returned by `supabase projects api-keys`.');
  }

  const secretItem =
    items.find((item) => item && item.type === 'secret' && item.api_key) ||
    items.find((item) => item && item.name === 'service_role' && item.api_key);
  const key = secretItem?.api_key ? String(secretItem.api_key) : '';
  if (!key) {
    throw new Error('Service role key not found in `supabase projects api-keys` output.');
  }
  return key;
};

const buildUpsertHeaders = (serviceRoleKey) => ({
  Prefer: 'resolution=merge-duplicates',
  'Content-Type': 'application/json; charset=utf-8',
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`
});

const upsertDashboardConfig = async ({ supabaseUrl, serviceRoleKey, row }) => {
  const url = new URL(`${supabaseUrl}/rest/v1/dashboard_config`);
  url.searchParams.set('on_conflict', 'id');

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: buildUpsertHeaders(serviceRoleKey),
    body: JSON.stringify([row])
  });

  const text = await response.text();
  if (!response.ok) {
    const trimmed = (text || '').slice(0, 600);
    throw new Error(`dashboard_config upsert failed (${response.status}): ${trimmed || 'No response body.'}`);
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const projectRef = String(args['project-ref'] || DEFAULT_PROJECT_REF).trim() || DEFAULT_PROJECT_REF;
  const supabaseUrl = `https://${projectRef}.supabase.co`;

  const serviceRoleKey = await getServiceRoleKey(projectRef);

  const row = {
    id: 1,
    location_id: BELIVERT_LOCATION_ID,
    sales_excluded_deal_keywords: ['service', 'onderhoud', 'herstelling', 'depannage', 'interventie'],
    sales_product_category_rules: [
      { category: 'Warmtepomp', title_any: ['warmtepomp', 'wp', 'heat pump'] },
      { category: 'Airco', title_any: ['airco', 'airconditioning', 'a/c'] },
      { category: 'Ventilatie', title_any: ['ventilatie', 'ventilatie-unit', 'type d', 'type c'] },
      { category: 'Zonnepanelen', title_any: ['zonnepanelen', 'pv', 'panelen', 'photovolta'] },
      { category: 'Batterij', title_any: ['batterij', 'thuisbatterij', 'storage'] },
      { category: 'Laadpaal', title_any: ['laadpaal', 'ev charger', 'charger'] },
      { category: 'Service', title_any: ['service', 'onderhoud', 'herstelling', 'depannage', 'interventie'] }
    ],
    sales_region_rules: [
      { region: 'Brussel', postal_ranges: [[1000, 1299]] },
      { region: 'Waals-Brabant', postal_ranges: [[1300, 1499]] },
      { region: 'Vlaams-Brabant', postal_ranges: [[1500, 1999], [3000, 3499]] },
      { region: 'Antwerpen', postal_ranges: [[2000, 2999]] },
      { region: 'Limburg', postal_ranges: [[3500, 3999]] },
      { region: 'Luik', postal_ranges: [[4000, 4999]] },
      { region: 'Namen', postal_ranges: [[5000, 5999]] },
      { region: 'Henegouwen', postal_ranges: [[6000, 6599], [7000, 7999]] },
      { region: 'Luxemburg', postal_ranges: [[6600, 6999]] },
      { region: 'West-Vlaanderen', postal_ranges: [[8000, 8999]] },
      { region: 'Oost-Vlaanderen', postal_ranges: [[9000, 9999]] }
    ],
    updated_at: new Date().toISOString()
  };

  await upsertDashboardConfig({ supabaseUrl, serviceRoleKey, row });
  // eslint-disable-next-line no-console
  console.log(`[apply_config] OK project=${projectRef} table=dashboard_config id=1`);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[apply_config] ERROR ${error?.message || error}`);
  process.exit(1);
});

