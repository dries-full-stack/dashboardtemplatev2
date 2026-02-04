import { createServer } from 'http';
import { readFile } from 'fs/promises';
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
        teamleaderEnabled: Boolean(data.enableTeamleader),
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
        netlifyTriggerDeploy: Boolean(data.netlifyTriggerDeploy)
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

      child.on('close', (code) => {
        isRunning = false;
        sendJson(res, 200, {
          ok: code === 0,
          exitCode: code,
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
