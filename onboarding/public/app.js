const form = document.getElementById('onboard-form');
const output = document.getElementById('output');
const statusNode = document.getElementById('status');
const runBtn = document.getElementById('run-btn');
const advancedToggle = document.getElementById('advancedMode');
const teamleaderToggle = document.getElementById('enableTeamleader');
const netlifyToggle = document.getElementById('enableNetlify');

const advancedSections = Array.from(document.querySelectorAll('[data-advanced]:not([data-netlify])'));
const advancedNetlifySections = Array.from(document.querySelectorAll('[data-advanced][data-netlify]'));
const teamleaderSections = Array.from(document.querySelectorAll('[data-teamleader]'));
const netlifySections = Array.from(document.querySelectorAll('[data-netlify]:not([data-advanced])'));
const manualKeySections = Array.from(document.querySelectorAll('[data-manual-keys]'));
const dbPasswordLabel = document.querySelector('[data-db-password]');

const linkProjectInput = form?.querySelector('[name="linkProject"]');
const pushSchemaInput = form?.querySelector('[name="pushSchema"]');
const runMigrationsInput = form?.querySelector('[name="runMigrations"]');
const autoFetchInput = form?.querySelector('[name="autoFetchKeys"]');
const createBranchInput = form?.querySelector('[name="createBranch"]');
const pushBranchInput = form?.querySelector('[name="pushBranch"]');
const netlifyCreateSiteInput = form?.querySelector('[name="netlifyCreateSite"]');
const netlifySetProdBranchInput = form?.querySelector('[name="netlifySetProdBranch"]');
const netlifyCustomDomainInput = form?.querySelector('[name="netlifyCustomDomain"]');
const netlifySiteNameInput = form?.querySelector('[name="netlifySiteName"]');
const netlifyDnsHostInput = form?.querySelector('[name="netlifyDnsHost"]');
const netlifyDnsZoneInput = form?.querySelector('[name="netlifyDnsZoneName"]');
const netlifyDnsValueInput = form?.querySelector('[name="netlifyDnsValue"]');
const stepPanels = Array.from(document.querySelectorAll('[data-step]'));
const stepIndicators = Array.from(document.querySelectorAll('[data-step-indicator]'));
const prevStepBtn = document.querySelector('[data-step-prev]');
const nextStepBtn = document.querySelector('[data-step-next]');
const submitStepBtn = document.querySelector('[data-step-submit]');
const summaryNode = document.getElementById('summary');
const supabaseUrlInput = form?.querySelector('[name="supabaseUrl"]');
const teamleaderRedirectInput = form?.querySelector('[name="teamleaderRedirectUrl"]');
const teamleaderRedirectPreview = document.getElementById('teamleaderRedirectPreview');
const copyRedirectBtn = document.getElementById('copyRedirect');
const netlifyCheckBtn = document.getElementById('netlifyCheck');
const netlifyStatusNode = document.getElementById('netlifyStatus');
const teamleaderAction = document.getElementById('teamleaderAction');
const teamleaderLink = document.getElementById('teamleaderLink');
const teamleaderSyncAction = document.getElementById('teamleaderSyncAction');
const teamleaderSyncNowBtn = document.getElementById('teamleaderSyncNow');
const teamleaderSyncStatusNode = document.getElementById('teamleaderSyncStatus');
const syncAction = document.getElementById('syncAction');
const syncNowBtn = document.getElementById('syncNow');
const syncStatusNode = document.getElementById('syncStatus');
const dashboardStatusNode = document.getElementById('dashboardStatus');
const teamleaderAutoSyncInput = form?.querySelector('[name="teamleaderAutoSync"]');
const sourceSuggestRefreshBtn = document.getElementById('sourceSuggestRefresh');
const sourceSuggestStatusNode = document.getElementById('sourceSuggestStatus');
const sourceSuggestContentNode = document.getElementById('sourceSuggestContent');

const BASIC_STORAGE_KEY = 'onboard-basic';
const BASIC_FIELDS = ['slug', 'supabaseUrl', 'locationId', 'dashboardTitle', 'dashboardSubtitle', 'logoUrl'];
const BASIC_CHECKS = ['dashboardLead', 'dashboardSales', 'dashboardCallCenter'];
const DEFAULT_CUSTOM_DOMAIN_SUFFIX = 'profitpulse.be';
const DEFAULT_NETLIFY_SITE_PREFIX = 'dashboard-';
let currentStep = 1;
const TOTAL_STEPS = stepPanels.length || 1;
let envHints = {
  supabaseAccessToken: false,
  netlifyAuthToken: false,
  supabaseServiceRoleJwt: false,
  githubToken: false,
  syncSecret: false
};
let lastPayload = null;
let teamleaderAutoRunning = false;

const setHidden = (node, hidden) => {
  if (!node) return;
  node.classList.toggle('hidden', hidden);
};

const toggleGroup = (nodes, show) => {
  nodes.forEach((node) => setHidden(node, !show));
};

const setInputError = (input, hasError) => {
  if (!input) return;
  input.classList.toggle('input-error', hasError);
};

const clearFields = (names) => {
  names.forEach((name) => {
    const input = form?.querySelector(`[name="${name}"]`);
    if (!input) return;
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = '';
    }
  });
};

const setAdvancedMode = (enabled) => {
  toggleGroup(advancedSections, enabled);
  toggleGroup(advancedNetlifySections, enabled && Boolean(netlifyToggle?.checked));
  if (!enabled) {
    clearFields([
      'createBranch',
      'pushBranch',
      'netlifySetProdBranch',
      'netlifyCreateDnsRecord',
      'netlifyReplaceEnv',
      'noLayout'
    ]);
  }
  syncAdvancedFromMigrations();
  updateDbPasswordVisibility();
  syncBranchAutomation();
};

const setTeamleaderEnabled = (enabled) => {
  toggleGroup(teamleaderSections, enabled);
  if (!enabled) {
    clearFields([
      'teamleaderClientId',
      'teamleaderClientSecret',
      'teamleaderRedirectUrl',
      'teamleaderScopes',
      'teamleaderAutoSync'
    ]);
    if (teamleaderRedirectInput) {
      teamleaderRedirectInput.dataset.userEdited = 'false';
      teamleaderRedirectInput.dataset.autoValue = '';
    }
  }
  updateTeamleaderRedirect();
};

const setNetlifyEnabled = (enabled) => {
  toggleGroup(netlifySections, enabled);
  toggleGroup(advancedNetlifySections, enabled && Boolean(advancedToggle?.checked));
  if (!enabled) {
    clearFields([
      'netlifySiteId',
      'netlifySiteName',
      'netlifyAuthToken',
      'githubToken',
      'netlifyEnvFile',
      'netlifyAccountSlug',
      'netlifyRepo',
      'netlifyRepoBranch',
      'netlifyBuildCommand',
      'netlifyPublishDir',
      'netlifyBaseDir',
      'netlifyCustomDomain',
      'netlifyDomainAliases',
      'netlifyDnsZoneName',
      'netlifyDnsZoneId',
      'netlifyDnsHost',
      'netlifyDnsValue',
      'netlifyDnsTtl',
      'netlifySyncEnv',
      'netlifyCreateSite',
      'netlifyTriggerDeploy',
      'netlifySetProdBranch',
      'netlifyCreateDnsRecord',
      'netlifyReplaceEnv'
    ]);
    if (netlifyCustomDomainInput) {
      netlifyCustomDomainInput.dataset.userEdited = 'false';
      netlifyCustomDomainInput.dataset.autoValue = '';
    }
    [netlifySiteNameInput, netlifyDnsHostInput, netlifyDnsZoneInput, netlifyDnsValueInput].forEach((input) => {
      if (!input) return;
      input.dataset.userEdited = 'false';
      input.dataset.autoValue = '';
    });
  } else if (slugInput?.value) {
    updateNetlifySiteName(slugInput.value);
    updateCustomDomain(slugInput.value);
    syncBranchAutomation();
  }
};

const setManualKeysVisible = (visible) => {
  toggleGroup(manualKeySections, visible);
  if (!visible) {
    clearFields(['publishableKey']);
  }
};

const updateDbPasswordVisibility = () => {
  const wantsMigrations = Boolean(runMigrationsInput?.checked);
  const needsDbPassword = Boolean(
    wantsMigrations ||
      (advancedToggle?.checked && (linkProjectInput?.checked || pushSchemaInput?.checked))
  );
  setHidden(dbPasswordLabel, !needsDbPassword);
  if (!needsDbPassword) {
    clearFields(['dbPassword']);
  }
};

const syncAdvancedFromMigrations = () => {
  if (!runMigrationsInput) return;
  const enabled = Boolean(runMigrationsInput.checked);
  if (linkProjectInput) linkProjectInput.checked = enabled;
  if (pushSchemaInput) pushSchemaInput.checked = enabled;
};

const syncMigrationsFromAdvanced = () => {
  if (!runMigrationsInput) return;
  const linkEnabled = Boolean(linkProjectInput?.checked);
  const pushEnabled = Boolean(pushSchemaInput?.checked);
  runMigrationsInput.checked = linkEnabled && pushEnabled;
};

const syncNetlifyProdBranch = () => {
  if (!netlifySetProdBranchInput) return;
  const shouldEnable = Boolean(netlifyCreateSiteInput?.checked);
  netlifySetProdBranchInput.checked = shouldEnable;
};

const syncBranchAutomation = () => {
  if (!netlifyToggle?.checked || !netlifyCreateSiteInput?.checked) return;
  if (createBranchInput) createBranchInput.checked = true;
  if (pushBranchInput) pushBranchInput.checked = true;
};

const applyAutoValue = (input, nextValue) => {
  if (!input || !nextValue) return;
  const lastAuto = input.dataset.autoValue || '';
  const current = input.value.trim();
  const userEdited = input.dataset.userEdited === 'true';
  if (!current || (!userEdited && current === lastAuto)) {
    input.value = nextValue;
    input.dataset.autoValue = nextValue;
    input.dataset.userEdited = 'false';
  }
};

const normalizeDomain = (value) => {
  if (!value) return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
};

const extractProjectRef = (value) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^[a-z0-9-]+$/i.test(trimmed)) return trimmed;
  const urlMatch = trimmed.match(/https?:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (urlMatch?.[1]) return urlMatch[1];
  const hostMatch = trimmed.match(/^([a-z0-9-]+)\.supabase\.co/i);
  if (hostMatch?.[1]) return hostMatch[1];
  return '';
};

const buildTeamleaderRedirect = () => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) return '';
  return `https://${ref}.supabase.co/functions/v1/teamleader-oauth/callback`;
};

const buildTeamleaderStartUrl = () => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  const locationId = getFieldValue('locationId');
  if (!ref || !locationId) return '';
  return `https://${ref}.supabase.co/functions/v1/teamleader-oauth/start?location_id=${encodeURIComponent(
    locationId
  )}`;
};

const setTeamleaderAction = (enabled) => {
  if (!teamleaderAction) return;
  const url = enabled ? buildTeamleaderStartUrl() : '';
  const visible = Boolean(enabled && url);
  teamleaderAction.classList.toggle('hidden', !visible);
  if (teamleaderLink) {
    teamleaderLink.href = url || '#';
  }
};

const setSyncAction = (enabled) => {
  if (!syncAction) return;
  syncAction.classList.toggle('hidden', !enabled);
  if (!enabled && syncStatusNode) {
    syncStatusNode.textContent = '';
    syncStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const setTeamleaderSyncAction = (enabled) => {
  if (!teamleaderSyncAction) return;
  teamleaderSyncAction.classList.toggle('hidden', !enabled);
  if (!enabled && teamleaderSyncStatusNode) {
    teamleaderSyncStatusNode.textContent = '';
    teamleaderSyncStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const splitDomain = (domain) => {
  const clean = normalizeDomain(domain);
  if (!clean) return { host: '', apex: '' };
  const parts = clean.split('.').filter(Boolean);
  if (parts.length < 2) {
    return { host: '', apex: clean };
  }
  const apex = parts.slice(-2).join('.');
  const host = parts.slice(0, -2).join('.');
  return { host, apex };
};

const updateDnsFromDomain = (domainValue) => {
  const { host, apex } = splitDomain(domainValue);
  applyAutoValue(netlifyDnsHostInput, host);
  applyAutoValue(netlifyDnsZoneInput, apex);
};

const updateDnsValueFromSiteName = (siteNameValue) => {
  if (!netlifyDnsValueInput) return;
  const cleaned = (siteNameValue || '').trim();
  if (!cleaned) return;
  const nextValue = cleaned.includes('.') ? cleaned : `${cleaned}.netlify.app`;
  applyAutoValue(netlifyDnsValueInput, nextValue);
};

const updateNetlifySiteName = (slugValue) => {
  if (!netlifySiteNameInput) return;
  const cleaned = (slugValue || '').trim().toLowerCase();
  if (!cleaned) return;
  const nextValue = `${DEFAULT_NETLIFY_SITE_PREFIX}${cleaned}`;
  applyAutoValue(netlifySiteNameInput, nextValue);
  updateDnsValueFromSiteName(netlifySiteNameInput.value);
};

const updateCustomDomain = (slugValue) => {
  if (!netlifyCustomDomainInput) return;
  const cleaned = (slugValue || '').trim().toLowerCase();
  if (!cleaned) return;

  const nextValue = `${cleaned}.${DEFAULT_CUSTOM_DOMAIN_SUFFIX}`;
  applyAutoValue(netlifyCustomDomainInput, nextValue);
  updateDnsFromDomain(netlifyCustomDomainInput.value);
};

const updateTeamleaderRedirect = () => {
  const recommended = buildTeamleaderRedirect();
  if (teamleaderRedirectInput) {
    applyAutoValue(teamleaderRedirectInput, recommended);
  }
  const previewValue =
    teamleaderRedirectInput?.value?.trim() || recommended;
  if (teamleaderRedirectPreview) {
    teamleaderRedirectPreview.value = previewValue || '';
    teamleaderRedirectPreview.placeholder = previewValue
      ? ''
      : 'Vul Supabase URL in stap 1';
  }
  if (copyRedirectBtn) {
    copyRedirectBtn.disabled = !previewValue;
  }
};

const saveBasicState = () => {
  if (!form) return;
  const data = new FormData(form);
  const payload = {};
  BASIC_FIELDS.forEach((field) => {
    payload[field] = (data.get(field) || '').toString();
  });
  BASIC_CHECKS.forEach((field) => {
    payload[field] = data.get(field) === 'on';
  });
  try {
    localStorage.setItem(BASIC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }
};

const loadBasicState = () => {
  if (!form) return;
  try {
    const raw = localStorage.getItem(BASIC_STORAGE_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw);
    BASIC_FIELDS.forEach((field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input || input.value) return;
      if (payload[field]) input.value = payload[field];
    });
    BASIC_CHECKS.forEach((field) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;
      if (typeof payload[field] === 'boolean') input.checked = payload[field];
    });
  } catch {
    // ignore
  }
};

const setStatus = (text, tone = 'muted') => {
  statusNode.textContent = text;
  statusNode.style.color = tone === 'error' ? '#b91c1c' : '#6b7280';
};

const setOutput = (text) => {
  output.textContent = text;
};

const buildTestLinks = () => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  const locationId = getFieldValue('locationId');
  if (!ref || !locationId) return '';
  const startUrl = `https://${ref}.supabase.co/functions/v1/teamleader-oauth/start?location_id=${encodeURIComponent(
    locationId
  )}`;
  return [
    '',
    '--- TEAMLEADER TEST ---',
    `Open: ${startUrl}`,
    'Expected: "Teamleader gekoppeld" after auth.',
    'Check table: teamleader_integrations'
  ].join('\n');
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildTeamleaderSyncPayload = () => ({
  projectRef: extractProjectRef(supabaseUrlInput?.value || ''),
  supabaseUrl: supabaseUrlInput?.value || '',
  locationId: getFieldValue('locationId'),
  syncSecret: getFieldValue('syncSecret'),
  serviceRoleKey: getFieldValue('serviceRoleKey')
});

const checkTeamleaderIntegration = async () => {
  const payload = buildTeamleaderSyncPayload();
  if (!payload.projectRef || !payload.locationId) {
    return { ok: false, connected: false, error: 'Supabase URL of location ID ontbreekt.' };
  }

  const response = await fetch('/api/teamleader-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (!response.ok) {
    return { ok: false, connected: false, error: result?.error || 'Status check faalde.' };
  }
  return result;
};

const triggerTeamleaderSync = async () => {
  const payload = buildTeamleaderSyncPayload();
  if (!payload.projectRef || !payload.locationId) {
    setTeamleaderSyncStatus('Vul een geldige Supabase URL en location ID in.', 'error');
    return { ok: false };
  }

  setTeamleaderSyncStatus('Teamleader sync gestart...', 'muted');
  if (teamleaderSyncNowBtn) teamleaderSyncNowBtn.disabled = true;

  try {
    const response = await fetch('/api/teamleader-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setTeamleaderSyncStatus(`Sync faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const summary = result?.data?.results
      ? Object.entries(result.data.results)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : '';
    setTeamleaderSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setTeamleaderSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (teamleaderSyncNowBtn) teamleaderSyncNowBtn.disabled = false;
  }
};

const waitForTeamleaderIntegration = async (timeoutMs = 10 * 60 * 1000, intervalMs = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const result = await checkTeamleaderIntegration();
    if (result?.connected) return result;
    await wait(intervalMs);
  }
  return { ok: false, connected: false, error: 'Timeout: koppeling niet gevonden.' };
};

const startTeamleaderAutopilot = async () => {
  if (teamleaderAutoRunning) return;
  teamleaderAutoRunning = true;
  const url = buildTeamleaderStartUrl();
  if (url) {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) {
      setTeamleaderSyncStatus('Popup geblokkeerd. Klik op "Koppel Teamleader".', 'warn');
    }
  }

  setTeamleaderSyncStatus('Wachten op Teamleader koppeling...', 'muted');
  const status = await waitForTeamleaderIntegration();
  if (!status?.connected) {
    const detail = status?.error ? ` (${status.error})` : '';
    setTeamleaderSyncStatus(`Geen koppeling gevonden${detail}`, 'warn');
    teamleaderAutoRunning = false;
    return;
  }

  setTeamleaderSyncStatus('Koppeling ok. Sync gestart...', 'muted');
  await triggerTeamleaderSync();
  teamleaderAutoRunning = false;
};

const waitForDashboardReady = async (timeoutMs = 60000, intervalMs = 1500) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch('/api/dashboard-status');
      const result = await response.json();
      if (result?.ready) return true;
    } catch {
      // ignore
    }
    await wait(intervalMs);
  }
  return false;
};

const startDashboardDev = async () => {
  try {
    const response = await fetch('/api/dashboard-start', { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.ok === false) {
      return { ok: false, error: result?.error || 'Dashboard start faalde.' };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Dashboard start faalde.' };
  }
  const ready = await waitForDashboardReady();
  return { ok: ready };
};

const setNetlifyStatus = (text, tone = 'muted') => {
  if (!netlifyStatusNode) return;
  netlifyStatusNode.textContent = text;
  netlifyStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') netlifyStatusNode.classList.add('ok');
  if (tone === 'warn') netlifyStatusNode.classList.add('warn');
  if (tone === 'error') netlifyStatusNode.classList.add('error');
};

const setSyncStatus = (text, tone = 'muted') => {
  if (!syncStatusNode) return;
  syncStatusNode.textContent = text;
  syncStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') syncStatusNode.classList.add('ok');
  if (tone === 'warn') syncStatusNode.classList.add('warn');
  if (tone === 'error') syncStatusNode.classList.add('error');
};

const setTeamleaderSyncStatus = (text, tone = 'muted') => {
  if (!teamleaderSyncStatusNode) return;
  teamleaderSyncStatusNode.textContent = text;
  teamleaderSyncStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') teamleaderSyncStatusNode.classList.add('ok');
  if (tone === 'warn') teamleaderSyncStatusNode.classList.add('warn');
  if (tone === 'error') teamleaderSyncStatusNode.classList.add('error');
};

const setDashboardStatus = (text, tone = 'muted') => {
  if (!dashboardStatusNode) return;
  dashboardStatusNode.textContent = text;
  dashboardStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') dashboardStatusNode.classList.add('ok');
  if (tone === 'warn') dashboardStatusNode.classList.add('warn');
  if (tone === 'error') dashboardStatusNode.classList.add('error');
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const setSourceSuggestStatus = (text, tone = 'muted') => {
  if (!sourceSuggestStatusNode) return;
  sourceSuggestStatusNode.textContent = text;
  sourceSuggestStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') sourceSuggestStatusNode.classList.add('ok');
  if (tone === 'warn') sourceSuggestStatusNode.classList.add('warn');
  if (tone === 'error') sourceSuggestStatusNode.classList.add('error');
};

let sourceSuggestState = { status: 'idle', key: '', inFlight: false };

const renderSourceSuggestions = (result) => {
  if (!sourceSuggestContentNode) return;
  if (!result?.ok) {
    sourceSuggestContentNode.innerHTML = '';
    return;
  }

  const sampled = Number(result?.sampledRows ?? 0);
  const sources = Array.isArray(result?.sources) ? result.sources : [];
  const buckets = Array.isArray(result?.buckets) ? result.buckets : [];

  if (!sources.length) {
    sourceSuggestContentNode.innerHTML = `
      <p class="muted">
        Geen bronnen gevonden. Run eerst een GHL sync en klik opnieuw op "Vernieuw voorstel".
      </p>
    `;
    return;
  }

  const pills = buckets
    .map(
      (bucket) =>
        `<span class="pill"><span>${escapeHtml(bucket.bucket)}</span><strong>${escapeHtml(bucket.count)}</strong></span>`
    )
    .join('');

  const rows = sources
    .map(
      (row) => `
      <tr>
        <td>${escapeHtml(row.raw)}</td>
        <td>${escapeHtml(row.suggested)}</td>
        <td>${escapeHtml(row.count)}</td>
      </tr>
    `
    )
    .join('');

  sourceSuggestContentNode.innerHTML = `
    <div class="pill-row">${pills}</div>
    <p class="muted">Sample: ${escapeHtml(sampled)} opportunities (meest recente).</p>
    <table class="normalization-table">
      <thead>
        <tr>
          <th>Ruwe bron</th>
          <th>Voorstel</th>
          <th>Leads</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const loadSourceSuggestions = async (options = {}) => {
  if (!sourceSuggestRefreshBtn || !sourceSuggestContentNode) return;
  if (!form) return;

  const projectRef = extractProjectRef(supabaseUrlInput?.value || '');
  const locationId = getFieldValue('locationId');
  const serviceRoleKey = getFieldValue('serviceRoleKey');
  const accessToken = getFieldValue('accessToken');
  const hasAccessToken = Boolean(accessToken) || Boolean(envHints?.supabaseAccessToken);
  const key = `${projectRef}|${locationId}`;

  if (!projectRef || !locationId) {
    setSourceSuggestStatus('Vul eerst Supabase URL en location ID in.', 'warn');
    sourceSuggestContentNode.innerHTML = '';
    return;
  }

  if (!serviceRoleKey && !hasAccessToken) {
    setSourceSuggestStatus('Vul "Server key" of "Supabase access token" in om bronnen te kunnen ophalen.', 'warn');
    sourceSuggestContentNode.innerHTML = '';
    return;
  }

  if (!options.force && sourceSuggestState.status === 'ready' && sourceSuggestState.key === key) {
    return;
  }
  if (sourceSuggestState.inFlight && sourceSuggestState.key === key) return;

  sourceSuggestState = { status: 'loading', key, inFlight: true };
  sourceSuggestRefreshBtn.disabled = true;
  setSourceSuggestStatus('Voorstel laden...', 'muted');

  try {
    const response = await fetch('/api/source-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef,
        supabaseUrl: supabaseUrlInput?.value || '',
        locationId,
        serviceRoleKey,
        accessToken
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      const errorMessage = result?.error || 'Voorstel ophalen faalde.';
      setSourceSuggestStatus(errorMessage, 'warn');
      sourceSuggestContentNode.innerHTML = '';
      sourceSuggestState = { status: 'error', key, inFlight: false };
      return;
    }

    setSourceSuggestStatus('Voorstel klaar.', 'ok');
    sourceSuggestState = { status: 'ready', key, inFlight: false };
    renderSourceSuggestions(result);
  } catch (error) {
    setSourceSuggestStatus(error instanceof Error ? error.message : 'Voorstel ophalen faalde.', 'error');
    sourceSuggestContentNode.innerHTML = '';
    sourceSuggestState = { status: 'error', key, inFlight: false };
  } finally {
    sourceSuggestRefreshBtn.disabled = false;
  }
};

const interpretNetlifyStatus = (result) => {
  const combined = `${result?.stdout || ''}\n${result?.stderr || ''}`.toLowerCase();
  if (combined.includes('not logged in') || combined.includes('logged out')) {
    return { text: 'Niet ingelogd in Netlify CLI.', tone: 'warn' };
  }
  if (combined.includes('did you run `netlify link`') || combined.includes('not appear to be in a folder')) {
    return { text: 'Netlify CLI is ingelogd, maar deze map is nog niet gelinkt.', tone: 'warn' };
  }
  if (combined.includes('not recognized') || combined.includes('command not found')) {
    return { text: 'Netlify CLI niet gevonden.', tone: 'error' };
  }
  if (combined.includes('current netlify user') || combined.includes('logged in') || combined.includes('account') || combined.includes('user')) {
    return { text: 'Netlify CLI is ingelogd.', tone: 'ok' };
  }
  if (!result?.ok) {
    return { text: 'Netlify status faalde. Controleer CLI.', tone: 'error' };
  }
  return { text: 'Netlify status onduidelijk. Check output.', tone: 'warn' };
};

const buildPayload = () => {
  const data = new FormData(form);
  const getValue = (key) => (data.get(key) || '').toString().trim();
  const isChecked = (key) => data.get(key) === 'on';
  const runMigrations = isChecked('runMigrations');
  const dashboards = [];
  if (isChecked('dashboardLead')) dashboards.push('lead');
  if (isChecked('dashboardSales')) dashboards.push('sales');
  if (isChecked('dashboardCallCenter')) dashboards.push('call-center');

  return {
    slug: getValue('slug'),
    supabaseUrl: getValue('supabaseUrl'),
    locationId: getValue('locationId'),
    dashboardTitle: getValue('dashboardTitle'),
    dashboardSubtitle: getValue('dashboardSubtitle'),
    logoUrl: getValue('logoUrl'),
    dashboardTabs: dashboards.join(','),
    autoFetchKeys: isChecked('autoFetchKeys'),
    accessToken: getValue('accessToken'),
    ghlPrivateIntegrationToken: getValue('ghlPrivateIntegrationToken'),
    dbPassword: getValue('dbPassword'),
    serviceRoleKey: getValue('serviceRoleKey'),
    publishableKey: getValue('publishableKey'),
    teamleaderClientId: getValue('teamleaderClientId'),
    teamleaderClientSecret: getValue('teamleaderClientSecret'),
    teamleaderRedirectUrl: getValue('teamleaderRedirectUrl'),
    teamleaderScopes: getValue('teamleaderScopes'),
    teamleaderEnabled: Boolean(teamleaderToggle?.checked),
    teamleaderAutoSync: isChecked('teamleaderAutoSync'),
    branchName: getValue('branchName'),
    baseBranch: getValue('baseBranch'),
    netlifyAccountSlug: getValue('netlifyAccountSlug'),
    netlifyRepo: getValue('netlifyRepo'),
    netlifyRepoProvider: getValue('netlifyRepoProvider'),
    netlifyRepoBranch: getValue('netlifyRepoBranch'),
    netlifyBuildCommand: getValue('netlifyBuildCommand'),
    netlifyPublishDir: getValue('netlifyPublishDir'),
    netlifyBaseDir: getValue('netlifyBaseDir'),
    netlifyCustomDomain: getValue('netlifyCustomDomain'),
    netlifyDomainAliases: getValue('netlifyDomainAliases'),
    netlifyDnsZoneName: getValue('netlifyDnsZoneName'),
    netlifyDnsZoneId: getValue('netlifyDnsZoneId'),
    netlifyDnsHost: getValue('netlifyDnsHost'),
    netlifyDnsValue: getValue('netlifyDnsValue'),
    netlifyDnsTtl: Number(getValue('netlifyDnsTtl') || 0),
    netlifySiteId: getValue('netlifySiteId'),
    netlifySiteName: getValue('netlifySiteName'),
    netlifyAuthToken: getValue('netlifyAuthToken'),
    netlifyEnvFile: getValue('netlifyEnvFile'),
    githubToken: getValue('githubToken'),
    applyConfig: isChecked('applyConfig'),
    createBranch: isChecked('createBranch'),
    pushBranch: isChecked('pushBranch'),
    linkProject: runMigrations || isChecked('linkProject'),
    pushSchema: runMigrations || isChecked('pushSchema'),
    deployFunctions: isChecked('deployFunctions'),
    netlifySyncEnv: isChecked('netlifySyncEnv'),
    netlifyCreateSite: isChecked('netlifyCreateSite'),
    netlifyTriggerDeploy: isChecked('netlifyTriggerDeploy'),
    netlifySetProdBranch: isChecked('netlifySetProdBranch'),
    netlifyCreateDnsRecord: isChecked('netlifyCreateDnsRecord'),
    netlifyReplaceEnv: isChecked('netlifyReplaceEnv'),
    noLayout: isChecked('noLayout'),
    writeDashboardEnv: isChecked('writeDashboardEnv'),
    openDashboard: isChecked('openDashboard')
  };
};

const getFieldValue = (name) => {
  const input = form?.querySelector(`[name="${name}"]`);
  return (input?.value || '').toString().trim();
};

const isFieldChecked = (name) => Boolean(form?.querySelector(`[name="${name}"]`)?.checked);

const yesNo = (value) => (value ? 'Ja' : 'Nee');
const masked = (value) => (value ? 'Ingevuld' : 'Niet ingevuld');
const maskedWithHint = (value, hintKey) => {
  if (value) return 'Ingevuld';
  if (envHints?.[hintKey]) return 'Ingevuld via env.local';
  return 'Niet ingevuld';
};

const buildSummary = () => {
  if (!summaryNode) return;
  const dashboards = [];
  if (isFieldChecked('dashboardLead')) dashboards.push('Leadgeneratie');
  if (isFieldChecked('dashboardSales')) dashboards.push('Sales Resultaten');
  if (isFieldChecked('dashboardCallCenter')) dashboards.push('Call Center');

  const teamleaderOn = Boolean(teamleaderToggle?.checked);
  const netlifyOn = Boolean(netlifyToggle?.checked);

  const summaryItems = [
    { label: 'Slug', value: getFieldValue('slug') || '-' },
    { label: 'Supabase', value: getFieldValue('supabaseUrl') || '-' },
    { label: 'Location ID', value: getFieldValue('locationId') || '-' },
    { label: 'Dashboards', value: dashboards.length ? dashboards.join(', ') : 'Geen' },
    { label: 'GHL token', value: masked(getFieldValue('ghlPrivateIntegrationToken')) },
    { label: 'Teamleader', value: teamleaderOn ? 'Aan' : 'Uit' },
    {
      label: 'Teamleader client id',
      value: teamleaderOn ? getFieldValue('teamleaderClientId') || '-' : '-'
    },
    {
      label: 'Teamleader auto sync',
      value: teamleaderOn ? yesNo(isFieldChecked('teamleaderAutoSync')) : '-'
    },
    { label: 'Apply config', value: yesNo(isFieldChecked('applyConfig')) },
    { label: 'Base schema', value: yesNo(isFieldChecked('runMigrations')) },
    { label: 'Deploy functions', value: yesNo(isFieldChecked('deployFunctions')) },
    { label: 'Dashboard .env', value: yesNo(isFieldChecked('writeDashboardEnv')) },
    { label: 'Open dashboard', value: yesNo(isFieldChecked('openDashboard')) },
    { label: 'Auto fetch keys', value: yesNo(isFieldChecked('autoFetchKeys')) },
    { label: 'Access token', value: maskedWithHint(getFieldValue('accessToken'), 'supabaseAccessToken') },
    { label: 'Server key', value: maskedWithHint(getFieldValue('serviceRoleKey'), 'supabaseServiceRoleJwt') },
    { label: 'Sync secret', value: maskedWithHint(getFieldValue('syncSecret'), 'syncSecret') },
    { label: 'Netlify', value: netlifyOn ? 'Aan' : 'Uit' },
    {
      label: 'Netlify site',
      value: netlifyOn ? getFieldValue('netlifySiteName') || getFieldValue('netlifySiteId') || '-' : '-'
    },
    { label: 'Custom domain', value: netlifyOn ? getFieldValue('netlifyCustomDomain') || '-' : '-' },
    { label: 'GitHub token', value: netlifyOn ? maskedWithHint(getFieldValue('githubToken'), 'githubToken') : '-' },
    { label: 'Netlify env sync', value: netlifyOn ? yesNo(isFieldChecked('netlifySyncEnv')) : '-' },
    { label: 'Netlify site create', value: netlifyOn ? yesNo(isFieldChecked('netlifyCreateSite')) : '-' },
    { label: 'Netlify build trigger', value: netlifyOn ? yesNo(isFieldChecked('netlifyTriggerDeploy')) : '-' },
    { label: 'Create branch', value: yesNo(isFieldChecked('createBranch')) },
    { label: 'Push branch', value: yesNo(isFieldChecked('pushBranch')) }
  ];

  summaryNode.innerHTML = summaryItems
    .map(
      (item) =>
        `<div class="summary-row"><span class="summary-label">${item.label}</span><span class="summary-value">${item.value}</span></div>`
    )
    .join('');
};

const loadEnvHints = async () => {
  try {
    const response = await fetch('/api/env-hints');
    if (!response.ok) return;
    const data = await response.json();
    envHints = {
      supabaseAccessToken: Boolean(data?.supabaseAccessToken),
      netlifyAuthToken: Boolean(data?.netlifyAuthToken),
      supabaseServiceRoleJwt: Boolean(data?.supabaseServiceRoleJwt),
      githubToken: Boolean(data?.githubToken),
      syncSecret: Boolean(data?.syncSecret)
    };
    if (currentStep === TOTAL_STEPS) {
      buildSummary();
      loadSourceSuggestions({ force: true });
    }
  } catch {
    // ignore
  }
};

const setStep = (step) => {
  currentStep = Math.min(Math.max(step, 1), TOTAL_STEPS);
  stepPanels.forEach((panel) => {
    setHidden(panel, panel.dataset.step !== String(currentStep));
  });
  stepIndicators.forEach((indicator) => {
    const value = Number(indicator.dataset.stepIndicator || 0);
    indicator.classList.toggle('active', value === currentStep);
    indicator.classList.toggle('complete', value < currentStep);
  });
  setHidden(prevStepBtn, currentStep === 1);
  setHidden(nextStepBtn, currentStep === TOTAL_STEPS);
  setHidden(submitStepBtn, currentStep !== TOTAL_STEPS);
  if (currentStep === TOTAL_STEPS) {
    buildSummary();
    loadSourceSuggestions();
  }
  setStatus('', 'muted');
};

const validateStep = (step) => {
  if (step === 1) {
    const required = [
      { name: 'slug', label: 'Slug' },
      { name: 'supabaseUrl', label: 'Supabase URL' },
      { name: 'locationId', label: 'GHL Location ID' }
    ];
    const missing = [];
    let firstMissing = null;
    required.forEach((field) => {
      const input = form?.querySelector(`[name="${field.name}"]`);
      const value = input?.value?.trim();
      const hasValue = Boolean(value);
      setInputError(input, !hasValue);
      if (!hasValue) {
        missing.push(field.label);
        if (!firstMissing) firstMissing = input;
      }
    });
    if (missing.length) {
      setStatus(`Vul in: ${missing.join(', ')}`, 'error');
      firstMissing?.focus();
      return false;
    }
  }

  if (step === 2) {
    const hasDashboard =
      isFieldChecked('dashboardLead') || isFieldChecked('dashboardSales') || isFieldChecked('dashboardCallCenter');
    if (!hasDashboard) {
      setStatus('Selecteer minstens een dashboard.', 'error');
      return false;
    }
  }

  if (step === 3 && teamleaderToggle?.checked) {
    const clientId = form?.querySelector('[name="teamleaderClientId"]');
    const clientSecret = form?.querySelector('[name="teamleaderClientSecret"]');
    const hasClientId = Boolean(clientId?.value?.trim());
    const hasClientSecret = Boolean(clientSecret?.value?.trim());
    setInputError(clientId, !hasClientId);
    setInputError(clientSecret, !hasClientSecret);
    if (!hasClientId || !hasClientSecret) {
      setStatus('Teamleader client id en secret zijn verplicht of zet de toggle uit.', 'error');
      return false;
    }
  }

  return true;
};

const initUi = () => {
  loadBasicState();
  setAdvancedMode(Boolean(advancedToggle?.checked));
  setTeamleaderEnabled(Boolean(teamleaderToggle?.checked));
  setNetlifyEnabled(Boolean(netlifyToggle?.checked));
  setManualKeysVisible(!autoFetchInput?.checked);
  syncAdvancedFromMigrations();
  updateDbPasswordVisibility();
  syncNetlifyProdBranch();
  syncBranchAutomation();
  setTeamleaderAction(false);
  setTeamleaderSyncAction(false);
  setDashboardStatus('');
  if (slugInput?.value && netlifyToggle?.checked) {
    updateNetlifySiteName(slugInput.value);
    updateCustomDomain(slugInput.value);
  }
  if (netlifyCustomDomainInput?.value) {
    updateDnsFromDomain(netlifyCustomDomainInput.value);
  }
  if (netlifySiteNameInput?.value) {
    updateDnsValueFromSiteName(netlifySiteNameInput.value);
  }
  updateTeamleaderRedirect();
  if (netlifyToggle?.checked) {
    setNetlifyStatus('Nog niet gecheckt.', 'muted');
  }
  loadEnvHints();
  setStep(currentStep);
};

const slugInput = form?.querySelector('[name="slug"]');
const branchInput = form?.querySelector('[name="branchName"]');

if (slugInput) {
  slugInput.addEventListener('input', () => {
    const raw = slugInput.value || '';
    const cleaned = raw
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    if (branchInput && !branchInput.value) {
      branchInput.value = cleaned;
    }
    if (netlifyToggle?.checked) {
      updateNetlifySiteName(cleaned);
      updateCustomDomain(cleaned);
    }
    saveBasicState();
  });
}

if (netlifyCustomDomainInput) {
  netlifyCustomDomainInput.addEventListener('input', () => {
    const value = netlifyCustomDomainInput.value.trim();
    netlifyCustomDomainInput.dataset.userEdited = value ? 'true' : 'false';
    updateDnsFromDomain(value);
  });
}

if (netlifySiteNameInput) {
  netlifySiteNameInput.addEventListener('input', () => {
    const value = netlifySiteNameInput.value.trim();
    netlifySiteNameInput.dataset.userEdited = value ? 'true' : 'false';
    updateDnsValueFromSiteName(value);
  });
}

[netlifyDnsHostInput, netlifyDnsZoneInput, netlifyDnsValueInput].forEach((input) => {
  if (!input) return;
  input.addEventListener('input', () => {
    const value = input.value.trim();
    input.dataset.userEdited = value ? 'true' : 'false';
  });
});

supabaseUrlInput?.addEventListener('input', () => {
  updateTeamleaderRedirect();
  saveBasicState();
});

teamleaderRedirectInput?.addEventListener('input', () => {
  const value = teamleaderRedirectInput.value.trim();
  teamleaderRedirectInput.dataset.userEdited = value ? 'true' : 'false';
  if (teamleaderRedirectPreview) {
    teamleaderRedirectPreview.value = value;
  }
  if (copyRedirectBtn) {
    copyRedirectBtn.disabled = !value;
  }
});

copyRedirectBtn?.addEventListener('click', async () => {
  const value = teamleaderRedirectPreview?.value?.trim();
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copyRedirectBtn.textContent = 'Gekopieerd';
    setTimeout(() => {
      copyRedirectBtn.textContent = 'Kopieer';
    }, 1500);
  } catch {
    // ignore clipboard errors
  }
});

netlifyCheckBtn?.addEventListener('click', async () => {
  if (!netlifyStatusNode) return;
  setNetlifyStatus('Aan het checken...', 'muted');
  netlifyCheckBtn.disabled = true;
  try {
    const response = await fetch('/api/netlify-status');
    const result = await response.json();
    const status = interpretNetlifyStatus(result);
    setNetlifyStatus(status.text, status.tone);
  } catch (error) {
    setNetlifyStatus('Netlify check faalde.', 'error');
  } finally {
    netlifyCheckBtn.disabled = false;
  }
});

sourceSuggestRefreshBtn?.addEventListener('click', async () => {
  await loadSourceSuggestions({ force: true });
});

BASIC_FIELDS.forEach((field) => {
  const input = form?.querySelector(`[name="${field}"]`);
  if (!input || input === slugInput) return;
  input.addEventListener('input', saveBasicState);
});

BASIC_CHECKS.forEach((field) => {
  const input = form?.querySelector(`[name="${field}"]`);
  if (!input) return;
  input.addEventListener('change', saveBasicState);
});

advancedToggle?.addEventListener('change', () => {
  setAdvancedMode(advancedToggle.checked);
});

teamleaderToggle?.addEventListener('change', () => {
  setTeamleaderEnabled(teamleaderToggle.checked);
  setTeamleaderAction(false);
  setTeamleaderSyncAction(false);
});

netlifyToggle?.addEventListener('change', () => {
  setNetlifyEnabled(netlifyToggle.checked);
  setNetlifyStatus(netlifyToggle.checked ? 'Nog niet gecheckt.' : '', 'muted');
});

autoFetchInput?.addEventListener('change', () => {
  setManualKeysVisible(!autoFetchInput.checked);
});

runMigrationsInput?.addEventListener('change', () => {
  syncAdvancedFromMigrations();
  updateDbPasswordVisibility();
});

linkProjectInput?.addEventListener('change', () => {
  syncMigrationsFromAdvanced();
  updateDbPasswordVisibility();
});

pushSchemaInput?.addEventListener('change', () => {
  syncMigrationsFromAdvanced();
  updateDbPasswordVisibility();
});
netlifyCreateSiteInput?.addEventListener('change', syncNetlifyProdBranch);
netlifyCreateSiteInput?.addEventListener('change', syncBranchAutomation);

prevStepBtn?.addEventListener('click', () => {
  setStep(currentStep - 1);
});

nextStepBtn?.addEventListener('click', () => {
  if (validateStep(currentStep)) {
    setStep(currentStep + 1);
  }
});

initUi();

syncNowBtn?.addEventListener('click', async () => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) {
    setSyncStatus('Vul een geldige Supabase URL in.', 'error');
    return;
  }

  syncNowBtn.disabled = true;
  setSyncStatus('Sync gestart...', 'muted');

  try {
    const response = await fetch('/api/ghl-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef: ref,
        supabaseUrl: supabaseUrlInput?.value || '',
        syncSecret: getFieldValue('syncSecret'),
        fullSync: true
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setSyncStatus(`Sync faalde${detail}`, 'error');
      return;
    }

    const summary = result?.data?.results
      ? Object.entries(result.data.results)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : '';
    setSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
  } catch (error) {
    setSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
  } finally {
    syncNowBtn.disabled = false;
  }
});

teamleaderSyncNowBtn?.addEventListener('click', async () => {
  await triggerTeamleaderSync();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (currentStep !== TOTAL_STEPS) {
    if (validateStep(currentStep)) {
      setStep(currentStep + 1);
    }
    return;
  }
  setStatus('Bezig met onboarding...', 'muted');
  setOutput('Running...');
  runBtn.disabled = true;
  lastPayload = buildPayload();

  try {
    const response = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastPayload)
    });

    const result = await response.json();
    if (!response.ok) {
      const details = result?.details ? `\n- ${result.details.join('\n- ')}` : '';
      setStatus('Fout tijdens onboarding', 'error');
      setOutput(`${result?.error || 'Onbekende fout'}${details}`);
      runBtn.disabled = false;
      return;
    }

    const header = result.ok ? 'Onboarding klaar' : 'Onboarding met fouten';
    setStatus(header, result.ok ? 'muted' : 'error');

    const showTeamleader = result.ok && Boolean(teamleaderToggle?.checked);
    setTeamleaderAction(showTeamleader);
    setTeamleaderSyncAction(showTeamleader);
    setSyncAction(result.ok);

    const shouldAutoSync = showTeamleader && isFieldChecked('teamleaderAutoSync');
    if (shouldAutoSync) {
      startTeamleaderAutopilot();
    }
    if (isFieldChecked('openDashboard')) {
      setDashboardStatus('Dashboard starten...', 'muted');
      const dashboardStart = await startDashboardDev();
      if (dashboardStart?.ok) {
        setDashboardStatus('Dashboard klaar.', 'ok');
        window.open('http://localhost:5173', '_blank', 'noopener,noreferrer');
      } else {
        setDashboardStatus('Dashboard start faalde.', 'error');
        setStatus('Dashboard kon niet opstarten.', 'error');
      }
    }


    const logs = [
      `Exit code: ${result.exitCode}`,
      '',
      '--- STDOUT ---',
      result.stdout || '(leeg)',
      '',
      '--- STDERR ---',
      result.stderr || '(leeg)'
    ];
    if (result?.dashboardEnv) {
      logs.push('', '--- DASHBOARD ENV ---');
      if (result.dashboardEnv.ok) {
        logs.push(`Geschreven: ${result.dashboardEnv.path}`);
        if (result.dashboardEnv.backupPath) {
          logs.push(`Backup: ${result.dashboardEnv.backupPath}`);
        }
      } else {
        logs.push(`Fout: ${result.dashboardEnv.error || 'Onbekend'}`);
      }
    }


    const testLinks = buildTestLinks();
    if (testLinks) {
      logs.push(testLinks);
    }
    setOutput(logs.join('\n'));
  } catch (error) {
    setStatus('Fout tijdens onboarding', 'error');
    setOutput(error instanceof Error ? error.message : 'Onbekende fout');
  } finally {
    runBtn.disabled = false;
  }
});

