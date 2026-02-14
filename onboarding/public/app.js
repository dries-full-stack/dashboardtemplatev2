const form = document.getElementById('onboard-form');
const output = document.getElementById('output');
const statusNode = document.getElementById('status');
const runBtn = document.getElementById('run-btn');
const advancedToggle = document.getElementById('advancedMode');
const brandColorsToggle = document.getElementById('enableBrandColors');
const teamleaderToggle = document.getElementById('enableTeamleader');
const metaToggle = document.getElementById('enableMetaSpend');
const netlifyToggle = document.getElementById('enableNetlify');

const advancedSections = Array.from(document.querySelectorAll('[data-advanced]:not([data-netlify])'));
const advancedNetlifySections = Array.from(document.querySelectorAll('[data-advanced][data-netlify]'));
const brandColorSections = Array.from(document.querySelectorAll('[data-brand-colors]'));
const teamleaderSections = Array.from(document.querySelectorAll('[data-teamleader]'));
const metaSections = Array.from(document.querySelectorAll('[data-meta]'));
const googleApiSections = Array.from(document.querySelectorAll('[data-google-api]'));
const googleSheetSections = Array.from(document.querySelectorAll('[data-google-sheet]'));
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
const brandPrimaryColorInput = document.getElementById('brandPrimaryColor');
const brandSecondaryColorInput = document.getElementById('brandSecondaryColor');
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
const metaSyncAction = document.getElementById('metaSyncAction');
const metaSyncNowBtn = document.getElementById('metaSyncNow');
const metaSyncStatusNode = document.getElementById('metaSyncStatus');
const googleSyncAction = document.getElementById('googleSyncAction');
const googleSyncNowBtn = document.getElementById('googleSyncNow');
const googleSyncStatusNode = document.getElementById('googleSyncStatus');
const googleSheetSyncAction = document.getElementById('googleSheetSyncAction');
const googleSheetSyncNowBtn = document.getElementById('googleSheetSyncNow');
const googleSheetSyncStatusNode = document.getElementById('googleSheetSyncStatus');
const cronInstallAction = document.getElementById('cronInstallAction');
const cronInstallNowBtn = document.getElementById('cronInstallNow');
const cronInstallStatusNode = document.getElementById('cronInstallStatus');
const healthCard = document.getElementById('healthCard');
const healthRunBtn = document.getElementById('healthRun');
const healthStatusNode = document.getElementById('healthStatus');
const healthContentNode = document.getElementById('healthContent');
const dashboardStatusNode = document.getElementById('dashboardStatus');
const teamleaderAutoSyncInput = form?.querySelector('[name="teamleaderAutoSync"]');
const sourceSuggestRefreshBtn = document.getElementById('sourceSuggestRefresh');
const sourceSuggestStatusNode = document.getElementById('sourceSuggestStatus');
const sourceSuggestContentNode = document.getElementById('sourceSuggestContent');
const preflightRunBtn = document.getElementById('preflightRun');
const preflightStatusNode = document.getElementById('preflightStatus');
const preflightContentNode = document.getElementById('preflightContent');

const BASIC_STORAGE_KEY = 'onboard-basic';
const BASIC_FIELDS = [
  'slug',
  'supabaseUrl',
  'locationId',
  'dashboardTitle',
  'dashboardSubtitle',
  'logoUrl',
  'brandPrimaryColor',
  'brandSecondaryColor'
];
const BASIC_CHECKS = [
  'dashboardLead',
  'dashboardSales',
  'dashboardCallCenter',
  'enableBrandColors',
  'autoGhlSync',
  'autoMetaSync',
  'autoGoogleSpendSync',
  'installCronSchedules',
  'autoHealthCheck'
];
const DEFAULT_CUSTOM_DOMAIN_SUFFIX = 'profitpulse.be';
const DEFAULT_NETLIFY_SITE_PREFIX = 'dashboard-';
let currentStep = 1;
const TOTAL_STEPS = stepPanels.length || 1;
let envHints = {
  supabaseAccessToken: false,
  netlifyAuthToken: false,
  supabaseServiceRoleJwt: false,
  githubToken: false,
  syncSecret: false,
  metaAccessToken: false,
  googleDeveloperToken: false,
  sheetCsvUrl: false
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

const setBrandColorsEnabled = (enabled) => {
  toggleGroup(brandColorSections, enabled);
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

const getGoogleSpendMode = () => {
  const input = form?.querySelector('[name="googleSpendMode"]:checked');
  const raw = (input?.value || '').toString().trim().toLowerCase();
  return raw || 'none';
};

const setMetaEnabled = (enabled) => {
  toggleGroup(metaSections, enabled);
  if (!enabled) {
    clearFields(['metaAccessToken', 'metaAdAccountId', 'metaTimezone']);
  }
};

const setGoogleSpendMode = (mode) => {
  const normalized = (mode || '').toString().trim().toLowerCase();
  const isApi = normalized === 'api';
  const isSheet = normalized === 'sheet';

  toggleGroup(googleApiSections, isApi);
  toggleGroup(googleSheetSections, isSheet);

  if (!isApi) {
    clearFields([
      'googleDeveloperToken',
      'googleClientId',
      'googleClientSecret',
      'googleRefreshToken',
      'googleCustomerId',
      'googleLoginCustomerId',
      'googleTimezone'
    ]);
  }
  if (!isSheet) {
    clearFields(['sheetCsvUrl', 'sheetHeaderRow']);
  }
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

const setMetaSyncAction = (enabled) => {
  if (!metaSyncAction) return;
  metaSyncAction.classList.toggle('hidden', !enabled);
  if (!enabled && metaSyncStatusNode) {
    metaSyncStatusNode.textContent = '';
    metaSyncStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const setGoogleSyncAction = (enabled) => {
  if (!googleSyncAction) return;
  googleSyncAction.classList.toggle('hidden', !enabled);
  if (!enabled && googleSyncStatusNode) {
    googleSyncStatusNode.textContent = '';
    googleSyncStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const setGoogleSheetSyncAction = (enabled) => {
  if (!googleSheetSyncAction) return;
  googleSheetSyncAction.classList.toggle('hidden', !enabled);
  if (!enabled && googleSheetSyncStatusNode) {
    googleSheetSyncStatusNode.textContent = '';
    googleSheetSyncStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const setCronInstallAction = (enabled) => {
  if (!cronInstallAction) return;
  cronInstallAction.classList.toggle('hidden', !enabled);
  if (!enabled && cronInstallStatusNode) {
    cronInstallStatusNode.textContent = '';
    cronInstallStatusNode.classList.remove('ok', 'warn', 'error');
  }
};

const setHealthCardVisible = (visible) => {
  if (!healthCard) return;
  healthCard.classList.toggle('hidden', !visible);
  if (!visible) {
    setHealthStatus('');
    if (healthContentNode) healthContentNode.innerHTML = '';
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
      if (!input) return;
      const isColor = input instanceof HTMLInputElement && input.type === 'color';
      if (!isColor && input.value) return;
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

const sanitizeSlugValue = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const parseBooleanParam = (value) => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (!raw) return null;
  if (raw === '1' || raw === 'true' || raw === 'yes' || raw === 'y' || raw === 'on') return true;
  if (raw === '0' || raw === 'false' || raw === 'no' || raw === 'n' || raw === 'off') return false;
  return null;
};

const parseListParam = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const applyQueryPrefill = () => {
  if (!form) return { applied: false };

  const params = new URLSearchParams(window.location.search || '');
  const keys = Array.from(params.keys());
  if (!keys.length) return { applied: false };

  const from = (params.get('from') || '').toString().trim().toLowerCase();
  const force = from === 'hub' || params.get('prefill') === '1';

  const setTextField = (name, value, options = {}) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input || input.type === 'checkbox') return false;
    const next = String(value || '').trim();
    if (!next) return false;
    const isColor = input instanceof HTMLInputElement && input.type === 'color';
    if (!options.force && !isColor && input.value) return false;
    input.value = next;
    return true;
  };

  const setCheckboxField = (name, checked, options = {}) => {
    const input = form.querySelector(`[name="${name}"]`);
    if (!input || input.type !== 'checkbox') return false;
    if (!options.force && input.checked === checked) return false;
    input.checked = checked;
    return true;
  };

  const applied = [];

  const slugParam = params.get('slug') || '';
  if (slugParam) {
    const cleaned = sanitizeSlugValue(slugParam);
    if (cleaned && setTextField('slug', cleaned, { force })) applied.push('slug');
  }

  const supabaseParam =
    params.get('supabaseUrl') ||
    params.get('supabase_url') ||
    params.get('projectRef') ||
    params.get('project_ref') ||
    '';
  if (supabaseParam && setTextField('supabaseUrl', supabaseParam, { force })) applied.push('supabaseUrl');

  const locationParam = params.get('locationId') || params.get('location_id') || '';
  if (locationParam && setTextField('locationId', locationParam, { force })) applied.push('locationId');

  const titleParam =
    params.get('dashboardTitle') || params.get('dashboard_title') || params.get('company') || '';
  if (titleParam && setTextField('dashboardTitle', titleParam, { force })) applied.push('dashboardTitle');

  const subtitleParam = params.get('dashboardSubtitle') || params.get('dashboard_subtitle') || '';
  if (subtitleParam && setTextField('dashboardSubtitle', subtitleParam, { force })) applied.push('dashboardSubtitle');

  const logoParam = params.get('logoUrl') || params.get('logo_url') || '';
  if (logoParam && setTextField('logoUrl', logoParam, { force })) applied.push('logoUrl');

  const dashboardTabsParam = params.get('dashboardTabs') || params.get('dashboard_tabs') || params.get('dashboards') || '';
  if (dashboardTabsParam) {
    const tabs = new Set(parseListParam(dashboardTabsParam).map((tab) => tab.toLowerCase()));
    const callCenterOn = tabs.has('call-center') || tabs.has('callcenter') || tabs.has('call_center');
    if (setCheckboxField('dashboardLead', tabs.has('lead'), { force })) applied.push('dashboardLead');
    if (setCheckboxField('dashboardSales', tabs.has('sales'), { force })) applied.push('dashboardSales');
    if (setCheckboxField('dashboardCallCenter', callCenterOn, { force })) applied.push('dashboardCallCenter');
  }

  const brandEnabledParam = params.get('enableBrandColors') || params.get('brandColorsEnabled') || params.get('brand_colors') || '';
  const brandEnabled = parseBooleanParam(brandEnabledParam);
  if (brandEnabled !== null) {
    if (setCheckboxField('enableBrandColors', brandEnabled, { force })) applied.push('enableBrandColors');
  }

  const primaryParam = params.get('brandPrimaryColor') || params.get('brand_primary_color') || '';
  if (primaryParam && setTextField('brandPrimaryColor', primaryParam, { force })) applied.push('brandPrimaryColor');

  const secondaryParam = params.get('brandSecondaryColor') || params.get('brand_secondary_color') || '';
  if (secondaryParam && setTextField('brandSecondaryColor', secondaryParam, { force })) applied.push('brandSecondaryColor');

  if (!applied.length) return { applied: false };

  saveBasicState();

  // Avoid re-applying on refresh; localStorage keeps the data anyway.
  if (force && typeof window.history?.replaceState === 'function') {
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // ignore
    }
  }

  return { applied: true, fields: applied };
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

const setMetaSyncStatus = (text, tone = 'muted') => {
  if (!metaSyncStatusNode) return;
  metaSyncStatusNode.textContent = text;
  metaSyncStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') metaSyncStatusNode.classList.add('ok');
  if (tone === 'warn') metaSyncStatusNode.classList.add('warn');
  if (tone === 'error') metaSyncStatusNode.classList.add('error');
};

const setGoogleSyncStatus = (text, tone = 'muted') => {
  if (!googleSyncStatusNode) return;
  googleSyncStatusNode.textContent = text;
  googleSyncStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') googleSyncStatusNode.classList.add('ok');
  if (tone === 'warn') googleSyncStatusNode.classList.add('warn');
  if (tone === 'error') googleSyncStatusNode.classList.add('error');
};

const setGoogleSheetSyncStatus = (text, tone = 'muted') => {
  if (!googleSheetSyncStatusNode) return;
  googleSheetSyncStatusNode.textContent = text;
  googleSheetSyncStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') googleSheetSyncStatusNode.classList.add('ok');
  if (tone === 'warn') googleSheetSyncStatusNode.classList.add('warn');
  if (tone === 'error') googleSheetSyncStatusNode.classList.add('error');
};

const setCronInstallStatus = (text, tone = 'muted') => {
  if (!cronInstallStatusNode) return;
  cronInstallStatusNode.textContent = text;
  cronInstallStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') cronInstallStatusNode.classList.add('ok');
  if (tone === 'warn') cronInstallStatusNode.classList.add('warn');
  if (tone === 'error') cronInstallStatusNode.classList.add('error');
};

const setPreflightStatus = (text, tone = 'muted') => {
  if (!preflightStatusNode) return;
  preflightStatusNode.textContent = text;
  preflightStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') preflightStatusNode.classList.add('ok');
  if (tone === 'warn') preflightStatusNode.classList.add('warn');
  if (tone === 'error') preflightStatusNode.classList.add('error');
};

const setHealthStatus = (text, tone = 'muted') => {
  if (!healthStatusNode) return;
  healthStatusNode.textContent = text;
  healthStatusNode.classList.remove('ok', 'warn', 'error');
  if (tone === 'ok') healthStatusNode.classList.add('ok');
  if (tone === 'warn') healthStatusNode.classList.add('warn');
  if (tone === 'error') healthStatusNode.classList.add('error');
};

const triggerGhlSync = async ({
  fullSync = false,
  initialWindowDays = 60,
  entities = ['contacts', 'opportunities', 'appointments', 'lost_reasons'],
  statusText = 'Sync gestart...'
} = {}) => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) {
    setSyncStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (syncNowBtn) syncNowBtn.disabled = true;
  setSyncStatus(statusText, 'muted');

  const safeInitialWindowDays = Number.isFinite(Number(initialWindowDays)) ? Number(initialWindowDays) : 0;

  try {
    const response = await fetch('/api/ghl-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef: ref,
        supabaseUrl: supabaseUrlInput?.value || '',
        syncSecret: getFieldValue('syncSecret'),
        fullSync: Boolean(fullSync),
        initialWindowDays: safeInitialWindowDays > 0 ? safeInitialWindowDays : undefined,
        entities
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setSyncStatus(`Sync faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const summary = result?.data?.results
      ? Object.entries(result.data.results)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : '';
    setSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (syncNowBtn) syncNowBtn.disabled = false;
  }
};

const triggerMetaSync = async ({ lookbackDays = 7, endOffsetDays = 1 } = {}) => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) {
    setMetaSyncStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (metaSyncNowBtn) metaSyncNowBtn.disabled = true;
  setMetaSyncStatus('Meta sync gestart...', 'muted');

  try {
    const response = await fetch('/api/meta-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef: ref,
        supabaseUrl: supabaseUrlInput?.value || '',
        syncSecret: getFieldValue('syncSecret'),
        lookbackDays,
        endOffsetDays
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setMetaSyncStatus(`Sync faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const upserted = Number(result?.data?.upserted ?? result?.data?.upserted_daily ?? 0);
    const summary = upserted ? `Upserted: ${upserted}` : '';
    setMetaSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setMetaSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (metaSyncNowBtn) metaSyncNowBtn.disabled = false;
  }
};

const triggerGoogleSync = async ({ lookbackDays = 7, endOffsetDays = 1 } = {}) => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) {
    setGoogleSyncStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (googleSyncNowBtn) googleSyncNowBtn.disabled = true;
  setGoogleSyncStatus('Google sync gestart...', 'muted');

  try {
    const response = await fetch('/api/google-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef: ref,
        supabaseUrl: supabaseUrlInput?.value || '',
        lookbackDays,
        endOffsetDays
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setGoogleSyncStatus(`Sync faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const upserted = Number(result?.data?.upserted ?? 0);
    const summary = upserted ? `Upserted: ${upserted}` : '';
    setGoogleSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setGoogleSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (googleSyncNowBtn) googleSyncNowBtn.disabled = false;
  }
};

const triggerGoogleSheetSync = async ({ lookbackDays = 7, endOffsetDays = 1 } = {}) => {
  const ref = extractProjectRef(supabaseUrlInput?.value || '');
  if (!ref) {
    setGoogleSheetSyncStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (googleSheetSyncNowBtn) googleSheetSyncNowBtn.disabled = true;
  setGoogleSheetSyncStatus('Sheet sync gestart...', 'muted');

  try {
    const response = await fetch('/api/google-sheet-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef: ref,
        supabaseUrl: supabaseUrlInput?.value || '',
        lookbackDays,
        endOffsetDays
      })
    });

    const result = await response.json();
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setGoogleSheetSyncStatus(`Sync faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const daily = Number(result?.data?.upserted_daily ?? 0);
    const campaigns = Number(result?.data?.upserted_campaigns ?? 0);
    const summary = daily || campaigns ? `Daily: ${daily}, Campaigns: ${campaigns}` : '';
    setGoogleSheetSyncStatus(summary ? `Sync klaar: ${summary}` : 'Sync klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setGoogleSheetSyncStatus(error instanceof Error ? error.message : 'Sync faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (googleSheetSyncNowBtn) googleSheetSyncNowBtn.disabled = false;
  }
};

const triggerCronInstall = async () => {
  const projectRef = extractProjectRef(supabaseUrlInput?.value || '');
  if (!projectRef) {
    setCronInstallStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (cronInstallNowBtn) cronInstallNowBtn.disabled = true;
  setCronInstallStatus('Cron install gestart...', 'muted');

  try {
    const response = await fetch('/api/cron-install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef,
        supabaseUrl: supabaseUrlInput?.value || '',
        locationId: getFieldValue('locationId'),
        serviceRoleKey: getFieldValue('serviceRoleKey'),
        accessToken: getFieldValue('accessToken'),
        syncSecret: getFieldValue('syncSecret'),
        teamleaderEnabled: Boolean(teamleaderToggle?.checked),
        metaEnabled: Boolean(metaToggle?.checked),
        googleSpendMode: getGoogleSpendMode()
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setCronInstallStatus(`Cron install faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const jobs = result?.data?.jobs && typeof result.data.jobs === 'object' ? Object.keys(result.data.jobs) : [];
    const summary = jobs.length ? `Jobs: ${jobs.join(', ')}` : '';
    setCronInstallStatus(summary ? `Cron klaar: ${summary}` : 'Cron klaar.', 'ok');
    return { ok: true, result };
  } catch (error) {
    setCronInstallStatus(error instanceof Error ? error.message : 'Cron install faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (cronInstallNowBtn) cronInstallNowBtn.disabled = false;
  }
};

const triggerHealthCheck = async () => {
  const projectRef = extractProjectRef(supabaseUrlInput?.value || '');
  if (!projectRef) {
    setHealthStatus('Vul een geldige Supabase URL in.', 'error');
    return { ok: false };
  }

  if (healthRunBtn) healthRunBtn.disabled = true;
  setHealthStatus('Health check bezig...', 'muted');
  if (healthContentNode) healthContentNode.innerHTML = '';

  try {
    const response = await fetch('/api/health-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectRef,
        supabaseUrl: supabaseUrlInput?.value || '',
        locationId: getFieldValue('locationId'),
        serviceRoleKey: getFieldValue('serviceRoleKey'),
        accessToken: getFieldValue('accessToken'),
        teamleaderEnabled: Boolean(teamleaderToggle?.checked),
        metaEnabled: Boolean(metaToggle?.checked),
        googleSpendMode: getGoogleSpendMode(),
        installCronSchedules: isFieldChecked('installCronSchedules')
      })
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      const checks = Array.isArray(result?.checks) ? result.checks : [];
      renderCheckTable(healthContentNode, checks);
      const detail = result?.error ? ` (${result.error})` : '';
      setHealthStatus(`Health check faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const checks = Array.isArray(result?.checks) ? result.checks : [];
    renderCheckTable(healthContentNode, checks);
    const tone = worstCheckTone(checks);
    setHealthStatus(
      tone === 'error' ? 'Health check met fouten.' : tone === 'warn' ? 'Health check met waarschuwingen.' : 'Health check OK.',
      tone
    );
    return { ok: true, result };
  } catch (error) {
    setHealthStatus(error instanceof Error ? error.message : 'Health check faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (healthRunBtn) healthRunBtn.disabled = false;
  }
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

const normalizeCheckTone = (value) => {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'ok' || raw === 'success') return 'ok';
  if (raw === 'warn' || raw === 'warning') return 'warn';
  if (raw === 'error' || raw === 'fail' || raw === 'failed') return 'error';
  return 'muted';
};

const worstCheckTone = (checks = []) => {
  const items = Array.isArray(checks) ? checks : [];
  let hasWarn = false;
  for (const check of items) {
    const tone = normalizeCheckTone(check?.status ?? check?.tone);
    if (tone === 'error') return 'error';
    if (tone === 'warn') hasWarn = true;
  }
  return hasWarn ? 'warn' : 'ok';
};

const renderCheckTable = (container, checks = []) => {
  if (!container) return;
  const items = Array.isArray(checks) ? checks : [];
  if (!items.length) {
    container.innerHTML = '<p class="muted">Geen checks beschikbaar.</p>';
    return;
  }

  const rows = items
    .map((item) => {
      const label = escapeHtml(item?.label ?? item?.name ?? item?.id ?? '-');
      const tone = normalizeCheckTone(item?.status ?? item?.tone);
      const statusText = tone === 'ok' ? 'OK' : tone === 'warn' ? 'WARN' : tone === 'error' ? 'ERROR' : '-';
      const statusHtml =
        tone === 'muted'
          ? `<span class="status-inline">${statusText}</span>`
          : `<span class="status-inline ${tone}">${statusText}</span>`;
      const detailsRaw = String(item?.details ?? item?.detail ?? item?.message ?? '');
      const details = escapeHtml(detailsRaw).replace(/\n/g, '<br />') || '-';
      return `
        <tr>
          <td>${label}</td>
          <td>${statusHtml}</td>
          <td>${details}</td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <table class="normalization-table">
      <thead>
        <tr>
          <th>Check</th>
          <th>Status</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

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

const runPreflightChecks = async () => {
  if (!form) return { ok: false };

  if (preflightRunBtn) preflightRunBtn.disabled = true;
  setPreflightStatus('Checks bezig...', 'muted');
  if (preflightContentNode) preflightContentNode.innerHTML = '';

  try {
    const payload = {
      ...buildPayload(),
      runMigrations: isFieldChecked('runMigrations'),
      netlifyEnabled: Boolean(netlifyToggle?.checked),
      installCronSchedules: isFieldChecked('installCronSchedules'),
      autoHealthCheck: isFieldChecked('autoHealthCheck'),
      syncSecret: getFieldValue('syncSecret'),
      teamleaderEnabled: Boolean(teamleaderToggle?.checked),
      metaEnabled: Boolean(metaToggle?.checked),
      googleSpendMode: getGoogleSpendMode()
    };

    const response = await fetch('/api/preflight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    const checks = Array.isArray(result?.checks) ? result.checks : [];
    renderCheckTable(preflightContentNode, checks);

    if (!response.ok || !result?.ok) {
      const detail = result?.error ? ` (${result.error})` : '';
      setPreflightStatus(`Preflight faalde${detail}`, 'error');
      return { ok: false, result };
    }

    const tone = worstCheckTone(checks);
    setPreflightStatus(
      tone === 'error' ? 'Preflight met fouten.' : tone === 'warn' ? 'Preflight met waarschuwingen.' : 'Preflight OK.',
      tone
    );
    return { ok: true, result };
  } catch (error) {
    setPreflightStatus(error instanceof Error ? error.message : 'Preflight faalde.', 'error');
    return { ok: false, error };
  } finally {
    if (preflightRunBtn) preflightRunBtn.disabled = false;
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
    brandColorsEnabled: Boolean(brandColorsToggle?.checked),
    brandPrimaryColor: getValue('brandPrimaryColor'),
    brandSecondaryColor: getValue('brandSecondaryColor'),
    dashboardTabs: dashboards.join(','),
    autoFetchKeys: isChecked('autoFetchKeys'),
    accessToken: getValue('accessToken'),
    ghlPrivateIntegrationToken: getValue('ghlPrivateIntegrationToken'),
    stripePaymentLink: getValue('stripePaymentLink'),
    stripeBillingPortalUrl: getValue('stripeBillingPortalUrl'),
    stripeBuyButtonId: getValue('stripeBuyButtonId'),
    stripePublishableKey: getValue('stripePublishableKey'),
    stripeCheckoutEmbed: isChecked('stripeCheckoutEmbed'),
    dbPassword: getValue('dbPassword'),
    serviceRoleKey: getValue('serviceRoleKey'),
    publishableKey: getValue('publishableKey'),
    teamleaderClientId: getValue('teamleaderClientId'),
    teamleaderClientSecret: getValue('teamleaderClientSecret'),
    teamleaderRedirectUrl: getValue('teamleaderRedirectUrl'),
    teamleaderScopes: getValue('teamleaderScopes'),
    teamleaderEnabled: Boolean(teamleaderToggle?.checked),
    teamleaderAutoSync: isChecked('teamleaderAutoSync'),
    metaEnabled: Boolean(metaToggle?.checked),
    metaAccessToken: getValue('metaAccessToken'),
    metaAdAccountId: getValue('metaAdAccountId'),
    metaTimezone: getValue('metaTimezone'),
    googleSpendMode: getValue('googleSpendMode'),
    googleDeveloperToken: getValue('googleDeveloperToken'),
    googleClientId: getValue('googleClientId'),
    googleClientSecret: getValue('googleClientSecret'),
    googleRefreshToken: getValue('googleRefreshToken'),
    googleCustomerId: getValue('googleCustomerId'),
    googleLoginCustomerId: getValue('googleLoginCustomerId'),
    googleTimezone: getValue('googleTimezone'),
    sheetCsvUrl: getValue('sheetCsvUrl'),
    sheetHeaderRow: getValue('sheetHeaderRow'),
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
  const metaOn = Boolean(metaToggle?.checked);
  const googleMode = getGoogleSpendMode();
  const netlifyOn = Boolean(netlifyToggle?.checked);
  const brandOn = Boolean(brandColorsToggle?.checked);

  const summaryItems = [
    { label: 'Slug', value: getFieldValue('slug') || '-' },
    { label: 'Supabase', value: getFieldValue('supabaseUrl') || '-' },
    { label: 'Location ID', value: getFieldValue('locationId') || '-' },
    { label: 'Dashboard titel', value: getFieldValue('dashboardTitle') || '-' },
    { label: 'Dashboard subtitel', value: getFieldValue('dashboardSubtitle') || '-' },
    { label: 'Logo URL', value: getFieldValue('logoUrl') || '-' },
    { label: 'Dashboards', value: dashboards.length ? dashboards.join(', ') : 'Geen' },
    { label: 'Brand colors', value: brandOn ? 'Aan' : 'Uit' },
    { label: 'Primary kleur', value: brandOn ? getFieldValue('brandPrimaryColor') || '-' : '-' },
    { label: 'Accent kleur', value: brandOn ? getFieldValue('brandSecondaryColor') || '-' : '-' },
    { label: 'GHL token', value: masked(getFieldValue('ghlPrivateIntegrationToken')) },
    { label: 'Stripe payment link', value: masked(getFieldValue('stripePaymentLink')) },
    { label: 'Stripe portal link', value: masked(getFieldValue('stripeBillingPortalUrl')) },
    { label: 'Stripe buy button', value: masked(getFieldValue('stripeBuyButtonId')) },
    { label: 'Stripe checkout embed', value: yesNo(isFieldChecked('stripeCheckoutEmbed')) },
    { label: 'Teamleader', value: teamleaderOn ? 'Aan' : 'Uit' },
    {
      label: 'Teamleader client id',
      value: teamleaderOn ? getFieldValue('teamleaderClientId') || '-' : '-'
    },
    {
      label: 'Teamleader auto sync',
      value: teamleaderOn ? yesNo(isFieldChecked('teamleaderAutoSync')) : '-'
    },
    { label: 'Meta spend', value: metaOn ? 'Aan' : 'Uit' },
    { label: 'Meta token', value: metaOn ? maskedWithHint(getFieldValue('metaAccessToken'), 'metaAccessToken') : '-' },
    { label: 'Meta ad account', value: metaOn ? getFieldValue('metaAdAccountId') || '-' : '-' },
    { label: 'Google spend', value: googleMode === 'api' ? 'Google Ads API' : googleMode === 'sheet' ? 'Google Sheet' : 'Uit' },
    { label: 'Apply config', value: yesNo(isFieldChecked('applyConfig')) },
    { label: 'Base schema', value: yesNo(isFieldChecked('runMigrations')) },
    { label: 'Deploy functions', value: yesNo(isFieldChecked('deployFunctions')) },
    { label: 'Dashboard .env', value: yesNo(isFieldChecked('writeDashboardEnv')) },
    { label: 'Open dashboard', value: yesNo(isFieldChecked('openDashboard')) },
    { label: 'Auto GHL sync', value: yesNo(isFieldChecked('autoGhlSync')) },
    { label: 'Auto Meta sync', value: yesNo(isFieldChecked('autoMetaSync')) },
    { label: 'Auto Google sync', value: yesNo(isFieldChecked('autoGoogleSpendSync')) },
    { label: 'Cron jobs', value: yesNo(isFieldChecked('installCronSchedules')) },
    { label: 'Auto health check', value: yesNo(isFieldChecked('autoHealthCheck')) },
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
      syncSecret: Boolean(data?.syncSecret),
      metaAccessToken: Boolean(data?.metaAccessToken),
      googleDeveloperToken: Boolean(data?.googleDeveloperToken),
      sheetCsvUrl: Boolean(data?.sheetCsvUrl)
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

  if (step === 3 && metaToggle?.checked) {
    const token = form?.querySelector('[name="metaAccessToken"]');
    const account = form?.querySelector('[name="metaAdAccountId"]');
    const hasToken = Boolean(token?.value?.trim());
    const hasAccount = Boolean(account?.value?.trim());
    setInputError(token, !hasToken);
    setInputError(account, !hasAccount);
    if (!hasToken || !hasAccount) {
      setStatus('Meta access token en ad account ID zijn verplicht of zet de toggle uit.', 'error');
      return false;
    }
  }

  if (step === 3) {
    const mode = getGoogleSpendMode();
    if (mode === 'api') {
      const required = [
        { name: 'googleDeveloperToken', label: 'Google developer token' },
        { name: 'googleClientId', label: 'Google client id' },
        { name: 'googleClientSecret', label: 'Google client secret' },
        { name: 'googleRefreshToken', label: 'Google refresh token' },
        { name: 'googleCustomerId', label: 'Google customer id' }
      ];
      let missing = false;
      required.forEach((field) => {
        const input = form?.querySelector(`[name="${field.name}"]`);
        const hasValue = Boolean(input?.value?.trim());
        setInputError(input, !hasValue);
        if (!hasValue) missing = true;
      });
      if (missing) {
        setStatus('Vul de Google Ads API velden in (of kies een andere methode).', 'error');
        return false;
      }
    } else if (mode === 'sheet') {
      const sheetUrl = form?.querySelector('[name="sheetCsvUrl"]');
      const hasUrl = Boolean(sheetUrl?.value?.trim());
      setInputError(sheetUrl, !hasUrl);
      if (!hasUrl) {
        setStatus('Google Sheet CSV URL is verplicht (of kies geen Google kosten sync).', 'error');
        return false;
      }
    }
  }

  if (step === 4) {
    const wantsCron = isFieldChecked('installCronSchedules');
    const wantsHealth = isFieldChecked('autoHealthCheck');
    if (wantsCron || wantsHealth) {
      const serverKeyInput = form?.querySelector('[name="serviceRoleKey"]');
      const hasKey = Boolean(serverKeyInput?.value?.trim()) || Boolean(envHints?.supabaseServiceRoleJwt);
      setInputError(serverKeyInput, !hasKey);
      if (!hasKey) {
        setStatus('Server key is vereist voor cron install/health check (of zet die opties uit).', 'error');
        serverKeyInput?.focus();
        return false;
      }
    }
  }

  return true;
};

const initUi = () => {
  loadBasicState();
  const prefill = applyQueryPrefill();
  setAdvancedMode(Boolean(advancedToggle?.checked));
  setBrandColorsEnabled(Boolean(brandColorsToggle?.checked));
  setTeamleaderEnabled(Boolean(teamleaderToggle?.checked));
  setMetaEnabled(Boolean(metaToggle?.checked));
  setGoogleSpendMode(getGoogleSpendMode());
  setNetlifyEnabled(Boolean(netlifyToggle?.checked));
  setManualKeysVisible(!autoFetchInput?.checked);
  syncAdvancedFromMigrations();
  updateDbPasswordVisibility();
  syncNetlifyProdBranch();
  syncBranchAutomation();
  setTeamleaderAction(false);
  setTeamleaderSyncAction(false);
  setSyncAction(false);
  setMetaSyncAction(false);
  setGoogleSyncAction(false);
  setGoogleSheetSyncAction(false);
  setCronInstallAction(false);
  setHealthCardVisible(false);
  setPreflightStatus('');
  if (preflightContentNode) preflightContentNode.innerHTML = '';
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
  if (prefill?.applied) {
    setStatus(`Velden ingevuld via link (${prefill.fields.join(', ')}).`, 'muted');
  }
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

preflightRunBtn?.addEventListener('click', async () => {
  await runPreflightChecks();
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

brandColorsToggle?.addEventListener('change', () => {
  setBrandColorsEnabled(brandColorsToggle.checked);
  if (currentStep === TOTAL_STEPS) {
    buildSummary();
  }
});

// Keep the overview step in sync while the user tweaks branding colors.
[brandPrimaryColorInput, brandSecondaryColorInput].forEach((input) => {
  if (!input) return;
  input.addEventListener('input', () => {
    if (currentStep === TOTAL_STEPS) {
      buildSummary();
    }
  });
});

teamleaderToggle?.addEventListener('change', () => {
  setTeamleaderEnabled(teamleaderToggle.checked);
  setTeamleaderAction(false);
  setTeamleaderSyncAction(false);
});

metaToggle?.addEventListener('change', () => {
  setMetaEnabled(metaToggle.checked);
  buildSummary();
});

Array.from(form?.querySelectorAll('[name="googleSpendMode"]') ?? []).forEach((input) => {
  input.addEventListener('change', () => {
    setGoogleSpendMode(getGoogleSpendMode());
    buildSummary();
  });
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
  await triggerGhlSync({
    fullSync: false,
    initialWindowDays: 60,
    statusText: 'Sync gestart (laatste 60 dagen)...'
  });
});

metaSyncNowBtn?.addEventListener('click', async () => {
  await triggerMetaSync();
});

googleSyncNowBtn?.addEventListener('click', async () => {
  await triggerGoogleSync();
});

googleSheetSyncNowBtn?.addEventListener('click', async () => {
  await triggerGoogleSheetSync();
});

cronInstallNowBtn?.addEventListener('click', async () => {
  await triggerCronInstall();
});

healthRunBtn?.addEventListener('click', async () => {
  await triggerHealthCheck();
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
    const showMeta = result.ok && Boolean(metaToggle?.checked);
    const googleMode = getGoogleSpendMode();
    setMetaSyncAction(showMeta);
    setGoogleSyncAction(result.ok && googleMode === 'api');
    setGoogleSheetSyncAction(result.ok && googleMode === 'sheet');
    setCronInstallAction(result.ok);
    setHealthCardVisible(result.ok);

    const shouldAutoSync = showTeamleader && isFieldChecked('teamleaderAutoSync');
    if (shouldAutoSync) {
      startTeamleaderAutopilot();
    }

    const shouldAutoGhlSync = result.ok && isFieldChecked('autoGhlSync');
    if (shouldAutoGhlSync) {
      await triggerGhlSync({
        fullSync: false,
        initialWindowDays: 60,
        statusText: 'Auto sync gestart (laatste 60 dagen)...'
      });
    }

    const shouldAutoMetaSync = showMeta && isFieldChecked('autoMetaSync');
    if (shouldAutoMetaSync) {
      await triggerMetaSync();
    }

    const shouldAutoGoogleSpendSync = result.ok && isFieldChecked('autoGoogleSpendSync');
    if (shouldAutoGoogleSpendSync) {
      if (googleMode === 'api') {
        await triggerGoogleSync();
      } else if (googleMode === 'sheet') {
        await triggerGoogleSheetSync();
      }
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

    const shouldAutoCronInstall = result.ok && isFieldChecked('installCronSchedules');
    if (shouldAutoCronInstall) {
      await triggerCronInstall();
    }

    const shouldAutoHealthCheck = result.ok && isFieldChecked('autoHealthCheck');
    if (shouldAutoHealthCheck) {
      await triggerHealthCheck();
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
