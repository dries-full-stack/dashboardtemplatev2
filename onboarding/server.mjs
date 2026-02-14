import { createServer } from 'http';
import { readFile, writeFile, rename, stat, mkdir } from 'fs/promises';
import { spawn } from 'child_process';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import os from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, 'public');
const repoRoot = join(__dirname, '..');
const bootstrapScript = join(repoRoot, 'scripts', 'bootstrap-client.ps1');

dotenv.config({ path: join(repoRoot, '.env.local') });

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

let isRunning = false;
let isSyncing = false;
let isTeamleaderSyncing = false;
let isMetaSyncing = false;
let isGoogleSyncing = false;
let isGoogleSheetSyncing = false;
let lastOnboardingState = null;
let dashboardProcess = null;
let dashboardOutput = '';
const dashboardDir = join(repoRoot, 'dashboard');

const sendJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
};

const serveStatic = async (res, filePath) => {
  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const runCommand = (command, args, cwd, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      env: options.env || process.env
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({ ok: false, exitCode: 1, stdout, stderr: `${stderr}\n${error.message}`.trim() });
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, exitCode: code ?? 1, stdout, stderr });
    });
  });

// Use shell=false for commands that contain user-provided secrets (passwords, tokens).
const runCommandDirect = (command, args, cwd, options = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      env: options.env || process.env
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve({
        ok: false,
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${error instanceof Error ? error.message : String(error)}`.trim(),
        error
      });
    });
    child.on('close', (code) => {
      resolve({ ok: code === 0, exitCode: code ?? 1, stdout, stderr });
    });
  });

const sanitizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const resolvePowerShellCommand = () => {
  const explicit = sanitizeString(process.env.ONBOARDING_POWERSHELL_BIN);
  if (explicit) return explicit;
  return process.platform === 'win32' ? 'powershell' : 'pwsh';
};

const applyEnvDefaults = (payload) => {
  const assignIfMissing = (key, envKey) => {
    if (!payload[key] && process.env[envKey]) {
      payload[key] = process.env[envKey];
    }
  };

  assignIfMissing('accessToken', 'SUPABASE_ACCESS_TOKEN');
  assignIfMissing('netlifyAuthToken', 'NETLIFY_AUTH_TOKEN');
  assignIfMissing('serviceRoleKey', 'SUPABASE_SERVICE_ROLE_JWT');
  assignIfMissing('serviceRoleKey', 'SUPABASE_SECRET_KEY');
  assignIfMissing('publishableKey', 'SUPABASE_PUBLISHABLE_KEY');
  assignIfMissing('ghlPrivateIntegrationToken', 'GHL_PRIVATE_INTEGRATION_TOKEN');
  assignIfMissing('metaAccessToken', 'META_ACCESS_TOKEN');
  assignIfMissing('metaAdAccountId', 'META_AD_ACCOUNT_ID');
  assignIfMissing('metaTimezone', 'META_TIMEZONE');
  assignIfMissing('googleDeveloperToken', 'GOOGLE_ADS_DEVELOPER_TOKEN');
  assignIfMissing('googleClientId', 'GOOGLE_ADS_CLIENT_ID');
  assignIfMissing('googleClientSecret', 'GOOGLE_ADS_CLIENT_SECRET');
  assignIfMissing('googleRefreshToken', 'GOOGLE_ADS_REFRESH_TOKEN');
  assignIfMissing('googleCustomerId', 'GOOGLE_ADS_CUSTOMER_ID');
  assignIfMissing('googleLoginCustomerId', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID');
  assignIfMissing('googleTimezone', 'GOOGLE_TIMEZONE');
  assignIfMissing('sheetCsvUrl', 'SHEET_CSV_URL');
  assignIfMissing('sheetHeaderRow', 'SHEET_HEADER_ROW');
  assignIfMissing('dbPassword', 'SUPABASE_DB_PASSWORD');
  assignIfMissing('githubToken', 'GITHUB_TOKEN');
};

const fileExists = async (filePath) => {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
};

const writeDashboardEnvFile = async (payload) => {
  const supabaseUrl =
    payload.supabaseUrl ||
    (payload.projectRef ? `https://${payload.projectRef}.supabase.co` : '');
  const publishableKey = payload.publishableKey || '';
  const locationId = payload.locationId || '';

  if (!supabaseUrl || !locationId) {
    return { ok: false, error: 'Supabase URL en location ID zijn vereist.' };
  }
  if (!publishableKey) {
    return { ok: false, error: 'Publishable key ontbreekt.' };
  }

  const envLines = [
    `VITE_SUPABASE_URL=${supabaseUrl}`,
    `VITE_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
    `VITE_GHL_LOCATION_ID=${locationId}`,
    'VITE_ENABLE_MOCK_DATA=false'
  ];

  const envPath = join(repoRoot, 'dashboard', '.env');
  let backupPath = '';
  if (await fileExists(envPath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    backupPath = `${envPath}.bak-${stamp}`;
    await rename(envPath, backupPath);
  }

  await writeFile(envPath, envLines.join('\n') + '\n', 'utf-8');
  return { ok: true, path: envPath, backupPath };
};

const checkDashboardReady = async () => {
  try {
    const response = await fetch('http://localhost:5173', { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

const startDashboardDevServer = async () => {
  if (dashboardProcess && !dashboardProcess.killed) {
    return { ok: true, status: 'already-running' };
  }

  const nodeModulesPath = join(dashboardDir, 'node_modules');
  const hasNodeModules = await fileExists(nodeModulesPath);
  if (!hasNodeModules) {
    const installResult = await runCommand('npm', ['install'], dashboardDir);
    if (!installResult.ok) {
      return { ok: false, status: 'install-failed', output: installResult };
    }
  }

  const child = spawn('npm', ['run', 'dev', '--', '--host'], { cwd: dashboardDir, shell: true });
  dashboardProcess = child;
  dashboardOutput = '';

  child.stdout.on('data', (chunk) => {
    dashboardOutput += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    dashboardOutput += chunk.toString();
  });
  child.on('close', (code) => {
    dashboardProcess = null;
    dashboardOutput += `\n[dashboard] exited with ${code ?? 'unknown'}`;
  });

  return { ok: true, status: 'started' };
};

const buildSupabaseRestHeaders = (serviceRoleKey) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };
  if (serviceRoleKey) {
    headers.apikey = serviceRoleKey;
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
};

const parseContentRangeCount = (value) => {
  if (!value) return null;
  const match = String(value).match(/\/(\d+)$/);
  if (!match?.[1]) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const toDateOnly = (value) => {
  if (!(value instanceof Date)) return '';
  return value.toISOString().slice(0, 10);
};

const fetchRestCount = async (supabaseUrl, serviceRoleKey, path, query = {}) => {
  const url = new URL(`${supabaseUrl}/rest/v1/${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    url.searchParams.set(key, String(value));
  });
  if (!url.searchParams.has('select')) url.searchParams.set('select', 'id');
  if (!url.searchParams.has('limit')) url.searchParams.set('limit', '1');

  const headers = {
    ...buildSupabaseRestHeaders(serviceRoleKey),
    Prefer: 'count=exact'
  };

  const response = await fetch(url.toString(), { headers });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    count: parseContentRangeCount(response.headers.get('content-range')),
    data: json,
    raw: text
  };
};

const callRpc = async (supabaseUrl, serviceRoleKey, fnName, args) => {
  const url = `${supabaseUrl}/rest/v1/rpc/${fnName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: buildSupabaseRestHeaders(serviceRoleKey),
    body: JSON.stringify(args ?? {})
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, data: json, raw: text };
};

const normalizeSourceText = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const SOURCE_BUCKET_ORDER = [
  'Solvari',
  'Bobex',
  'Trustlocal',
  'Bambelo',
  'Facebook Ads',
  'Google Ads',
  'Organic',
  'Overig'
];

const suggestSourceBucket = (rawValue) => {
  const text = normalizeSourceText(rawValue);
  const lower = text.toLowerCase();
  if (!lower) return 'Organic';
  if (lower === 'onbekend' || lower === 'unknown' || lower === 'n/a') return 'Overig';

  if (lower.includes('solvari')) return 'Solvari';
  if (lower.includes('bobex')) return 'Bobex';
  if (lower.includes('trustlocal') || lower.includes('trust local')) return 'Trustlocal';
  if (lower.includes('bambelo')) return 'Bambelo';

  if (
    lower.includes('facebook') ||
    lower.includes('instagram') ||
    lower.includes('meta') ||
    lower.includes('fbclid') ||
    lower.includes('meta - calculator') ||
    lower.includes('meta ads - calculator')
  ) {
    return 'Facebook Ads';
  }

  if (
    lower.includes('google') ||
    lower.includes('adwords') ||
    lower.includes('gclid') ||
    lower.includes('cpc') ||
    lower.includes('google - woning prijsberekening')
  ) {
    return 'Google Ads';
  }

  if (
    lower.includes('organic') ||
    lower.includes('seo') ||
    lower.includes('direct') ||
    lower.includes('referral') ||
    lower.includes('(none)') ||
    lower.includes('website')
  ) {
    return 'Organic';
  }

  return 'Overig';
};

const resolveOnboardingContext = (data = {}) => {
  const supabaseUrl = sanitizeString(data.supabaseUrl) || lastOnboardingState?.supabaseUrl || '';
  const projectRef =
    sanitizeString(data.projectRef) ||
    extractProjectRef(supabaseUrl) ||
    lastOnboardingState?.projectRef ||
    '';
  const locationId = sanitizeString(data.locationId) || lastOnboardingState?.locationId || '';
  const serviceRoleKey =
    sanitizeString(data.serviceRoleKey) ||
    lastOnboardingState?.serviceRoleKey ||
    process.env.SUPABASE_SERVICE_ROLE_JWT ||
    process.env.SUPABASE_SECRET_KEY ||
    '';

  const resolvedUrl = supabaseUrl || (projectRef ? `https://${projectRef}.supabase.co` : '');
  return { supabaseUrl: resolvedUrl, projectRef, locationId, serviceRoleKey };
};

const extractProjectRef = (supabaseUrl) => {
  if (!supabaseUrl) return '';
  const trimmed = supabaseUrl.trim();
  if (/^[a-z0-9-]+$/i.test(trimmed)) {
    return trimmed;
  }
  const urlMatch = trimmed.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (urlMatch?.[1]) return urlMatch[1];
  const hostMatch = trimmed.match(/^([a-z0-9-]+)\.supabase\.co/i);
  if (hostMatch?.[1]) return hostMatch[1];
  return '';
};

const fetchSupabaseKeys = async (projectRef, accessToken) => {
  const token = sanitizeString(accessToken);
  if (token) {
    const looksLikeJwt = token.startsWith('eyJ');
    const looksLikeSecret = token.startsWith('sb_secret_');
    const looksLikePublishable = token.startsWith('sb_publishable_');
    const looksLikePat = token.startsWith('sbp_');
    if (!looksLikePat && (looksLikeJwt || looksLikeSecret || looksLikePublishable)) {
      throw new Error(
        'Supabase access token lijkt een project API key (sb_secret_/sb_publishable_/eyJ...). ' +
          'Vul dit in bij "Server key" (of "Publishable key"). Voor "Supabase access token" heb je een Personal Access Token nodig (meestal sbp_...) van je Supabase account.'
      );
    }
  }

  const env = accessToken
    ? { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken }
    : process.env;

  const result = await runCommand(
    'supabase',
    ['projects', 'api-keys', '--project-ref', projectRef, '--output', 'json'],
    repoRoot,
    { env }
  );

  if (!result.ok) {
    const combined = `${result.stdout || ''}
${result.stderr || ''}`.trim();
    const lower = combined.toLowerCase();
    const hint = lower.includes('jwt could not be decoded')
      ? ' Hint: vul bij "Supabase access token" je Personal Access Token (sbp_...) in, niet je server/service key.'
      : '';
    throw new Error(
      `Supabase API keys ophalen via CLI faalde. ${combined || 'Controleer supabase login.'}${hint}`
    );
  }

  const raw = (result.stdout || '').trim();
  let data = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!Array.isArray(data)) {
    throw new Error('Supabase CLI api-keys response is ongeldig (geen array).');
  }

  return data;
};

const pickSupabaseKeys = (keys) => {
  const toKeyText = (key) =>
    `${key?.name || ''} ${key?.type || ''} ${key?.prefix || ''} ${key?.description || ''}`.toLowerCase();
  const apiKeyValue = (key) => (key?.api_key || key?.key || '').toString();

  const isJwt = (key) => apiKeyValue(key).startsWith('eyJ');
  const isSecret = (key) => apiKeyValue(key).startsWith('sb_secret_') || toKeyText(key).includes('secret');
  const isPublishable =
    (key) => apiKeyValue(key).startsWith('sb_publishable_') || toKeyText(key).includes('publishable');
  const isServiceRole = (key) =>
    toKeyText(key).includes('service_role') || toKeyText(key).includes('service role');
  const isAnon = (key) => toKeyText(key).includes('anon') || toKeyText(key).includes('public');

  const legacyServiceRole = keys.find((key) => isJwt(key) && isServiceRole(key));
  const legacyAnon = keys.find((key) => isJwt(key) && isAnon(key));

  const publishable =
    keys.find((key) => isPublishable(key)) ||
    legacyAnon;

  const serviceRole =
    legacyServiceRole ||
    keys.find((key) => apiKeyValue(key).startsWith('sb_secret_')) ||
    keys.find((key) => isServiceRole(key)) ||
    keys.find((key) => isSecret(key));

  return {
    publishableKey: publishable ? apiKeyValue(publishable) : '',
    serviceRoleKey: serviceRole ? apiKeyValue(serviceRole) : ''
  };
};

const buildArgs = (payload) => {
  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    bootstrapScript,
    '-Slug',
    payload.slug,
    '-ProjectRef',
    payload.projectRef,
    '-LocationId',
    payload.locationId
  ];

  const addString = (flag, value) => {
    if (!value) return;
    args.push(flag, value);
  };

  addString('-SupabaseUrl', payload.supabaseUrl);
  addString('-DashboardTitle', payload.dashboardTitle);
  addString('-DashboardSubtitle', payload.dashboardSubtitle);
  addString('-LogoUrl', payload.logoUrl);
  if (payload.brandColorsEnabled) {
    addString('-BrandPrimaryColor', payload.brandPrimaryColor);
    addString('-BrandSecondaryColor', payload.brandSecondaryColor);
  }
  addString('-DashboardTabs', payload.dashboardTabs);
  addString('-AccessToken', payload.accessToken);
  addString('-GhlPrivateIntegrationToken', payload.ghlPrivateIntegrationToken);
  addString('-DbPassword', payload.dbPassword);
  addString('-ServiceRoleKey', payload.serviceRoleKey);
  addString('-PublishableKey', payload.publishableKey);
  addString('-TeamleaderClientId', payload.teamleaderClientId);
  addString('-TeamleaderClientSecret', payload.teamleaderClientSecret);
  addString('-TeamleaderRedirectUrl', payload.teamleaderRedirectUrl);
  addString('-TeamleaderScopes', payload.teamleaderScopes);
  addString('-MetaAccessToken', payload.metaAccessToken);
  addString('-MetaAdAccountId', payload.metaAdAccountId);
  addString('-MetaTimezone', payload.metaTimezone);
  addString('-GoogleSpendMode', payload.googleSpendMode);
  addString('-GoogleDeveloperToken', payload.googleDeveloperToken);
  addString('-GoogleClientId', payload.googleClientId);
  addString('-GoogleClientSecret', payload.googleClientSecret);
  addString('-GoogleRefreshToken', payload.googleRefreshToken);
  addString('-GoogleCustomerId', payload.googleCustomerId);
  addString('-GoogleLoginCustomerId', payload.googleLoginCustomerId);
  addString('-GoogleTimezone', payload.googleTimezone);
  addString('-SheetCsvUrl', payload.sheetCsvUrl);
  addString('-SheetHeaderRow', payload.sheetHeaderRow);
  addString('-BranchName', payload.branchName);
  addString('-BaseBranch', payload.baseBranch);
  addString('-NetlifyAccountSlug', payload.netlifyAccountSlug);
  addString('-NetlifyRepo', payload.netlifyRepo);
  addString('-NetlifyRepoProvider', payload.netlifyRepoProvider);
  addString('-NetlifyRepoBranch', payload.netlifyRepoBranch);
  addString('-NetlifyBuildCommand', payload.netlifyBuildCommand);
  addString('-NetlifyPublishDir', payload.netlifyPublishDir);
  addString('-NetlifyBaseDir', payload.netlifyBaseDir);
  addString('-NetlifyCustomDomain', payload.netlifyCustomDomain);
  addString('-NetlifyDomainAliases', payload.netlifyDomainAliases);
  addString('-NetlifyDnsZoneName', payload.netlifyDnsZoneName);
  addString('-NetlifyDnsZoneId', payload.netlifyDnsZoneId);
  addString('-NetlifyDnsHost', payload.netlifyDnsHost);
  addString('-NetlifyDnsValue', payload.netlifyDnsValue);
  if (payload.netlifyDnsTtl) {
    addString('-NetlifyDnsTtl', String(payload.netlifyDnsTtl));
  }
  addString('-NetlifySiteId', payload.netlifySiteId);
  addString('-NetlifySiteName', payload.netlifySiteName);
  addString('-NetlifyAuthToken', payload.netlifyAuthToken);
  addString('-NetlifyEnvFile', payload.netlifyEnvFile);
  addString('-GitHubToken', payload.githubToken);

  const addSwitch = (flag, enabled) => {
    if (enabled) args.push(flag);
  };

  addSwitch('-NoLayout', payload.noLayout);
  addSwitch('-ApplyConfig', payload.applyConfig);
  addSwitch('-CreateBranch', payload.createBranch);
  addSwitch('-PushBranch', payload.pushBranch);
  addSwitch('-LinkProject', payload.linkProject);
  addSwitch('-PushSchema', payload.pushSchema);
  addSwitch('-DeployFunctions', payload.deployFunctions);
  addSwitch('-EnableMetaSpend', payload.metaEnabled);
  addSwitch('-NetlifySyncEnv', payload.netlifySyncEnv);
  addSwitch('-NetlifyReplaceEnv', payload.netlifyReplaceEnv);
  addSwitch('-NetlifyCreateSite', payload.netlifyCreateSite);
  addSwitch('-NetlifySetProdBranch', payload.netlifySetProdBranch);
  addSwitch('-NetlifyCreateDnsRecord', payload.netlifyCreateDnsRecord);
  addSwitch('-NetlifyTriggerDeploy', payload.netlifyTriggerDeploy);

  return args;
};

const validatePayload = (payload) => {
  const errors = [];
  if (!payload.slug) errors.push('Slug is verplicht.');
  if (!payload.projectRef) {
    errors.push(payload.supabaseUrl ? 'Supabase URL is ongeldig.' : 'Supabase URL is verplicht.');
  }
  if (!payload.locationId) errors.push('Location ID is verplicht.');
  const tabs = payload.dashboardTabs
    ? payload.dashboardTabs.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  if (!tabs.length) {
    errors.push('Selecteer minstens een dashboard.');
  }

  const needsCli = payload.linkProject || payload.pushSchema || payload.deployFunctions;
  if (needsCli && !payload.accessToken) {
    errors.push('Access token is vereist voor CLI acties (link/push/deploy).');
  }
  const needsDbPassword = payload.linkProject || payload.pushSchema;
  if (needsDbPassword && !payload.dbPassword) {
    errors.push('DB password is vereist voor link/push.');
  }
  const canAutoFetchKeys = payload.autoFetchKeys && payload.accessToken;
  const serviceRoleKey = payload.serviceRoleKey || '';
  const trimmedServerKey = serviceRoleKey.trim();
  const isAccessToken = trimmedServerKey.startsWith('sbp_');
  const hasServerKey =
    trimmedServerKey.startsWith('eyJ') || trimmedServerKey.startsWith('sb_secret_');
  if (isAccessToken) {
    errors.push('Gebruik hier geen access token (sbp_). Gebruik sb_secret_ of legacy eyJ.');
  }
  if ((payload.applyConfig || payload.ghlPrivateIntegrationToken) && !hasServerKey) {
    errors.push('Secret key (sb_secret_) of legacy service_role JWT (eyJ) is vereist voor Apply config/GHL opslag.');
  }
  const wantsTeamleader = Boolean(payload.teamleaderEnabled);
  if (wantsTeamleader) {
    if (!payload.accessToken) {
      errors.push('Supabase access token is vereist om Teamleader secrets te zetten.');
    }
    if (!payload.teamleaderClientId) {
      errors.push('Teamleader client ID is verplicht (zet de checkbox uit als je dit niet wil).');
    }
    if (!payload.teamleaderClientSecret) {
      errors.push('Teamleader client secret is verplicht (zet de checkbox uit als je dit niet wil).');
    }
  }

  const wantsMeta = Boolean(payload.metaEnabled);
  if (wantsMeta) {
    if (!payload.accessToken) {
      errors.push('Supabase access token is vereist om Meta secrets te zetten.');
    }
    if (!payload.metaAccessToken) {
      errors.push('Meta access token is verplicht (zet de toggle uit als je dit niet wil).');
    }
    if (!payload.metaAdAccountId) {
      errors.push('Meta ad account ID is verplicht (zet de toggle uit als je dit niet wil).');
    }
  }

  const googleMode = sanitizeString(payload.googleSpendMode).toLowerCase() || 'none';
  if (googleMode === 'api') {
    if (!payload.accessToken) {
      errors.push('Supabase access token is vereist om Google Ads secrets te zetten.');
    }
    if (!payload.googleDeveloperToken) errors.push('Google developer token is verplicht (of kies een andere Google methode).');
    if (!payload.googleClientId) errors.push('Google client id is verplicht (of kies een andere Google methode).');
    if (!payload.googleClientSecret) errors.push('Google client secret is verplicht (of kies een andere Google methode).');
    if (!payload.googleRefreshToken) errors.push('Google refresh token is verplicht (of kies een andere Google methode).');
    if (!payload.googleCustomerId) errors.push('Google Ads customer id is verplicht (of kies een andere Google methode).');
  } else if (googleMode === 'sheet') {
    if (!payload.accessToken) {
      errors.push('Supabase access token is vereist om Google Sheet secrets te zetten.');
    }
    if (!payload.sheetCsvUrl) errors.push('Google Sheet CSV URL is verplicht (of kies geen Google kosten sync).');
  } else if (googleMode !== 'none') {
    errors.push('Google spend mode is ongeldig.');
  }
  if (payload.netlifySyncEnv) {
    if (!payload.netlifySiteId && !payload.netlifySiteName && !payload.netlifyCreateSite) {
      errors.push('Netlify site id of naam is vereist voor env sync.');
    }
  }
  if (payload.netlifyCreateSite && !payload.netlifyAuthToken) {
    errors.push('Netlify auth token is vereist om een site automatisch aan te maken.');
  }
  if (payload.netlifySetProdBranch && !payload.netlifySiteId && !payload.netlifySiteName && !payload.netlifyCreateSite) {
    errors.push('Netlify site id is vereist om production branch te zetten (of laat site automatisch aanmaken).');
  }
  if (payload.netlifyCustomDomain && !payload.netlifySiteId && !payload.netlifySiteName && !payload.netlifyCreateSite) {
    errors.push('Netlify site id of naam is vereist om custom domain te zetten (of laat site automatisch aanmaken).');
  }
  if (payload.netlifyCreateDnsRecord && !payload.netlifyAuthToken) {
    errors.push('Netlify auth token is vereist om DNS records te beheren.');
  }
  if (payload.netlifyTriggerDeploy && !payload.netlifyAuthToken) {
    errors.push('Netlify auth token is vereist om een build te triggeren.');
  }
  return errors;
};

const toSqlString = (value) => {
  const trimmed = sanitizeString(value);
  if (!trimmed) return 'null';
  return `'${trimmed.replaceAll("'", "''")}'`;
};

const normalizeHexColor = (value) => {
  const raw = sanitizeString(value);
  if (!raw) return '';

  const shortMatch = /^#?([0-9a-f]{3})$/i.exec(raw);
  if (shortMatch?.[1]) {
    const expanded = shortMatch[1]
      .split('')
      .map((ch) => `${ch}${ch}`)
      .join('');
    return `#${expanded.toLowerCase()}`;
  }

  const fullMatch = /^#?([0-9a-f]{6})$/i.exec(raw);
  if (fullMatch?.[1]) {
    return `#${fullMatch[1].toLowerCase()}`;
  }

  return '';
};

const resolveBrandTheme = (payload) => {
  const candidate = `${payload.slug} ${payload.dashboardTitle} ${payload.logoUrl}`.toLowerCase();
  if (candidate.includes('belivert') || candidate.includes('belivet')) return 'belivert';
  return '';
};

const buildBelivertSourceNormalizationRules = () => ([
  { bucket: 'Solvari', patterns: ['solvari'] },
  { bucket: 'Bobex', patterns: ['bobex'] },
  { bucket: 'Trustlocal', patterns: ['trustlocal', 'trust local'] },
  { bucket: 'Bambelo', patterns: ['bambelo'] },
  {
    bucket: 'Facebook Ads',
    patterns: ['facebook', 'instagram', 'meta', 'fbclid', 'meta - calculator', 'meta ads - calculator']
  },
  { bucket: 'Google Ads', patterns: ['google', 'adwords', 'gclid', 'cpc', 'google - woning prijsberekening'] },
  { bucket: 'Organic', patterns: ['organic', 'seo', 'direct', 'referral', '(none)', 'website'] }
]);

const buildDashboardLayout = (payload, themeKey, brandPrimaryValue, brandSecondaryValue) => {
  if (payload.noLayout) return null;

  const selectedTabs = sanitizeString(payload.dashboardTabs)
    .split(',')
    .map((tab) => tab.trim().toLowerCase())
    .filter(Boolean);

  const enabledTabs = selectedTabs.length ? selectedTabs : ['lead', 'sales', 'call-center'];
  const dashboards = [
    { id: 'lead', label: 'Leadgeneratie', enabled: enabledTabs.includes('lead') },
    { id: 'sales', label: 'Sales Resultaten', enabled: enabledTabs.includes('sales') },
    { id: 'call-center', label: 'Call Center', enabled: enabledTabs.includes('call-center') }
  ];

  const layout = {
    dashboards,
    sections: [
      {
        kind: 'funnel_metrics',
        title: 'Leads & afspraken',
        metric_labels: ['Totaal Leads', 'Totaal Afspraken', 'Confirmed', 'Cancelled', 'No-Show', 'Lead -> Afspraak']
      },
      { kind: 'source_breakdown', title: 'Kanalen' },
      {
        kind: 'finance_metrics',
        title: 'Kosten',
        metric_labels: ['Totale Leadkosten', 'Kost per Lead']
      },
      { kind: 'hook_performance', title: 'Ad Hook Performance' },
      { kind: 'lost_reasons', title: 'Verliesredenen' }
    ],
    behavior: {
      appointments_provider: themeKey === 'belivert' ? 'teamleader_meetings' : 'ghl',
      source_breakdown: {
        variant: themeKey === 'belivert' ? 'deals' : 'default',
        cost_denominator: themeKey === 'belivert' ? 'deals' : 'confirmed'
      },
      hook_performance: {
        source_bucket_filter: themeKey === 'belivert' ? 'Facebook Ads' : null
      }
    }
  };

  if (themeKey) {
    layout.theme = themeKey;
  }

  if (brandPrimaryValue || brandSecondaryValue) {
    const colors = {};
    if (brandPrimaryValue) colors.primary = brandPrimaryValue;
    if (brandSecondaryValue) colors.secondary = brandSecondaryValue;
    layout.branding = { colors };
  }

  return layout;
};

const buildClientDashboardConfigSql = (payload, layoutJson, sourceNormalizationRulesJson) => {
  const layoutSql = layoutJson ? `$$\n${layoutJson}\n$$::jsonb` : 'null';

  let normalizationColumns = '';
  let normalizationValues = '';
  let normalizationUpdate = '';
  if (sourceNormalizationRulesJson) {
    normalizationColumns = `,\n  source_normalization_rules`;
    normalizationValues = `,\n  $$\n${sourceNormalizationRulesJson}\n$$::jsonb`;
    normalizationUpdate = `,\n  source_normalization_rules = excluded.source_normalization_rules`;
  }

  return `-- Client dashboard_config for ${payload.slug}
-- Run this in Supabase SQL editor (or via CLI).
insert into public.dashboard_config (
  id,
  location_id,
  dashboard_title,
  dashboard_subtitle,
  dashboard_logo_url,
  dashboard_layout${normalizationColumns}
)
values (
  1,
  ${toSqlString(payload.locationId)},
  ${toSqlString(payload.dashboardTitle)},
  ${toSqlString(payload.dashboardSubtitle)},
  ${toSqlString(payload.logoUrl)},
  ${layoutSql}${normalizationValues}
)
on conflict (id) do update set
  location_id = excluded.location_id,
  dashboard_title = excluded.dashboard_title,
  dashboard_subtitle = excluded.dashboard_subtitle,
  dashboard_logo_url = excluded.dashboard_logo_url,
  dashboard_layout = excluded.dashboard_layout${normalizationUpdate},
  updated_at = now();
`;
};

const writeClientScaffold = async (payload) => {
  const clientDir = join(repoRoot, 'clients', payload.slug);
  await mkdir(clientDir, { recursive: true });

  const themeKey = resolveBrandTheme(payload);
  const brandPrimaryValue = normalizeHexColor(payload.brandPrimaryColor);
  const brandSecondaryValue = normalizeHexColor(payload.brandSecondaryColor);

  const sourceNormalizationRules = themeKey === 'belivert' ? buildBelivertSourceNormalizationRules() : null;
  const sourceNormalizationRulesJson = sourceNormalizationRules ? JSON.stringify(sourceNormalizationRules, null, 2) : '';

  const layoutObject = buildDashboardLayout(payload, themeKey, brandPrimaryValue, brandSecondaryValue);
  const layoutJson = layoutObject ? JSON.stringify(layoutObject, null, 2) : '';

  if (layoutJson) {
    await writeFile(join(clientDir, 'dashboard_layout.json'), layoutJson + '\n', 'utf-8');
  }

  const configSql = buildClientDashboardConfigSql(
    payload,
    layoutJson,
    sourceNormalizationRulesJson
  );
  await writeFile(join(clientDir, 'dashboard_config.sql'), configSql, 'utf-8');

  const publishableValue = sanitizeString(payload.publishableKey) || 'YOUR_SUPABASE_PUBLISHABLE_KEY';
  const envDashboardLines = [
    `VITE_SUPABASE_URL=${payload.supabaseUrl}`,
    `VITE_SUPABASE_PUBLISHABLE_KEY=${publishableValue}`,
    `VITE_GHL_LOCATION_ID=${payload.locationId}`,
    `VITE_DASHBOARD_TITLE=${sanitizeString(payload.dashboardTitle)}`,
    `VITE_DASHBOARD_SUBTITLE=${sanitizeString(payload.dashboardSubtitle)}`,
    `VITE_DASHBOARD_LOGO_URL=${sanitizeString(payload.logoUrl)}`,
    `VITE_DASHBOARD_THEME=${themeKey}`
  ];
  if (brandPrimaryValue) envDashboardLines.push(`VITE_DASHBOARD_PRIMARY_COLOR=${brandPrimaryValue}`);
  if (brandSecondaryValue) envDashboardLines.push(`VITE_DASHBOARD_SECONDARY_COLOR=${brandSecondaryValue}`);
  await writeFile(join(clientDir, 'env.dashboard.example'), envDashboardLines.join('\n') + '\n', 'utf-8');

  const envSync = [
    `GHL_LOCATION_ID=${payload.locationId}`,
    'GHL_PRIVATE_INTEGRATION_TOKEN=YOUR_GHL_PRIVATE_INTEGRATION_TOKEN',
    `SUPABASE_URL=${payload.supabaseUrl}`,
    `SUPABASE_PUBLISHABLE_KEY=${publishableValue}`,
    'SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY'
  ].join('\n') + '\n';
  await writeFile(join(clientDir, 'env.sync.example'), envSync, 'utf-8');

  const scheduleSql = buildScheduleSql(payload);
  await writeFile(join(clientDir, 'schedule.sql'), scheduleSql, 'utf-8');

  return {
    clientDir,
    themeKey,
    layoutObject,
    sourceNormalizationRules
  };
};

const buildScheduleSql = (payload) => {
  const projectRef = sanitizeString(payload.projectRef);
  const blocks = [];

  blocks.push(`-- Schedule GHL sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
select
  cron.schedule(
    'ghl-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/ghl-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('entities', array['contacts','opportunities','appointments','lost_reasons'])
      ) as request_id;
    $$
  );
`);

  const enableTeamleader =
    Boolean(payload.teamleaderEnabled) &&
    Boolean(payload.teamleaderClientId) &&
    Boolean(payload.teamleaderClientSecret);
  if (enableTeamleader) {
    blocks.push(`-- Schedule Teamleader sync every 15 minutes (requires pg_cron + pg_net extensions enabled).
select
  cron.schedule(
    'teamleader-sync-15m',
    '*/15 * * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/teamleader-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object(
          'lookback_months', 12,
          'entities', array['users','contacts','companies','deal_pipelines','deal_phases','lost_reasons','deals','meetings']
        )
      ) as request_id;
    $$
  );
`);
  }

  const enableMeta =
    Boolean(payload.metaEnabled) &&
    Boolean(payload.metaAccessToken) &&
    Boolean(payload.metaAdAccountId);
  if (enableMeta) {
    blocks.push(`-- Schedule Meta spend sync daily (pg_cron runs in UTC; adjust for CET/CEST).
select
  cron.schedule(
    'meta-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/meta-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
`);
  }

  const googleMode = sanitizeString(payload.googleSpendMode).toLowerCase() || 'none';
  const enableGoogleApi =
    googleMode === 'api' &&
    Boolean(payload.googleDeveloperToken) &&
    Boolean(payload.googleClientId) &&
    Boolean(payload.googleClientSecret) &&
    Boolean(payload.googleRefreshToken) &&
    Boolean(payload.googleCustomerId);
  const enableGoogleSheet = googleMode === 'sheet' && Boolean(payload.sheetCsvUrl);

  if (enableGoogleApi) {
    blocks.push(`-- Schedule Google Ads API spend sync daily (pg_cron runs in UTC; adjust for CET/CEST).
select
  cron.schedule(
    'google-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
`);
  } else if (enableGoogleSheet) {
    blocks.push(`-- Schedule Google Sheets spend sync daily (same schedule as Meta; pg_cron runs in UTC; adjust for CET/CEST).
select
  cron.schedule(
    'google-sheet-sync-daily',
    '15 2 * * *',
    $$
    select
      net.http_post(
        url := 'https://PROJECT_REF.supabase.co/functions/v1/google-sheet-sync',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body := jsonb_build_object('lookback_days', 7, 'end_offset_days', 1)
      ) as request_id;
    $$
  );
`);
  }

  let sql = blocks.join('\n\n').trim() + '\n';
  if (projectRef) {
    sql = sql.replaceAll('PROJECT_REF', projectRef);
  }
  return sql;
};

const buildSupabaseUpsertHeaders = (publishableKey, serviceRoleKey) => {
  const publishable = sanitizeString(publishableKey);
  const service = sanitizeString(serviceRoleKey);
  const isSecret = service.startsWith('sb_secret_');

  const headers = {
    Prefer: 'resolution=merge-duplicates',
    'Content-Type': 'application/json; charset=utf-8'
  };

  const apiKeyValue = isSecret ? service : publishable || service;
  if (apiKeyValue) {
    headers.apikey = apiKeyValue;
  }
  if (service && service.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${service}`;
  } else if (service && isSecret) {
    // sb_secret_ is accepted as bearer token too (supabase-js style).
    headers.Authorization = `Bearer ${service}`;
  }

  return headers;
};

const supabaseUpsert = async ({ supabaseUrl, publishableKey, serviceRoleKey, table, onConflict, row }) => {
  const url = new URL(`${supabaseUrl}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set('on_conflict', onConflict);
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: buildSupabaseUpsertHeaders(publishableKey, serviceRoleKey),
    body: JSON.stringify([row])
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { ok: response.ok, status: response.status, data: json, raw: text };
};

const runNodeBootstrap = async (payload) => {
  const stdout = [];
  const stderr = [];

  const log = (line = '') => {
    stdout.push(String(line));
  };
  const warn = (line = '') => {
    stderr.push(String(line));
  };

  log('[onboarding] PowerShell niet gevonden. Node bootstrap runner gestart.');

  let scaffold = null;
  try {
    scaffold = await writeClientScaffold(payload);
    log(`[scaffold] Geschreven: ${scaffold.clientDir}`);
  } catch (error) {
    warn(`[scaffold] Fout: ${error instanceof Error ? error.message : String(error)}`);
  }

  const env = payload.accessToken
    ? { ...process.env, SUPABASE_ACCESS_TOKEN: payload.accessToken }
    : process.env;

  const safeAppendOutput = (result) => {
    const out = sanitizeString(result?.stdout);
    const err = sanitizeString(result?.stderr);
    if (out) log(out);
    if (err) warn(err);
  };

  if (payload.accessToken) {
    log('[supabase] Login via token...');
    const result = await runCommandDirect(
      'supabase',
      ['login', '--token', payload.accessToken, '--no-browser'],
      repoRoot,
      { env }
    );
    safeAppendOutput(result);
    if (!result.ok) {
      throw new Error('Supabase login faalde. Controleer je access token (sbp_...).');
    }
  }

  if (payload.linkProject) {
    log('[supabase] Link project...');
    const result = await runCommandDirect(
      'supabase',
      ['link', '--project-ref', payload.projectRef, '--password', payload.dbPassword],
      repoRoot,
      { env }
    );
    safeAppendOutput(result);
    if (!result.ok) {
      throw new Error('Supabase link faalde. Controleer project ref + DB password.');
    }
  }

  if (payload.pushSchema) {
    log('[supabase] Push base schema (db push)...');
    const result = await runCommandDirect(
      'supabase',
      ['db', 'push', '--yes', '--password', payload.dbPassword],
      repoRoot,
      { env }
    );
    safeAppendOutput(result);
    if (!result.ok) {
      throw new Error('Supabase db push faalde.');
    }
  }

  const secrets = [];
  if (payload.teamleaderEnabled) {
    secrets.push({ key: 'TEAMLEADER_CLIENT_ID', value: payload.teamleaderClientId });
    secrets.push({ key: 'TEAMLEADER_CLIENT_SECRET', value: payload.teamleaderClientSecret });
    secrets.push({ key: 'TEAMLEADER_REDIRECT_URL', value: payload.teamleaderRedirectUrl });
    if (payload.teamleaderScopes) secrets.push({ key: 'TEAMLEADER_SCOPES', value: payload.teamleaderScopes });
  }

  if (payload.metaEnabled) {
    secrets.push({ key: 'META_ACCESS_TOKEN', value: payload.metaAccessToken });
    secrets.push({ key: 'META_AD_ACCOUNT_ID', value: payload.metaAdAccountId });
    secrets.push({ key: 'META_LOCATION_ID', value: payload.locationId });
    if (payload.metaTimezone) secrets.push({ key: 'META_TIMEZONE', value: payload.metaTimezone });
  }

  const googleMode = sanitizeString(payload.googleSpendMode).toLowerCase() || 'none';
  if (googleMode === 'api') {
    secrets.push({ key: 'GOOGLE_ADS_DEVELOPER_TOKEN', value: payload.googleDeveloperToken });
    secrets.push({ key: 'GOOGLE_ADS_CLIENT_ID', value: payload.googleClientId });
    secrets.push({ key: 'GOOGLE_ADS_CLIENT_SECRET', value: payload.googleClientSecret });
    secrets.push({ key: 'GOOGLE_ADS_REFRESH_TOKEN', value: payload.googleRefreshToken });
    secrets.push({ key: 'GOOGLE_ADS_CUSTOMER_ID', value: payload.googleCustomerId });
    secrets.push({ key: 'GOOGLE_LOCATION_ID', value: payload.locationId });
    if (payload.googleLoginCustomerId) {
      secrets.push({ key: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID', value: payload.googleLoginCustomerId });
    }
    if (payload.googleTimezone) secrets.push({ key: 'GOOGLE_TIMEZONE', value: payload.googleTimezone });
  } else if (googleMode === 'sheet') {
    secrets.push({ key: 'SHEET_CSV_URL', value: payload.sheetCsvUrl });
    secrets.push({ key: 'SHEET_LOCATION_ID', value: payload.locationId });
    if (payload.sheetHeaderRow && Number(payload.sheetHeaderRow) > 0) {
      secrets.push({ key: 'SHEET_HEADER_ROW', value: String(payload.sheetHeaderRow) });
    }
  }

  const secretsArgs = secrets
    .map((item) => ({ key: sanitizeString(item.key), value: sanitizeString(item.value) }))
    .filter((item) => item.key && item.value)
    .map((item) => `${item.key}=${item.value}`);

  if (secretsArgs.length) {
    log('[supabase] Secrets zetten...');
    const result = await runCommandDirect(
      'supabase',
      ['secrets', 'set', '--project-ref', payload.projectRef, ...secretsArgs],
      repoRoot,
      { env }
    );
    safeAppendOutput(result);
    if (!result.ok) {
      throw new Error('Supabase secrets set faalde.');
    }
  }

  if (payload.applyConfig) {
    log('[supabase] dashboard_config upsert via REST...');

    const row = {
      id: 1,
      location_id: payload.locationId,
      dashboard_title: payload.dashboardTitle || null,
      dashboard_subtitle: payload.dashboardSubtitle || null,
      dashboard_logo_url: payload.logoUrl || null,
      dashboard_layout: scaffold?.layoutObject ?? null
    };

    if (Array.isArray(scaffold?.sourceNormalizationRules) && scaffold.sourceNormalizationRules.length) {
      row.source_normalization_rules = scaffold.sourceNormalizationRules;
    }

    const result = await supabaseUpsert({
      supabaseUrl: payload.supabaseUrl,
      publishableKey: payload.publishableKey,
      serviceRoleKey: payload.serviceRoleKey,
      table: 'dashboard_config',
      onConflict: 'id',
      row
    });

    if (!result.ok) {
      warn(result.raw || '');
      throw new Error(`dashboard_config upsert faalde (${result.status}). Run eerst base schema (db push).`);
    }
    log('[supabase] dashboard_config OK.');
  }

  if (payload.ghlPrivateIntegrationToken) {
    log('[supabase] GHL integratie upsert via REST...');
    const row = {
      location_id: payload.locationId,
      private_integration_token: payload.ghlPrivateIntegrationToken,
      active: true,
      updated_at: new Date().toISOString()
    };
    const result = await supabaseUpsert({
      supabaseUrl: payload.supabaseUrl,
      publishableKey: payload.publishableKey,
      serviceRoleKey: payload.serviceRoleKey,
      table: 'ghl_integrations',
      onConflict: 'location_id',
      row
    });
    if (!result.ok) {
      warn(result.raw || '');
      throw new Error(`GHL integratie opslaan faalde (${result.status}).`);
    }
    log('[supabase] GHL integratie OK.');
  }

  if (payload.deployFunctions) {
    log('[supabase] Edge functions deployen...');
    const functions = ['ghl-sync', 'meta-sync', 'google-sync', 'google-sheet-sync', 'teamleader-oauth', 'teamleader-sync'];
    for (const fnName of functions) {
      log(`[supabase] Deploy ${fnName}...`);
      const result = await runCommandDirect(
        'supabase',
        ['functions', 'deploy', fnName, '--project-ref', payload.projectRef],
        repoRoot,
        { env }
      );
      safeAppendOutput(result);
      if (!result.ok) {
        throw new Error(`Deploy faalde voor ${fnName}.`);
      }
    }
  }

  return {
    ok: true,
    exitCode: 0,
    stdout: stdout.join('\n').trim() + '\n',
    stderr: stderr.join('\n').trim()
  };
};

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (req.method === 'POST' && req.url === '/api/source-suggestions') {
    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const context = resolveOnboardingContext(data);

      if (!context.supabaseUrl || !context.locationId) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL en location ID zijn vereist.' });
        return;
      }

      let serviceRoleKey = context.serviceRoleKey;
      if (!serviceRoleKey) {
        const accessToken =
          sanitizeString(data.accessToken) ||
          process.env.SUPABASE_ACCESS_TOKEN ||
          '';
        if (context.projectRef && accessToken) {
          try {
            const keys = await fetchSupabaseKeys(context.projectRef, accessToken);
            const picked = pickSupabaseKeys(keys);
            serviceRoleKey = picked.serviceRoleKey || '';
          } catch (error) {
            serviceRoleKey = '';
          }
        }
      }

      if (!serviceRoleKey) {
        sendJson(res, 400, { ok: false, error: 'Service role key ontbreekt (vul server key in of zet access token).' });
        return;
      }

      const url = new URL(`${context.supabaseUrl}/rest/v1/opportunities_view`);
      url.searchParams.set('select', 'source_guess,created_at');
      url.searchParams.set('location_id', `eq.${context.locationId}`);
      url.searchParams.set('order', 'created_at.desc.nullslast');
      url.searchParams.set('limit', '5000');

      const response = await fetch(url.toString(), {
        headers: buildSupabaseRestHeaders(serviceRoleKey)
      });
      const text = await response.text();
      let rows = null;
      try {
        rows = JSON.parse(text);
      } catch {
        rows = null;
      }

      if (!response.ok) {
        const message =
          (rows && (rows.message || rows.error || rows.details)) ||
          text ||
          `Supabase request faalde (${response.status}).`;
        sendJson(res, response.status, {
          ok: false,
          error:
            String(message).toLowerCase().includes('opportunities_view') ||
            String(message).toLowerCase().includes('relation')
              ? 'opportunities_view ontbreekt. Run eerst base schema + een GHL sync.'
              : `Supabase error: ${message}`
        });
        return;
      }

      const list = Array.isArray(rows) ? rows : [];
      const counts = new Map();
      list.forEach((row) => {
        const raw = normalizeSourceText(row?.source_guess) || 'Onbekend';
        counts.set(raw, (counts.get(raw) || 0) + 1);
      });

      const sourceRowsAll = Array.from(counts.entries())
        .map(([raw, count]) => ({
          raw,
          count,
          suggested: suggestSourceBucket(raw)
        }))
        .sort((a, b) => {
          const diff = (b.count ?? 0) - (a.count ?? 0);
          if (diff) return diff;
          return String(a.raw ?? '').localeCompare(String(b.raw ?? ''));
        });

      const sources = sourceRowsAll.slice(0, 40);

      const bucketCounts = new Map();
      sourceRowsAll.forEach((row) => {
        const bucket = row.suggested || 'Organic';
        bucketCounts.set(bucket, (bucketCounts.get(bucket) || 0) + (Number(row.count) || 0));
      });

      const buckets = Array.from(bucketCounts.entries())
        .map(([bucket, count]) => ({ bucket, count }))
        .sort((a, b) => {
          const aIdx = SOURCE_BUCKET_ORDER.indexOf(a.bucket);
          const bIdx = SOURCE_BUCKET_ORDER.indexOf(b.bucket);
          if (aIdx !== -1 || bIdx !== -1) {
            return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
          }
          return String(a.bucket ?? '').localeCompare(String(b.bucket ?? ''));
        });

      sendJson(res, 200, {
        ok: true,
        sampledRows: list.length,
        sources,
        buckets
      });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/preflight') {
    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');

      const payload = {
        supabaseUrl: sanitizeString(data.supabaseUrl),
        projectRef: sanitizeString(data.projectRef),
        locationId: sanitizeString(data.locationId),
        accessToken: sanitizeString(data.accessToken),
        dbPassword: sanitizeString(data.dbPassword),
        serviceRoleKey: sanitizeString(data.serviceRoleKey),
        autoFetchKeys: Boolean(data.autoFetchKeys),
        runMigrations: Boolean(data.runMigrations),
        applyConfig: Boolean(data.applyConfig),
        deployFunctions: Boolean(data.deployFunctions),
        installCronSchedules: Boolean(data.installCronSchedules),
        autoHealthCheck: Boolean(data.autoHealthCheck),
        netlifyEnabled: Boolean(data.netlifyEnabled),
        netlifySyncEnv: Boolean(data.netlifySyncEnv),
        netlifyCreateSite: Boolean(data.netlifyCreateSite),
        netlifyTriggerDeploy: Boolean(data.netlifyTriggerDeploy)
      };

      applyEnvDefaults(payload);
      const context = resolveOnboardingContext({
        ...data,
        serviceRoleKey: payload.serviceRoleKey
      });

      const checks = [];
      const addCheck = (id, label, status, details) => {
        checks.push({
          id,
          label,
          status,
          details: String(details ?? '').trim()
        });
      };

      const firstLine = (value) => String(value ?? '').trim().split(/\r?\n/)[0].slice(0, 240);

      const supabaseCli = await runCommand('supabase', ['--version'], repoRoot);
      addCheck(
        'supabase-cli',
        'Supabase CLI',
        supabaseCli.ok ? 'ok' : 'error',
        supabaseCli.ok
          ? firstLine(supabaseCli.stdout || supabaseCli.stderr)
          : firstLine(supabaseCli.stderr || supabaseCli.stdout || 'Supabase CLI niet gevonden.')
      );

      const node = await runCommand('node', ['--version'], repoRoot);
      addCheck(
        'node',
        'Node',
        node.ok ? 'ok' : 'error',
        node.ok ? firstLine(node.stdout || node.stderr) : firstLine(node.stderr || node.stdout || 'Node niet gevonden.')
      );

      const git = await runCommand('git', ['--version'], repoRoot);
      addCheck(
        'git',
        'Git',
        git.ok ? 'ok' : 'warn',
        git.ok ? firstLine(git.stdout || git.stderr) : firstLine(git.stderr || git.stdout || 'Git niet gevonden.')
      );

      if (payload.netlifyEnabled || payload.netlifySyncEnv || payload.netlifyCreateSite || payload.netlifyTriggerDeploy) {
        const netlify = await runCommand('netlify', ['status'], repoRoot);
        const combined = `${netlify.stdout || ''}\n${netlify.stderr || ''}`.toLowerCase();
        let tone = netlify.ok ? 'ok' : 'warn';
        let message = firstLine(netlify.stdout || netlify.stderr || '');
        if (combined.includes('not logged in') || combined.includes('logged out')) {
          tone = 'warn';
          message = 'Niet ingelogd in Netlify CLI.';
        } else if (combined.includes('not recognized') || combined.includes('command not found')) {
          tone = 'error';
          message = 'Netlify CLI niet gevonden.';
        } else if (!message) {
          message = netlify.ok ? 'Netlify status OK.' : 'Netlify status onduidelijk.';
        }
        addCheck('netlify', 'Netlify CLI', tone, message);
      }

      addCheck(
        'project-ref',
        'Project ref',
        context.projectRef ? 'ok' : 'error',
        context.projectRef ? context.projectRef : 'Kan project ref niet afleiden uit Supabase URL.'
      );

      addCheck(
        'location-id',
        'Location ID',
        context.locationId ? 'ok' : 'error',
        context.locationId ? context.locationId : 'Location ID ontbreekt.'
      );

      if (context.projectRef && payload.accessToken) {
        try {
          const keys = await fetchSupabaseKeys(context.projectRef, payload.accessToken);
          addCheck('access-token', 'Access token', 'ok', `Kan Supabase API keys lezen (${keys.length} keys).`);
          if (payload.autoFetchKeys) {
            const picked = pickSupabaseKeys(keys);
            addCheck(
              'auto-fetch-keys',
              'Auto fetch keys',
              picked.publishableKey && picked.serviceRoleKey ? 'ok' : 'warn',
              picked.publishableKey && picked.serviceRoleKey
                ? 'Publishable + service role key gevonden.'
                : 'Kon niet beide keys vinden in Supabase API response.'
            );
          }
        } catch (error) {
          addCheck(
            'access-token',
            'Access token',
            'error',
            error instanceof Error ? error.message : 'Supabase API keys ophalen faalde.'
          );
        }
      } else if (payload.accessToken || process.env.SUPABASE_ACCESS_TOKEN) {
        addCheck('access-token', 'Access token', 'warn', 'Project ref ontbreekt, kan token niet testen.');
      } else if (payload.deployFunctions || payload.runMigrations) {
        addCheck('access-token', 'Access token', 'warn', 'Geen access token ingevuld (CLI acties zullen falen).');
      } else {
        addCheck('access-token', 'Access token', 'ok', 'Niet nodig voor deze run (geen CLI acties).');
      }

      const serviceRoleKey = payload.serviceRoleKey || context.serviceRoleKey || '';
      if (context.supabaseUrl && serviceRoleKey) {
        const probe = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'dashboard_config', {
          select: 'id',
          limit: '1'
        });
        if (probe.ok) {
          addCheck('service-role', 'Server key', 'ok', 'Supabase REST access OK.');
        } else if (probe.status === 404) {
          addCheck('service-role', 'Server key', 'warn', 'dashboard_config ontbreekt (run base schema).');
        } else if (probe.status === 401 || probe.status === 403) {
          addCheck('service-role', 'Server key', 'error', 'Server key lijkt ongeldig (401/403).');
        } else {
          addCheck('service-role', 'Server key', 'warn', `Supabase REST probe faalde (${probe.status}).`);
        }
      } else if (payload.applyConfig || payload.installCronSchedules || payload.autoHealthCheck) {
        addCheck('service-role', 'Server key', 'error', 'Server key ontbreekt (nodig voor config/cron/health checks).');
      } else {
        addCheck('service-role', 'Server key', 'ok', 'Niet ingevuld (ok zolang je geen config/health checks nodig hebt).');
      }

      if (payload.runMigrations) {
        const hasDbPassword = Boolean(payload.dbPassword) || Boolean(process.env.SUPABASE_DB_PASSWORD);
        addCheck(
          'db-password',
          'DB password',
          hasDbPassword ? 'ok' : 'error',
          hasDbPassword ? 'Ingevuld.' : 'DB password ontbreekt (nodig voor supabase link/db push).'
        );
      }

      if (payload.installCronSchedules && context.supabaseUrl && serviceRoleKey) {
        const cronProbe = await callRpc(context.supabaseUrl, serviceRoleKey, 'cron_health', {});
        if (cronProbe.ok && cronProbe.data?.ok) {
          addCheck(
            'cron-health',
            'Cron RPC',
            cronProbe.data.pg_cron && cronProbe.data.pg_net ? 'ok' : 'warn',
            `pg_cron: ${cronProbe.data.pg_cron ? 'aan' : 'uit'}, pg_net: ${cronProbe.data.pg_net ? 'aan' : 'uit'}`
          );
        } else if (cronProbe.status === 404) {
          addCheck('cron-health', 'Cron RPC', 'warn', 'cron_health RPC ontbreekt (push base schema migrations).');
        } else {
          addCheck('cron-health', 'Cron RPC', 'warn', `cron_health faalde (${cronProbe.status}).`);
        }
      }

      sendJson(res, 200, { ok: true, checks });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/onboard') {
    if (isRunning) {
      sendJson(res, 409, { error: 'Er draait al een onboarding run.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const supabaseUrl = sanitizeString(data.supabaseUrl);
      const explicitRef = sanitizeString(data.projectRef);
      const derivedRef = explicitRef || extractProjectRef(supabaseUrl);
      if (supabaseUrl && explicitRef) {
        const urlRef = extractProjectRef(supabaseUrl);
        if (urlRef && urlRef !== explicitRef) {
          sendJson(res, 400, { error: 'Supabase URL en project ref komen niet overeen.' });
          return;
        }
      }
      const payload = {
        slug: sanitizeString(data.slug),
        supabaseUrl,
        projectRef: derivedRef,
        locationId: sanitizeString(data.locationId),
        dashboardTitle: sanitizeString(data.dashboardTitle),
        dashboardSubtitle: sanitizeString(data.dashboardSubtitle),
        logoUrl: sanitizeString(data.logoUrl),
        dashboardTabs: sanitizeString(data.dashboardTabs),
        autoFetchKeys: Boolean(data.autoFetchKeys),
        accessToken: sanitizeString(data.accessToken),
        ghlPrivateIntegrationToken: sanitizeString(data.ghlPrivateIntegrationToken),
        dbPassword: sanitizeString(data.dbPassword),
        serviceRoleKey: sanitizeString(data.serviceRoleKey),
        publishableKey: sanitizeString(data.publishableKey),
        teamleaderClientId: sanitizeString(data.teamleaderClientId),
        teamleaderClientSecret: sanitizeString(data.teamleaderClientSecret),
        teamleaderRedirectUrl: sanitizeString(data.teamleaderRedirectUrl),
        teamleaderScopes: sanitizeString(data.teamleaderScopes),
        teamleaderEnabled: Boolean(data.teamleaderEnabled ?? data.enableTeamleader),
        metaAccessToken: sanitizeString(data.metaAccessToken),
        metaAdAccountId: sanitizeString(data.metaAdAccountId),
        metaTimezone: sanitizeString(data.metaTimezone),
        metaEnabled: Boolean(data.metaEnabled ?? data.enableMetaSpend),
        googleSpendMode: sanitizeString(data.googleSpendMode),
        googleDeveloperToken: sanitizeString(data.googleDeveloperToken),
        googleClientId: sanitizeString(data.googleClientId),
        googleClientSecret: sanitizeString(data.googleClientSecret),
        googleRefreshToken: sanitizeString(data.googleRefreshToken),
        googleCustomerId: sanitizeString(data.googleCustomerId),
        googleLoginCustomerId: sanitizeString(data.googleLoginCustomerId),
        googleTimezone: sanitizeString(data.googleTimezone),
        sheetCsvUrl: sanitizeString(data.sheetCsvUrl),
        sheetHeaderRow: sanitizeString(data.sheetHeaderRow),
        createBranch: Boolean(data.createBranch),
        pushBranch: Boolean(data.pushBranch),
        branchName: sanitizeString(data.branchName),
        baseBranch: sanitizeString(data.baseBranch),
        netlifyCreateSite: Boolean(data.netlifyCreateSite),
        netlifyAccountSlug: sanitizeString(data.netlifyAccountSlug),
        netlifyRepo: sanitizeString(data.netlifyRepo),
        netlifyRepoProvider: sanitizeString(data.netlifyRepoProvider),
        netlifyRepoBranch: sanitizeString(data.netlifyRepoBranch),
        netlifyBuildCommand: sanitizeString(data.netlifyBuildCommand),
        netlifyPublishDir: sanitizeString(data.netlifyPublishDir),
        netlifyBaseDir: sanitizeString(data.netlifyBaseDir),
        netlifySetProdBranch: Boolean(data.netlifySetProdBranch),
        netlifyCustomDomain: sanitizeString(data.netlifyCustomDomain),
        netlifyDomainAliases: sanitizeString(data.netlifyDomainAliases),
        netlifyDnsZoneName: sanitizeString(data.netlifyDnsZoneName),
        netlifyDnsZoneId: sanitizeString(data.netlifyDnsZoneId),
        netlifyDnsHost: sanitizeString(data.netlifyDnsHost),
        netlifyDnsValue: sanitizeString(data.netlifyDnsValue),
        netlifyDnsTtl: data.netlifyDnsTtl ? Number(data.netlifyDnsTtl) : null,
        netlifySiteId: sanitizeString(data.netlifySiteId),
        netlifySiteName: sanitizeString(data.netlifySiteName),
        netlifyAuthToken: sanitizeString(data.netlifyAuthToken),
        netlifyEnvFile: sanitizeString(data.netlifyEnvFile),
        githubToken: sanitizeString(data.githubToken),
        noLayout: Boolean(data.noLayout),
        applyConfig: Boolean(data.applyConfig),
        linkProject: Boolean(data.linkProject),
        pushSchema: Boolean(data.pushSchema),
        deployFunctions: Boolean(data.deployFunctions),
        netlifySyncEnv: Boolean(data.netlifySyncEnv),
        netlifyReplaceEnv: Boolean(data.netlifyReplaceEnv),
        netlifyCreateDnsRecord: Boolean(data.netlifyCreateDnsRecord),
        netlifyTriggerDeploy: Boolean(data.netlifyTriggerDeploy),
        writeDashboardEnv: Boolean(data.writeDashboardEnv)
      };

      applyEnvDefaults(payload);

      const errors = validatePayload(payload);
      if (errors.length) {
        sendJson(res, 400, { error: 'Validatie fout', details: errors });
        return;
      }

      if (
        payload.autoFetchKeys &&
        payload.accessToken
      ) {
        try {
          const keys = await fetchSupabaseKeys(payload.projectRef, payload.accessToken);
          const picked = pickSupabaseKeys(keys);
          if (!payload.publishableKey && picked.publishableKey) {
            payload.publishableKey = picked.publishableKey;
          }
          if (picked.serviceRoleKey) {
            const current = payload.serviceRoleKey?.trim() || '';
            const pickedIsJwt = picked.serviceRoleKey.startsWith('eyJ');
            const currentIsJwt = current.startsWith('eyJ');
            if (!current || (pickedIsJwt && !currentIsJwt)) {
              payload.serviceRoleKey = picked.serviceRoleKey;
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Onbekende fout';
          if (payload.applyConfig && !payload.serviceRoleKey) {
            sendJson(res, 400, { error: 'Supabase keys ophalen faalde', details: [message] });
            return;
          }
          console.warn('Supabase keys ophalen faalde:', message);
        }
      }

  if (payload.applyConfig && !payload.serviceRoleKey) {
    sendJson(res, 400, { error: 'Service role key ontbreekt na auto-fetch.' });
    return;
  }

  if (payload.ghlPrivateIntegrationToken && !payload.serviceRoleKey) {
    sendJson(res, 400, { error: 'Service role key ontbreekt om GHL token op te slaan.' });
    return;
  }

      lastOnboardingState = {
        supabaseUrl: payload.supabaseUrl,
        projectRef: payload.projectRef,
        locationId: payload.locationId,
        serviceRoleKey: payload.serviceRoleKey,
        publishableKey: payload.publishableKey
      };

      const sendOnboardResult = async (result) => {
        let dashboardEnv = null;
        if (result?.ok && payload.writeDashboardEnv) {
          try {
            dashboardEnv = await writeDashboardEnvFile(payload);
          } catch (error) {
            dashboardEnv = {
              ok: false,
              error: error instanceof Error ? error.message : 'Dashboard env schrijven faalde.'
            };
          }
        }

        sendJson(res, 200, {
          ok: Boolean(result?.ok),
          exitCode: typeof result?.exitCode === 'number' ? result.exitCode : 1,
          stdout: result?.stdout || '',
          stderr: result?.stderr || '',
          dashboardEnv
        });
      };

      const forceNode = sanitizeString(process.env.ONBOARDING_FORCE_NODE_BOOTSTRAP) === '1';
      if (forceNode) {
        try {
          const nodeResult = await runNodeBootstrap(payload);
          isRunning = false;
          await sendOnboardResult(nodeResult);
        } catch (error) {
          isRunning = false;
          sendJson(res, 500, {
            ok: false,
            error: error instanceof Error ? error.message : 'Onbekende fout'
          });
        }
        return;
      }

      const args = buildArgs(payload);
      isRunning = true;

      const psCommand = resolvePowerShellCommand();

      const child = spawn(psCommand, args, { cwd: repoRoot });
      let stdout = '';
      let stderr = '';

      child.on('error', async (error) => {
        if (res.writableEnded) return;

        const code = error && typeof error === 'object' ? error.code : '';
        const isMissingBinary = code === 'ENOENT';
        if (!isMissingBinary) {
          isRunning = false;
          sendJson(res, 500, {
            ok: false,
            error: `PowerShell starten faalde (${psCommand}). Installeer PowerShell (pwsh) of zet ONBOARDING_POWERSHELL_BIN.`,
            details: [error instanceof Error ? error.message : String(error)]
          });
          return;
        }

        try {
          const nodeResult = await runNodeBootstrap(payload);
          isRunning = false;
          await sendOnboardResult(nodeResult);
        } catch (fallbackError) {
          isRunning = false;
          sendJson(res, 500, {
            ok: false,
            error: 'PowerShell ontbreekt en Node runner faalde.',
            details: [fallbackError instanceof Error ? fallbackError.message : String(fallbackError)]
          });
        }
      });

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', async (code) => {
        if (res.writableEnded) return;
        isRunning = false;

        const exitCode = typeof code === 'number' ? code : 1;
        const outTrimmed = sanitizeString(stdout);
        const errTrimmed = sanitizeString(stderr);

        // Some PowerShell failures (or streams like Write-Host) can result in an empty capture.
        // When this happens, fall back to the Node runner to keep onboarding usable on non-Windows setups.
        if (exitCode !== 0 && !outTrimmed && !errTrimmed) {
          try {
            const nodeResult = await runNodeBootstrap(payload);
            nodeResult.stdout = `${sanitizeString(nodeResult.stdout)}\n\n[onboarding] Fallback: PowerShell exit code ${exitCode} zonder output.\n`.trim() + '\n';
            await sendOnboardResult(nodeResult);
            return;
          } catch (_fallbackError) {
            // Continue with the original (empty) PowerShell result.
          }
        }

        await sendOnboardResult({
          ok: exitCode === 0,
          exitCode,
          stdout,
          stderr
        });
      });
    } catch (error) {
      isRunning = false;
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/cron-install') {
    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const context = resolveOnboardingContext(data);

      if (!context.supabaseUrl || !context.projectRef) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const serviceRoleKey =
        sanitizeString(data.serviceRoleKey) ||
        context.serviceRoleKey ||
        process.env.SUPABASE_SERVICE_ROLE_JWT ||
        process.env.SUPABASE_SECRET_KEY ||
        '';

      if (!serviceRoleKey) {
        sendJson(res, 400, { ok: false, error: 'Server key ontbreekt (sb_secret_ of legacy eyJ).' });
        return;
      }

      const syncSecret = sanitizeString(data.syncSecret);
      const enableTeamleader = Boolean(data.teamleaderEnabled);
      const enableMeta = Boolean(data.metaEnabled);
      const googleMode = sanitizeString(data.googleSpendMode).toLowerCase() || 'none';

      const rpcPayload = {
        project_ref: context.projectRef,
        enable_teamleader: enableTeamleader,
        enable_meta: enableMeta,
        google_mode: googleMode,
        sync_secret: syncSecret || null,
        meta_sync_secret: syncSecret || null
      };

      const rpcResult = await callRpc(context.supabaseUrl, serviceRoleKey, 'setup_cron_jobs', rpcPayload);
      if (!rpcResult.ok) {
        const message =
          rpcResult.status === 404
            ? 'setup_cron_jobs RPC ontbreekt. Run eerst base schema migrations (supabase db push).'
            : rpcResult.status === 401 || rpcResult.status === 403
              ? 'Server key lijkt ongeldig (401/403).'
              : `Cron install faalde (${rpcResult.status}).`;
        sendJson(res, rpcResult.status || 500, { ok: false, error: message, details: rpcResult.data || rpcResult.raw });
        return;
      }

      if (rpcResult.data?.ok === false) {
        sendJson(res, 500, { ok: false, error: rpcResult.data?.error || 'Cron install faalde.', details: rpcResult.data });
        return;
      }

      sendJson(res, 200, { ok: true, data: rpcResult.data });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/health-check') {
    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const context = resolveOnboardingContext(data);

      const locationId = sanitizeString(data.locationId) || context.locationId || '';
      const serviceRoleKey =
        sanitizeString(data.serviceRoleKey) ||
        context.serviceRoleKey ||
        process.env.SUPABASE_SERVICE_ROLE_JWT ||
        process.env.SUPABASE_SECRET_KEY ||
        '';

      const wantsTeamleader = Boolean(data.teamleaderEnabled);
      const wantsMeta = Boolean(data.metaEnabled);
      const googleMode = sanitizeString(data.googleSpendMode).toLowerCase() || 'none';
      const expectsGoogle = googleMode === 'api' || googleMode === 'sheet';
      const expectsCron = Boolean(data.installCronSchedules);

      const checks = [];
      const addCheck = (id, label, status, details) => {
        checks.push({ id, label, status, details: String(details ?? '').trim() });
      };

      if (!context.supabaseUrl || !context.projectRef) {
        addCheck('project', 'Supabase project', 'error', 'Supabase URL of project ref ontbreekt.');
        sendJson(res, 200, { ok: true, checks });
        return;
      }

      if (!locationId) {
        addCheck('location', 'Location ID', 'error', 'Location ID ontbreekt.');
      } else {
        addCheck('location', 'Location ID', 'ok', locationId);
      }

      if (!serviceRoleKey) {
        addCheck('server-key', 'Server key', 'error', 'Server key ontbreekt (sb_secret_ of legacy eyJ).');
        sendJson(res, 200, { ok: true, checks });
        return;
      }

      const config = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'dashboard_config', {
        select: 'id,location_id,dashboard_title',
        limit: '1'
      });
      if (!config.ok) {
        addCheck(
          'dashboard-config',
          'dashboard_config',
          config.status === 404 ? 'error' : config.status === 401 || config.status === 403 ? 'error' : 'warn',
          config.status === 404
            ? 'dashboard_config ontbreekt. Run base schema migrations.'
            : config.status === 401 || config.status === 403
              ? 'Server key lijkt ongeldig (401/403).'
              : `Supabase REST faalde (${config.status}).`
        );
      } else {
        const row = Array.isArray(config.data) && config.data.length ? config.data[0] : null;
        if (!row) {
          addCheck('dashboard-config', 'dashboard_config', 'warn', 'Geen config row gevonden (apply config?).');
        } else if (locationId && row.location_id && row.location_id !== locationId) {
          addCheck(
            'dashboard-config',
            'dashboard_config',
            'warn',
            `Location mismatch: dashboard_config.location_id=${row.location_id} (wizard=${locationId}).`
          );
        } else {
          addCheck(
            'dashboard-config',
            'dashboard_config',
            'ok',
            row.dashboard_title ? `OK (${row.dashboard_title})` : 'OK'
          );
        }
      }

      const countTable = async (id, label, table, query, { warnIfZero = true } = {}) => {
        const result = await fetchRestCount(context.supabaseUrl, serviceRoleKey, table, query);
        if (!result.ok) {
          addCheck(
            id,
            label,
            result.status === 404 ? 'error' : 'warn',
            result.status === 404 ? `${table} ontbreekt (run base schema).` : `Query faalde (${result.status}).`
          );
          return { ok: false, count: null };
        }
        const count = result.count ?? null;
        if (warnIfZero && count === 0) {
          addCheck(id, label, 'warn', 'Geen rows gevonden (run sync?).');
        } else {
          addCheck(id, label, 'ok', count === null ? 'OK' : `Rows: ${count}`);
        }
        return { ok: true, count };
      };

      const locFilter = locationId ? { location_id: `eq.${locationId}` } : {};
      await countTable('contacts', 'Contacts', 'contacts', { select: 'id', ...locFilter, limit: '1' });
      await countTable('opportunities', 'Opportunities', 'opportunities', { select: 'id', ...locFilter, limit: '1' });
      await countTable('appointments', 'Appointments', 'appointments', { select: 'id', ...locFilter, limit: '1' });

      const view = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'opportunities_view', {
        select: 'id',
        ...locFilter,
        limit: '1'
      });
      if (!view.ok) {
        addCheck(
          'opportunities-view',
          'opportunities_view',
          view.status === 404 ? 'error' : 'warn',
          view.status === 404 ? 'opportunities_view ontbreekt. Run base schema migrations.' : `Query faalde (${view.status}).`
        );
      } else {
        addCheck('opportunities-view', 'opportunities_view', 'ok', 'OK');
      }

      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      const startDate = toDateOnly(start);

      const metaSpend = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'marketing_spend_daily', {
        select: 'date',
        ...locFilter,
        source: 'eq.META',
        date: startDate ? `gte.${startDate}` : null,
        limit: '1'
      });
      if (!metaSpend.ok) {
        addCheck(
          'meta-spend',
          'Marketing spend (META)',
          metaSpend.status === 404 ? 'error' : 'warn',
          metaSpend.status === 404 ? 'marketing_spend_daily ontbreekt.' : `Query faalde (${metaSpend.status}).`
        );
      } else if (wantsMeta && (metaSpend.count ?? 0) === 0) {
        addCheck('meta-spend', 'Marketing spend (META)', 'warn', 'Geen META spend rows in laatste 30 dagen.');
      } else {
        addCheck(
          'meta-spend',
          'Marketing spend (META)',
          'ok',
          metaSpend.count === null ? 'OK' : `Rows (30d): ${metaSpend.count}`
        );
      }

      const googleSpend = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'marketing_spend_daily', {
        select: 'date',
        ...locFilter,
        source: 'eq.Google Ads',
        date: startDate ? `gte.${startDate}` : null,
        limit: '1'
      });
      if (!googleSpend.ok) {
        addCheck(
          'google-spend',
          'Marketing spend (Google Ads)',
          googleSpend.status === 404 ? 'error' : 'warn',
          googleSpend.status === 404 ? 'marketing_spend_daily ontbreekt.' : `Query faalde (${googleSpend.status}).`
        );
      } else if (expectsGoogle && (googleSpend.count ?? 0) === 0) {
        addCheck('google-spend', 'Marketing spend (Google Ads)', 'warn', 'Geen Google Ads spend rows in laatste 30 dagen.');
      } else {
        addCheck(
          'google-spend',
          'Marketing spend (Google Ads)',
          'ok',
          googleSpend.count === null ? 'OK' : `Rows (30d): ${googleSpend.count}`
        );
      }

      const mapping = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'marketing_spend_source_mapping', {
        select: 'id',
        ...locFilter,
        limit: '1'
      });
      if (!mapping.ok) {
        addCheck(
          'spend-mapping',
          'Spend mapping',
          mapping.status === 404 ? 'error' : 'warn',
          mapping.status === 404 ? 'marketing_spend_source_mapping ontbreekt.' : `Query faalde (${mapping.status}).`
        );
      } else if ((metaSpend.count ?? 0) > 0 || (googleSpend.count ?? 0) > 0) {
        addCheck(
          'spend-mapping',
          'Spend mapping',
          (mapping.count ?? 0) === 0 ? 'warn' : 'ok',
          (mapping.count ?? 0) === 0
            ? 'Geen mapping rows. Vul mapping in via dashboard (Leadkosten mapping UI).'
            : mapping.count === null
              ? 'OK'
              : `Rows: ${mapping.count}`
        );
      } else {
        addCheck('spend-mapping', 'Spend mapping', 'ok', mapping.count === null ? 'OK' : `Rows: ${mapping.count}`);
      }

      if (wantsTeamleader) {
        const integration = await fetchRestCount(context.supabaseUrl, serviceRoleKey, 'teamleader_integrations', {
          select: 'location_id',
          ...locFilter,
          limit: '1'
        });
        if (!integration.ok) {
          addCheck(
            'teamleader',
            'Teamleader integratie',
            integration.status === 404 ? 'warn' : 'warn',
            integration.status === 404 ? 'teamleader_integrations ontbreekt.' : `Query faalde (${integration.status}).`
          );
        } else {
          addCheck(
            'teamleader',
            'Teamleader integratie',
            (integration.count ?? 0) === 0 ? 'warn' : 'ok',
            (integration.count ?? 0) === 0 ? 'Geen koppeling gevonden (OAuth nog niet afgerond?).' : 'OK'
          );
        }
      }

      const cron = await callRpc(context.supabaseUrl, serviceRoleKey, 'cron_health', {});
      if (cron.ok && cron.data?.ok) {
        const hasCron = Boolean(cron.data.pg_cron);
        const hasNet = Boolean(cron.data.pg_net);
        const jobs = Array.isArray(cron.data.jobs) ? cron.data.jobs : [];
        const names = new Set(jobs.map((job) => String(job?.jobname ?? '')));

        const expected = new Set(['ghl-sync-15m']);
        if (wantsTeamleader) expected.add('teamleader-sync-15m');
        if (wantsMeta) expected.add('meta-sync-daily');
        if (expectsGoogle && googleMode === 'api') expected.add('google-sync-daily');
        if (expectsGoogle && googleMode === 'sheet') expected.add('google-sheet-sync-daily');

        const missing = Array.from(expected).filter((name) => name && !names.has(name));
        if (!hasCron || !hasNet) {
          addCheck('cron', 'Cron extensions', 'warn', `pg_cron: ${hasCron ? 'aan' : 'uit'}, pg_net: ${hasNet ? 'aan' : 'uit'}`);
        } else if (expectsCron && missing.length) {
          addCheck('cron', 'Cron jobs', 'warn', `Jobs ontbreken: ${missing.join(', ')}`);
        } else if (missing.length) {
          addCheck('cron', 'Cron jobs', 'warn', `Niet alle jobs gevonden: ${missing.join(', ')}`);
        } else {
          addCheck('cron', 'Cron jobs', 'ok', `${jobs.length} jobs gevonden.`);
        }
      } else if (cron.status === 404) {
        addCheck('cron', 'Cron jobs', 'warn', 'cron_health RPC ontbreekt (push base schema migrations).');
      } else {
        addCheck('cron', 'Cron jobs', 'warn', `cron_health faalde (${cron.status}).`);
      }

      sendJson(res, 200, { ok: true, checks });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/ghl-sync') {
    if (isSyncing) {
      sendJson(res, 409, { error: 'Er draait al een sync.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const supabaseUrl = sanitizeString(data.supabaseUrl);
      const explicitRef = sanitizeString(data.projectRef);
      const projectRef = explicitRef || extractProjectRef(supabaseUrl);
      if (!projectRef) {
        sendJson(res, 400, { error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const syncSecret = sanitizeString(data.syncSecret) || process.env.SYNC_SECRET || '';
      const fullSync = data.fullSync !== false;
      const syncUrl = `https://${projectRef}.supabase.co/functions/v1/ghl-sync?full_sync=${fullSync ? 'true' : 'false'}`;

      const headers = { 'Content-Type': 'application/json' };
      if (syncSecret) {
        headers['x-sync-secret'] = syncSecret;
      }

      const initialWindowRaw = data.initialWindowDays ?? data.initial_window_days;
      const initialWindowDays = Number(initialWindowRaw);

      const requestBody = {};
      if (Array.isArray(data.entities)) {
        const entities = data.entities.map(sanitizeString).filter(Boolean);
        if (entities.length) {
          requestBody.entities = entities;
        }
      } else if (typeof data.entities === 'string' && data.entities.trim()) {
        requestBody.entities = data.entities.trim();
      }
      if (Number.isFinite(initialWindowDays) && initialWindowDays > 0) {
        requestBody.initial_window_days = Math.floor(initialWindowDays);
      }

      isSyncing = true;
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        sendJson(res, response.status, {
          ok: false,
          status: response.status,
          error: parsed || text || 'Sync faalde.'
        });
        return;
      }

      sendJson(res, 200, { ok: true, status: response.status, data: parsed || text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    } finally {
      isSyncing = false;
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/meta-sync') {
    if (isMetaSyncing) {
      sendJson(res, 409, { ok: false, error: 'Er draait al een Meta sync.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const supabaseUrl = sanitizeString(data.supabaseUrl);
      const explicitRef = sanitizeString(data.projectRef);
      const projectRef = explicitRef || extractProjectRef(supabaseUrl);
      if (!projectRef) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const syncSecret =
        sanitizeString(data.syncSecret) ||
        process.env.META_SYNC_SECRET ||
        process.env.SYNC_SECRET ||
        '';

      const lookbackDaysRaw = data.lookbackDays ?? data.lookback_days;
      const endOffsetDaysRaw = data.endOffsetDays ?? data.end_offset_days;
      const lookbackDays = Number(lookbackDaysRaw ?? 7);
      const endOffsetDays = Number(endOffsetDaysRaw ?? 1);

      const syncUrl = `https://${projectRef}.supabase.co/functions/v1/meta-sync`;
      const headers = { 'Content-Type': 'application/json' };
      if (syncSecret) {
        headers['x-sync-secret'] = syncSecret;
      }

      isMetaSyncing = true;
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          lookback_days: Number.isFinite(lookbackDays) ? Math.max(1, Math.floor(lookbackDays)) : 7,
          end_offset_days: Number.isFinite(endOffsetDays) ? Math.max(0, Math.floor(endOffsetDays)) : 1
        })
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        sendJson(res, response.status, { ok: false, status: response.status, error: parsed || text });
        return;
      }

      sendJson(res, 200, { ok: true, status: response.status, data: parsed || text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    } finally {
      isMetaSyncing = false;
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/google-sync') {
    if (isGoogleSyncing) {
      sendJson(res, 409, { ok: false, error: 'Er draait al een Google sync.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const supabaseUrl = sanitizeString(data.supabaseUrl);
      const explicitRef = sanitizeString(data.projectRef);
      const projectRef = explicitRef || extractProjectRef(supabaseUrl);
      if (!projectRef) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const lookbackDaysRaw = data.lookbackDays ?? data.lookback_days;
      const endOffsetDaysRaw = data.endOffsetDays ?? data.end_offset_days;
      const lookbackDays = Number(lookbackDaysRaw ?? 7);
      const endOffsetDays = Number(endOffsetDaysRaw ?? 1);

      const syncUrl = `https://${projectRef}.supabase.co/functions/v1/google-sync`;
      isGoogleSyncing = true;
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookback_days: Number.isFinite(lookbackDays) ? Math.max(1, Math.floor(lookbackDays)) : 7,
          end_offset_days: Number.isFinite(endOffsetDays) ? Math.max(0, Math.floor(endOffsetDays)) : 1
        })
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        sendJson(res, response.status, { ok: false, status: response.status, error: parsed || text });
        return;
      }

      sendJson(res, 200, { ok: true, status: response.status, data: parsed || text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    } finally {
      isGoogleSyncing = false;
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/google-sheet-sync') {
    if (isGoogleSheetSyncing) {
      sendJson(res, 409, { ok: false, error: 'Er draait al een Google Sheet sync.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const supabaseUrl = sanitizeString(data.supabaseUrl);
      const explicitRef = sanitizeString(data.projectRef);
      const projectRef = explicitRef || extractProjectRef(supabaseUrl);
      if (!projectRef) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const lookbackDaysRaw = data.lookbackDays ?? data.lookback_days;
      const endOffsetDaysRaw = data.endOffsetDays ?? data.end_offset_days;
      const lookbackDays = Number(lookbackDaysRaw ?? 7);
      const endOffsetDays = Number(endOffsetDaysRaw ?? 1);

      const syncUrl = `https://${projectRef}.supabase.co/functions/v1/google-sheet-sync`;
      isGoogleSheetSyncing = true;
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lookback_days: Number.isFinite(lookbackDays) ? Math.max(1, Math.floor(lookbackDays)) : 7,
          end_offset_days: Number.isFinite(endOffsetDays) ? Math.max(0, Math.floor(endOffsetDays)) : 1
        })
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        sendJson(res, response.status, { ok: false, status: response.status, error: parsed || text });
        return;
      }

      sendJson(res, 200, { ok: true, status: response.status, data: parsed || text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    } finally {
      isGoogleSheetSyncing = false;
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/teamleader-status') {
    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const context = resolveOnboardingContext(data);

      if (!context.supabaseUrl || !context.locationId) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL en location ID zijn vereist.' });
        return;
      }
      if (!context.serviceRoleKey) {
        sendJson(res, 400, { ok: false, error: 'Service role key ontbreekt.' });
        return;
      }

      const url = new URL(`${context.supabaseUrl}/rest/v1/teamleader_integrations`);
      url.searchParams.set('select', 'location_id,scope,expires_at');
      url.searchParams.set('location_id', `eq.${context.locationId}`);
      url.searchParams.set('limit', '1');

      const response = await fetch(url.toString(), {
        headers: buildSupabaseRestHeaders(context.serviceRoleKey)
      });
      const payload = await response.json();

      if (!response.ok) {
        sendJson(res, response.status, { ok: false, error: payload || 'Status check faalde.' });
        return;
      }

      const integration = Array.isArray(payload) && payload.length ? payload[0] : null;
      sendJson(res, 200, { ok: true, connected: Boolean(integration), integration });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/teamleader-sync') {
    if (isTeamleaderSyncing) {
      sendJson(res, 409, { ok: false, error: 'Er draait al een Teamleader sync.' });
      return;
    }

    try {
      const rawBody = await readBody(req);
      const data = JSON.parse(rawBody || '{}');
      const context = resolveOnboardingContext(data);

      if (!context.projectRef) {
        sendJson(res, 400, { ok: false, error: 'Supabase URL of project ref ontbreekt.' });
        return;
      }

      const entities = sanitizeString(data.entities);
      const lookbackMonths = data.lookbackMonths ? Number(data.lookbackMonths) : null;
      const syncSecret = sanitizeString(data.syncSecret) || process.env.SYNC_SECRET || '';

      const syncUrl = new URL(`https://${context.projectRef}.supabase.co/functions/v1/teamleader-sync`);
      if (context.locationId) syncUrl.searchParams.set('location_id', context.locationId);
      if (entities) syncUrl.searchParams.set('entities', entities);
      if (lookbackMonths && Number.isFinite(lookbackMonths)) {
        syncUrl.searchParams.set('lookback_months', String(lookbackMonths));
      }

      const headers = { 'Content-Type': 'application/json' };
      if (syncSecret) {
        headers['x-sync-secret'] = syncSecret;
      }

      isTeamleaderSyncing = true;
      const response = await fetch(syncUrl.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          location_id: context.locationId || undefined,
          entities: entities || undefined,
          lookback_months: lookbackMonths || undefined
        })
      });

      const text = await response.text();
      let parsed = null;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = null;
      }

      if (!response.ok) {
        sendJson(res, response.status, { ok: false, status: response.status, error: parsed || text });
        return;
      }

      sendJson(res, 200, { ok: true, status: response.status, data: parsed || text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    } finally {
      isTeamleaderSyncing = false;
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/dashboard-start') {
    try {
      const result = await startDashboardDevServer();
      if (!result.ok) {
        sendJson(res, 500, { ok: false, ...result });
        return;
      }
      const ready = await checkDashboardReady();
      sendJson(res, 200, { ok: true, ready, ...result });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Onbekende fout' });
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/api/dashboard-status') {
    const ready = await checkDashboardReady();
    sendJson(res, 200, { ok: true, ready });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/env-hints') {
    sendJson(res, 200, {
      supabaseAccessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
      netlifyAuthToken: Boolean(process.env.NETLIFY_AUTH_TOKEN),
      supabaseServiceRoleJwt: Boolean(process.env.SUPABASE_SERVICE_ROLE_JWT || process.env.SUPABASE_SECRET_KEY),
      githubToken: Boolean(process.env.GITHUB_TOKEN),
      syncSecret: Boolean(process.env.SYNC_SECRET),
      metaAccessToken: Boolean(process.env.META_ACCESS_TOKEN),
      googleDeveloperToken: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
      sheetCsvUrl: Boolean(process.env.SHEET_CSV_URL)
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/netlify-status') {
    const result = await runCommand('netlify', ['status'], repoRoot);
    sendJson(res, 200, result);
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Method not allowed');
    return;
  }

  const urlPath = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(publicDir, urlPath);
  await serveStatic(res, filePath);
});

const port = process.env.ONBOARDING_PORT ? Number(process.env.ONBOARDING_PORT) : 8787;
const host = sanitizeString(process.env.ONBOARDING_HOST);

const getNetworkAddresses = () => {
  const nets = os.networkInterfaces();
  const addresses = new Set();

  for (const netInterfaces of Object.values(nets)) {
    for (const net of netInterfaces ?? []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.add(net.address);
      }
    }
  }

  return [...addresses];
};

const onListen = () => {
  console.log('Onboarding app running');
  console.log(`  Local:   http://localhost:${port}`);

  if (!host || host === '0.0.0.0' || host === '::') {
    for (const address of getNetworkAddresses()) {
      console.log(`  Network: http://${address}:${port}`);
    }
  }
};

if (host) {
  server.listen(port, host, onListen);
} else {
  server.listen(port, onListen);
}
