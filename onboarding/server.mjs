import { createServer } from 'http';
import { readFile, writeFile, rename, stat } from 'fs/promises';
import { spawn } from 'child_process';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

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

const runCommand = (command, args, cwd) =>
  new Promise((resolve) => {
    const child = spawn(command, args, { cwd, shell: true });
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

const sanitizeString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const sanitizeEnvValue = (value) => sanitizeString(value).replace(/\r?\n/g, ' ');

const normalizePublicSiteUrl = (value) => {
  const trimmed = sanitizeString(value);
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmed)) {
    return `https://${trimmed}`.replace(/\/+$/, '');
  }
  return '';
};

const resolveAbsolutePublicUrl = (value, siteUrl) => {
  const trimmed = sanitizeString(value);
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (!trimmed.startsWith('/')) return '';
  if (!siteUrl) return '';
  try {
    return new URL(trimmed, `${siteUrl}/`).toString();
  } catch {
    return '';
  }
};

const buildBrandingEnv = (payload) => {
  const brandTitle = sanitizeString(payload.dashboardTitle) || 'Your Company';
  const brandSubtitle = sanitizeString(payload.dashboardSubtitle) || 'Performance Dashboard';
  const brandPageSubtitle = sanitizeString(payload.dashboardSubtitle) || 'Performance Dashboard - Leads, afspraken & ROI';
  const brandLogoUrl = sanitizeString(payload.logoUrl) || '/assets/logos/placeholder-logo.svg';
  const explicitTheme = normalizeSlug(payload.brandTheme);
  const slugTheme = normalizeSlug(payload.slug);
  const titleTheme = normalizeSlug(payload.dashboardTitle);
  const inferredTheme =
    titleTheme.includes('belivert') || slugTheme.includes('belivert')
      ? 'belivert'
      : '';
  const brandTheme = explicitTheme === 'belivert' ? explicitTheme : inferredTheme;
  const siteUrlFallback = sanitizeString(payload.netlifySiteName)
    ? `https://${sanitizeString(payload.netlifySiteName)}.netlify.app`
    : '';
  const siteUrl = normalizePublicSiteUrl(payload.netlifyCustomDomain || payload.siteUrl || siteUrlFallback);
  const previewTitle = brandTitle ? `${brandTitle} Dashboard` : 'GHL Dashboard Template';
  const previewDescription = brandPageSubtitle || 'Performance dashboard template - Leads, afspraken & ROI';
  const previewAuthor = brandTitle || 'Your Company';
  const imageFromLogo = resolveAbsolutePublicUrl(brandLogoUrl, siteUrl);
  const logoIsAbsolute = /^https?:\/\//i.test(brandLogoUrl);
  const logoIsRootRelative = brandLogoUrl.startsWith('/');
  const previewImageUrl =
    imageFromLogo ||
    (logoIsAbsolute ? brandLogoUrl : logoIsRootRelative ? brandLogoUrl : '') ||
    '/favicon-512.png';

  return {
    brandTitle,
    brandSubtitle,
    brandPageSubtitle,
    brandLogoUrl,
    brandTheme,
    previewTitle,
    previewDescription,
    previewAuthor,
    previewImageUrl,
    siteUrl
  };
};

const normalizeSlug = (value) =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const isHttpsUrl = (value) => /^https:\/\/\S+$/i.test(value);

const updateBillingClientsProfile = async (payload) => {
  const slug = normalizeSlug(payload.slug);
  if (!slug) return { ok: false, skipped: true, reason: 'missing_slug' };

  const shouldUpdate =
    Boolean(payload.stripePaymentLink) ||
    Boolean(payload.stripeBuyButtonId) ||
    Boolean(payload.stripePublishableKey) ||
    Boolean(payload.dashboardTitle) ||
    Boolean(payload.stripeBillingPortalUrl);

  if (!shouldUpdate) {
    return { ok: true, skipped: true, reason: 'no_stripe_fields' };
  }

  const configPath = join(repoRoot, 'dashboard', 'public', 'billing-clients.json');
  let config = { defaults: {}, profiles: {} };

  if (await fileExists(configPath)) {
    const raw = await readFile(configPath, 'utf8');
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') {
      config = parsed;
    }
  }

  if (!config.defaults || typeof config.defaults !== 'object' || Array.isArray(config.defaults)) {
    config.defaults = {};
  }
  if (!config.profiles || typeof config.profiles !== 'object' || Array.isArray(config.profiles)) {
    config.profiles = {};
  }

  const existingProfile =
    config.profiles[slug] && typeof config.profiles[slug] === 'object' && !Array.isArray(config.profiles[slug])
      ? config.profiles[slug]
      : {};
  const profile = { ...existingProfile };

  if (payload.dashboardTitle) profile.company = payload.dashboardTitle;
  if (payload.stripePaymentLink) profile.payment_link = payload.stripePaymentLink;
  if (payload.stripeBuyButtonId) profile.buy_button_id = payload.stripeBuyButtonId;
  if (payload.stripePublishableKey) profile.pk = payload.stripePublishableKey;
  if (payload.stripeBillingPortalUrl) profile.billing_portal_url = payload.stripeBillingPortalUrl;

  config.profiles[slug] = profile;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { ok: true, skipped: false, path: configPath, slug };
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
  const brandingEnv = buildBrandingEnv(payload);

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
    'VITE_ENABLE_MOCK_DATA=false',
    `VITE_BRAND_TITLE=${sanitizeEnvValue(brandingEnv.brandTitle)}`,
    `VITE_BRAND_SUBTITLE=${sanitizeEnvValue(brandingEnv.brandSubtitle)}`,
    `VITE_BRAND_PAGE_SUBTITLE=${sanitizeEnvValue(brandingEnv.brandPageSubtitle)}`,
    `VITE_BRAND_LOGO_URL=${sanitizeEnvValue(brandingEnv.brandLogoUrl)}`,
    `VITE_BRAND_THEME=${sanitizeEnvValue(brandingEnv.brandTheme)}`,
    `VITE_PREVIEW_TITLE=${sanitizeEnvValue(brandingEnv.previewTitle)}`,
    `VITE_PREVIEW_DESCRIPTION=${sanitizeEnvValue(brandingEnv.previewDescription)}`,
    `VITE_PREVIEW_AUTHOR=${sanitizeEnvValue(brandingEnv.previewAuthor)}`,
    `VITE_PREVIEW_IMAGE_URL=${sanitizeEnvValue(brandingEnv.previewImageUrl)}`,
    `VITE_SITE_URL=${sanitizeEnvValue(brandingEnv.siteUrl)}`
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
  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys?reveal=true`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase API keys ophalen faalde (${response.status}). ${body}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Supabase API keys response is ongeldig.');
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
  addString('-DashboardTabs', payload.dashboardTabs);
  addString('-BillingPortalUrl', payload.stripeBillingPortalUrl);
  addString('-BillingCheckoutUrl', payload.stripePaymentLink);
  addString('-AccessToken', payload.accessToken);
  addString('-GhlPrivateIntegrationToken', payload.ghlPrivateIntegrationToken);
  addString('-DbPassword', payload.dbPassword);
  addString('-ServiceRoleKey', payload.serviceRoleKey);
  addString('-PublishableKey', payload.publishableKey);
  addString('-TeamleaderClientId', payload.teamleaderClientId);
  addString('-TeamleaderClientSecret', payload.teamleaderClientSecret);
  addString('-TeamleaderRedirectUrl', payload.teamleaderRedirectUrl);
  addString('-TeamleaderScopes', payload.teamleaderScopes);
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
  addSwitch('-BillingCheckoutEmbed', payload.stripeCheckoutEmbed);
  addSwitch('-CreateBranch', payload.createBranch);
  addSwitch('-PushBranch', payload.pushBranch);
  addSwitch('-LinkProject', payload.linkProject);
  addSwitch('-PushSchema', payload.pushSchema);
  addSwitch('-DeployFunctions', payload.deployFunctions);
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
  if (payload.stripePaymentLink && !isHttpsUrl(payload.stripePaymentLink)) {
    errors.push('Stripe payment link moet starten met https://');
  }
  if (payload.stripeBillingPortalUrl && !isHttpsUrl(payload.stripeBillingPortalUrl)) {
    errors.push('Stripe billing portal URL moet starten met https://');
  }
  if (payload.stripeBuyButtonId && !payload.stripePublishableKey) {
    errors.push('Stripe publishable key is vereist wanneer je een buy button ID opgeeft.');
  }
  if (payload.stripePublishableKey && !payload.stripeBuyButtonId && !payload.stripePaymentLink) {
    errors.push('Stripe publishable key ingevuld zonder buy button of payment link.');
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

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
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
        brandTheme: sanitizeString(data.brandTheme),
        dashboardTabs: sanitizeString(data.dashboardTabs),
        autoFetchKeys: Boolean(data.autoFetchKeys),
        accessToken: sanitizeString(data.accessToken),
        ghlPrivateIntegrationToken: sanitizeString(data.ghlPrivateIntegrationToken),
        stripePaymentLink: sanitizeString(data.stripePaymentLink),
        stripeBillingPortalUrl: sanitizeString(data.stripeBillingPortalUrl),
        stripeBuyButtonId: sanitizeString(data.stripeBuyButtonId),
        stripePublishableKey: sanitizeString(data.stripePublishableKey),
        stripeCheckoutEmbed: Boolean(data.stripeCheckoutEmbed),
        dbPassword: sanitizeString(data.dbPassword),
        serviceRoleKey: sanitizeString(data.serviceRoleKey),
        publishableKey: sanitizeString(data.publishableKey),
        teamleaderClientId: sanitizeString(data.teamleaderClientId),
        teamleaderClientSecret: sanitizeString(data.teamleaderClientSecret),
        teamleaderRedirectUrl: sanitizeString(data.teamleaderRedirectUrl),
        teamleaderScopes: sanitizeString(data.teamleaderScopes),
        teamleaderEnabled: Boolean(data.teamleaderEnabled ?? data.enableTeamleader),
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

      const args = buildArgs(payload);
      isRunning = true;

      const child = spawn('powershell', args, { cwd: repoRoot });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('close', async (code) => {
        isRunning = false;
        let dashboardEnv = null;
        let billingProfile = null;
        if (code === 0 && payload.writeDashboardEnv) {
          try {
            dashboardEnv = await writeDashboardEnvFile(payload);
          } catch (error) {
            dashboardEnv = {
              ok: false,
              error: error instanceof Error ? error.message : 'Dashboard env schrijven faalde.'
            };
          }
        }
        if (code === 0) {
          try {
            billingProfile = await updateBillingClientsProfile(payload);
          } catch (error) {
            billingProfile = {
              ok: false,
              error: error instanceof Error ? error.message : 'billing-clients.json updaten faalde.'
            };
          }
        }
        sendJson(res, 200, {
          ok: code === 0,
          exitCode: code,
          stdout,
          stderr,
          dashboardEnv,
          billingProfile
        });
      });
    } catch (error) {
      isRunning = false;
      sendJson(res, 500, { error: error instanceof Error ? error.message : 'Onbekende fout' });
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

      isSyncing = true;
      const response = await fetch(syncUrl, { method: 'POST', headers });
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
      syncSecret: Boolean(process.env.SYNC_SECRET)
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
server.listen(port, () => {
  console.log(`Onboarding app running at http://localhost:${port}`);
});
