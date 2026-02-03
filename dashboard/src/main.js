import './styles.css';
import { createClient } from '@supabase/supabase-js';

const icon = (paths, className, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}" ${extra}>${paths}</svg>`;

const icons = {
  dashboard: (className) =>
    icon(
      '<rect width="7" height="9" x="3" y="3" rx="1"></rect><rect width="7" height="5" x="14" y="3" rx="1"></rect><rect width="7" height="9" x="14" y="12" rx="1"></rect><rect width="7" height="5" x="3" y="16" rx="1"></rect>',
      className
    ),
  target: (className) =>
    icon(
      '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
      className
    ),
  headphones: (className) =>
    icon(
      '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path>',
      className
    ),
  chevronLeft: (className) => icon('<path d="m15 18-6-6 6-6"></path>', className),
  menu: (className) =>
    icon('<line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line>', className),
  refresh: (className) =>
    icon(
      '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>',
      className
    ),
  calendar: (className) =>
    icon(
      '<path d="M8 2v4"></path><path d="M16 2v4"></path><rect width="18" height="18" x="3" y="4" rx="2"></rect><path d="M3 10h18"></path>',
      className
    ),
  users: (className) =>
    icon(
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      className
    ),
  info: (className) =>
    icon('<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>', className),
  circleX: (className) =>
    icon('<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>', className),
  clock: (className) =>
    icon('<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>', className),
  chartColumn: (className) =>
    icon('<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>', className),
  dollar: (className) =>
    icon('<line x1="12" x2="12" y1="2" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>', className),
  trendingUp: (className) =>
    icon('<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline>', className),
  check: (className) =>
    icon('<path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path>', className),
  percent: (className) =>
    icon('<line x1="19" x2="5" y1="5" y2="19"></line><circle cx="6.5" cy="6.5" r="2.5"></circle><circle cx="17.5" cy="17.5" r="2.5"></circle>', className),
  trophy: (className) =>
    icon('<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>', className),
  thumbsDown: (className) =>
    icon('<path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path>', className),
  zap: (className) =>
    icon('<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>', className),
  star: (className) =>
    icon('<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"></path>', className),
  trendingDown: (className) =>
    icon('<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline>', className),
  triangleAlert: (className) =>
    icon('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>', className),
  award: (className) =>
    icon('<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"></path><circle cx="12" cy="8" r="6"></circle>', className)
};

const navLinks = [
  { label: 'Leadgeneratie', href: '/', icon: icons.dashboard('lucide lucide-layout-dashboard w-5 h-5 flex-shrink-0'), active: true },
];

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ghlLocationId = import.meta.env.VITE_GHL_LOCATION_ID;
const adminModeEnabled = import.meta.env.VITE_ADMIN_MODE === 'true';
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;
const adminEndpoint = supabaseUrl ? `${supabaseUrl}/functions/v1/ghl-admin` : '';

const formatIsoDate = (date) => date.toISOString().slice(0, 10);
const getDefaultRange = () => {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start: formatIsoDate(start), end: formatIsoDate(end) };
};

const DEFAULT_RANGE = getDefaultRange();

const SOURCE_ORDER = ['META', 'Google Ads', 'Makelaar vergelijker', 'Immoweb'];
const HOOK_ORDER = ['Bereken mijn woningwaarde', 'Gratis schatting', '5 verkooptips', 'Lokale makelaar vs grote groep?'];

const LOST_REASON_RATIOS = [
  { label: 'Wilt zelf verkopen', ratio: 0.28, color: 'rgb(20, 184, 165)' },
  { label: 'Niet geinteresseerd na gesprek', ratio: 0.23, color: 'rgb(22, 162, 73)' },
  { label: 'Concurrent gekozen', ratio: 0.16, color: 'rgb(245, 159, 10)' },
  { label: 'Timing niet goed', ratio: 0.15, color: 'rgb(153, 51, 204)' },
  { label: 'Geen reactie na follow-up', ratio: 0.11, color: 'rgb(26, 162, 230)' },
  { label: 'Overig', ratio: 0.07, color: 'rgb(217, 38, 38)' }
];
const LOST_REASON_COLORS = LOST_REASON_RATIOS.map((reason) => reason.color);

const DRILLDOWN_LABELS = {
  leads: 'Leads (opportunities)',
  appointments: 'Afspraken',
  appointments_without_lead_in_range: 'Afspraken zonder lead in periode',
  appointments_cancelled: 'Cancelled afspraken',
  appointments_confirmed: 'Confirmed afspraken',
  appointments_no_show: 'No-show afspraken',
  deals: 'Deals',
  hook_leads: 'Leads',
  hook_appointments: 'Afspraken',
  lost_reason_leads: 'Verloren leads'
};

const DEFAULT_BOUNDS = { min: '2018-01-01', max: '2035-12-31' };

const mockEntries = [
  { date: '2026-10-05', source: 'META', hook: 'Bereken mijn woningwaarde', leads: 100, appointments: 39, cancelled: 4, rescheduled: 3, noShow: 2, deals: 9, costPerLead: 12.8, dealValue: 340 },
  { date: '2026-10-10', source: 'Google Ads', hook: 'Gratis schatting', leads: 80, appointments: 29, cancelled: 3, rescheduled: 2, noShow: 1, deals: 7, costPerLead: 15.2, dealValue: 320 },
  { date: '2026-10-16', source: 'Makelaar vergelijker', hook: '5 verkooptips', leads: 70, appointments: 25, cancelled: 2, rescheduled: 2, noShow: 1, deals: 5, costPerLead: 14.5, dealValue: 330 },
  { date: '2026-10-24', source: 'Immoweb', hook: 'Lokale makelaar vs grote groep?', leads: 50, appointments: 19, cancelled: 2, rescheduled: 1, noShow: 1, deals: 4, costPerLead: 16.5, dealValue: 350 },
  { date: '2026-11-04', source: 'META', hook: 'Bereken mijn woningwaarde', leads: 95, appointments: 36, cancelled: 4, rescheduled: 3, noShow: 2, deals: 8, costPerLead: 12.8, dealValue: 340 },
  { date: '2026-11-12', source: 'Google Ads', hook: 'Gratis schatting', leads: 70, appointments: 26, cancelled: 3, rescheduled: 2, noShow: 1, deals: 6, costPerLead: 15.2, dealValue: 320 },
  { date: '2026-11-18', source: 'Makelaar vergelijker', hook: '5 verkooptips', leads: 65, appointments: 23, cancelled: 2, rescheduled: 2, noShow: 1, deals: 5, costPerLead: 14.5, dealValue: 330 },
  { date: '2026-11-26', source: 'Immoweb', hook: 'Lokale makelaar vs grote groep?', leads: 50, appointments: 18, cancelled: 2, rescheduled: 1, noShow: 0, deals: 4, costPerLead: 16.5, dealValue: 350 },
  { date: '2026-12-03', source: 'META', hook: 'Bereken mijn woningwaarde', leads: 90, appointments: 34, cancelled: 3, rescheduled: 3, noShow: 2, deals: 7, costPerLead: 12.8, dealValue: 340 },
  { date: '2026-12-11', source: 'Google Ads', hook: 'Gratis schatting', leads: 65, appointments: 23, cancelled: 2, rescheduled: 2, noShow: 1, deals: 5, costPerLead: 15.2, dealValue: 320 },
  { date: '2026-12-17', source: 'Makelaar vergelijker', hook: '5 verkooptips', leads: 55, appointments: 19, cancelled: 2, rescheduled: 1, noShow: 1, deals: 4, costPerLead: 14.5, dealValue: 330 },
  { date: '2026-12-28', source: 'Immoweb', hook: 'Lokale makelaar vs grote groep?', leads: 57, appointments: 21, cancelled: 2, rescheduled: 2, noShow: 1, deals: 5, costPerLead: 16.5, dealValue: 350 }
];

const dataBounds = mockEntries.reduce(
  (acc, entry) => {
    if (entry.date < acc.min) acc.min = entry.date;
    if (entry.date > acc.max) acc.max = entry.date;
    return acc;
  },
  { ...DEFAULT_BOUNDS }
);

const monthBounds = {
  min: dataBounds.min.slice(0, 7),
  max: dataBounds.max.slice(0, 7)
};

let dateRange = { ...DEFAULT_RANGE };
let pickerState = { open: false, selecting: 'start', viewMonth: DEFAULT_RANGE.start.slice(0, 7) };

const mockBadge = '<span class="mock-badge">Mock data</span>';
const DEBUG_ENABLED = false;

const liveState = {
  opportunities: {
    status: 'idle',
    count: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  appointments: {
    status: 'idle',
    counts: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  sourceBreakdown: {
    status: 'idle',
    rows: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  hookPerformance: {
    status: 'idle',
    rows: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  lostReasons: {
    status: 'idle',
    rows: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  finance: {
    status: 'idle',
    totals: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  spendBySource: {
    status: 'idle',
    totals: null,
    rangeKey: '',
    errorMessage: '',
    inFlight: false
  },
  sync: {
    status: 'idle',
    timestamp: null,
    errorMessage: '',
    inFlight: false
  }
};

let renderQueued = false;
const scheduleRender = () => {
  if (renderQueued) return;
  renderQueued = true;
  queueMicrotask(() => {
    renderQueued = false;
    renderApp();
  });
};

const configState = {
  status: ghlLocationId ? 'ready' : 'idle',
  locationId: ghlLocationId || null,
  source: ghlLocationId ? 'env' : null,
  hookFieldId: null,
  campaignFieldId: null,
  lostReasonFieldId: null,
  errorMessage: ''
};

const adminState = {
  open: false,
  status: 'idle',
  message: '',
  auth: {
    email: '',
    status: 'idle',
    message: ''
  },
  loading: false,
  form: {
    locationId: ghlLocationId || '',
    token: '',
    active: true
  },
  mapping: {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    campaigns: [],
    adsets: [],
    googleCampaigns: [],
    google: null,
    sourceOptions: [],
    hasChanges: false
  }
};

const resetMappingState = () => {
  adminState.mapping = {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    campaigns: [],
    adsets: [],
    googleCampaigns: [],
    google: null,
    sourceOptions: [],
    hasChanges: false
  };
};

const drilldownState = {
  open: false,
  status: 'idle',
  title: '',
  kind: '',
  source: null,
  rows: [],
  errorMessage: '',
  range: null
};

let authSession = null;

const initAuth = async () => {
  if (!supabase || !adminModeEnabled) return;
  const { data } = await supabase.auth.getSession();
  authSession = data.session;
  renderApp();

  supabase.auth.onAuthStateChange((_event, session) => {
    authSession = session;
    if (!session) {
      adminState.form.token = '';
      adminState.message = '';
      adminState.status = 'idle';
      adminState.auth.status = 'idle';
      adminState.auth.message = '';
      resetMappingState();
    } else if (adminState.open) {
      loadAdminIntegration();
      loadSpendMapping();
    }
    renderApp();
  });
};

const getAuthToken = async () => {
  if (!supabase) return null;
  if (authSession?.access_token) return authSession.access_token;
  const { data } = await supabase.auth.getSession();
  authSession = data.session;
  return authSession?.access_token ?? null;
};

const loadLocationConfig = async () => {
  if (!supabase) return;
  if (configState.status === 'loading') return;

  const prevHookFieldId = configState.hookFieldId;
  const prevCampaignFieldId = configState.campaignFieldId;
  const prevLostReasonFieldId = configState.lostReasonFieldId;

  configState.status = 'loading';
  configState.errorMessage = '';

  const { data, error } = await supabase
    .from('dashboard_config')
    .select('location_id, hook_field_id, campaign_field_id, lost_reason_field_id, updated_at')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    if (!configState.locationId) {
      configState.status = 'error';
      configState.errorMessage = error.message;
    } else {
      configState.status = 'ready';
      configState.errorMessage = '';
    }
    scheduleRender();
    return;
  }

  if (!data?.location_id && !configState.locationId) {
    configState.status = 'error';
    configState.errorMessage = 'Location ID ontbreekt in dashboard_config.';
    scheduleRender();
    return;
  }

  if (!configState.locationId && data?.location_id) {
    configState.locationId = data.location_id;
    configState.source = 'supabase';
  }
  if (configState.locationId && !configState.source) {
    configState.source = 'env';
  }
  configState.hookFieldId = data?.hook_field_id || null;
  configState.campaignFieldId = data?.campaign_field_id || null;
  configState.lostReasonFieldId = data?.lost_reason_field_id || null;

  const hookChanged =
    prevHookFieldId !== configState.hookFieldId || prevCampaignFieldId !== configState.campaignFieldId;
  const lostChanged = prevLostReasonFieldId !== configState.lostReasonFieldId;

  if (hookChanged) {
    liveState.hookPerformance = {
      status: 'idle',
      rows: null,
      rangeKey: '',
      errorMessage: '',
      inFlight: false
    };
  }

  if (lostChanged) {
    liveState.lostReasons = {
      status: 'idle',
      rows: null,
      rangeKey: '',
      errorMessage: '',
      inFlight: false
    };
  }

  configState.status = 'ready';
  configState.errorMessage = '';
  scheduleRender();
};

const loadAdminIntegration = async () => {
  if (!supabase || !adminEndpoint) return;
  const token = await getAuthToken();
  if (!token) {
    adminState.status = 'error';
    adminState.message = 'Log eerst in om de integratie te laden.';
    renderApp();
    return;
  }

  adminState.loading = true;
  renderApp();

  try {
    const response = await fetch(adminEndpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseKey
      }
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || 'Onbekende fout');
    }

    if (result?.location_id) {
      adminState.form.locationId = result.location_id;
    }
    if (typeof result?.active === 'boolean') {
      adminState.form.active = result.active;
    }

    adminState.form.token = '';
    adminState.status = 'idle';
    adminState.message = '';
  } catch (error) {
    adminState.status = 'error';
    adminState.message = error instanceof Error ? error.message : 'Onbekende fout';
  } finally {
    adminState.loading = false;
    renderApp();
  }
};

const loadSpendMapping = async () => {
  if (!supabase || !adminModeEnabled) return;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    adminState.mapping.status = 'error';
    adminState.mapping.message = 'Location ID ontbreekt.';
    renderApp();
    return;
  }
  if (adminState.mapping.loading) return;

  adminState.mapping.loading = true;
  adminState.mapping.status = 'loading';
  adminState.mapping.message = '';
  adminState.mapping.hasChanges = false;
  renderApp();

  const mappingRange = buildRecentRange(90);
  const startDate = mappingRange.start;
  const endDate = toDateEndExclusive(mappingRange.end);

  try {
    const [mappingResult, adsetResult] = await Promise.all([
      withTimeout(
        supabase
          .from('marketing_spend_source_mapping')
          .select('id, platform, campaign_id, campaign_name, adset_id, adset_name, source_label, updated_at')
          .eq('location_id', activeLocationId)
          .order('updated_at', { ascending: false }),
        12000,
        'Supabase query timeout (marketing spend mapping).'
      ),
      withTimeout(
        supabase
          .from('marketing_spend_adset_daily')
          .select('campaign_id, campaign_name, adset_id, adset_name')
          .eq('location_id', activeLocationId)
          .eq('source', 'META')
          .gte('date', startDate)
          .lt('date', endDate),
        12000,
        'Supabase query timeout (marketing spend adset list).'
      )
    ]);

    if (mappingResult.error) throw mappingResult.error;
    if (adsetResult.error) throw adsetResult.error;

    const mappingRows = mappingResult.data ?? [];
    const mappingByKey = new Map();
    mappingRows.forEach((row) => {
      const platform = normalizeMappingPlatform(row?.platform);
      const key = buildMappingKey(platform, row?.campaign_id, row?.adset_id);
      if (!mappingByKey.has(key)) {
        mappingByKey.set(key, row);
      }
    });

    const campaignMap = new Map();
    const adsetMap = new Map();
    (adsetResult.data ?? []).forEach((row) => {
      if (row?.campaign_id && !campaignMap.has(row.campaign_id)) {
        campaignMap.set(row.campaign_id, {
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name ?? ''
        });
      }
      if (row?.adset_id && !adsetMap.has(row.adset_id)) {
        adsetMap.set(row.adset_id, {
          campaign_id: row.campaign_id ?? '',
          campaign_name: row.campaign_name ?? '',
          adset_id: row.adset_id,
          adset_name: row.adset_name ?? ''
        });
      }
    });

    let googleCampaignRows = [];
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('marketing_spend_campaign_daily')
          .select('campaign_id, campaign_name')
          .eq('location_id', activeLocationId)
          .gte('date', startDate)
          .lt('date', endDate),
        12000,
        'Supabase query timeout (marketing spend google campaign list).'
      );
      if (error) throw error;
      googleCampaignRows = data ?? [];
    } catch (_error) {
      googleCampaignRows = [];
    }

    const googleCampaignMap = new Map();
    (googleCampaignRows ?? []).forEach((row) => {
      if (row?.campaign_id && !googleCampaignMap.has(row.campaign_id)) {
        googleCampaignMap.set(row.campaign_id, {
          campaign_id: row.campaign_id,
          campaign_name: row.campaign_name ?? row.campaign_id
        });
      }
    });

    const campaigns = Array.from(campaignMap.values()).map((row) => {
      const mapping = mappingByKey.get(buildMappingKey(MAPPING_PLATFORMS.meta, row.campaign_id, null));
      return {
        key: buildMappingKey(MAPPING_PLATFORMS.meta, row.campaign_id, null),
        id: mapping?.id ?? null,
        platform: MAPPING_PLATFORMS.meta,
        scope: 'campaign',
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name ?? row.campaign_id,
        source_label: mapping?.source_label ?? ''
      };
    });
    campaigns.sort((a, b) => (a.campaign_name || '').localeCompare(b.campaign_name || ''));

    const adsets = Array.from(adsetMap.values()).map((row) => {
      const mapping = mappingByKey.get(buildMappingKey(MAPPING_PLATFORMS.meta, null, row.adset_id));
      const lang = classifyMetaAdset(row.adset_name);
      const defaultLabel = META_SOURCE_BY_LANG[lang] || META_SOURCE_BY_LANG.nl;
      return {
        key: buildMappingKey(MAPPING_PLATFORMS.meta, null, row.adset_id),
        id: mapping?.id ?? null,
        platform: MAPPING_PLATFORMS.meta,
        scope: 'adset',
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name ?? row.campaign_id ?? '',
        adset_id: row.adset_id,
        adset_name: row.adset_name ?? row.adset_id,
        default_label: defaultLabel,
        source_label: mapping?.source_label ?? ''
      };
    });
    adsets.sort((a, b) => (a.adset_name || '').localeCompare(b.adset_name || ''));

    const googleCampaigns = Array.from(googleCampaignMap.values()).map((row) => {
      const mapping = mappingByKey.get(buildMappingKey(MAPPING_PLATFORMS.google, row.campaign_id, null));
      return {
        key: buildMappingKey(MAPPING_PLATFORMS.google, row.campaign_id, null),
        id: mapping?.id ?? null,
        platform: MAPPING_PLATFORMS.google,
        scope: 'campaign',
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name ?? row.campaign_id,
        source_label: mapping?.source_label ?? ''
      };
    });
    googleCampaigns.sort((a, b) => (a.campaign_name || '').localeCompare(b.campaign_name || ''));

    const googleMapping = mappingByKey.get(buildMappingKey(MAPPING_PLATFORMS.google, null, null));
    const googleRow = {
      key: buildMappingKey(MAPPING_PLATFORMS.google, null, null),
      id: googleMapping?.id ?? null,
      platform: MAPPING_PLATFORMS.google,
      scope: 'default',
      source_label: googleMapping?.source_label ?? ''
    };

    let sourceOptions = buildSourceOptions(liveState.sourceBreakdown.rows);
    if (sourceOptions.length === 0) {
      try {
        const rows = await fetchSourceBreakdown(dateRange);
        sourceOptions = buildSourceOptions(rows);
      } catch (error) {
        sourceOptions = buildSourceOptions([]);
      }
    }

    mappingRows.forEach((row) => {
      if (row?.source_label) sourceOptions.push(row.source_label);
    });

    const uniqueOptions = Array.from(new Set(sourceOptions)).sort((a, b) => a.localeCompare(b));

    adminState.mapping = {
      status: 'ready',
      message: '',
      loading: false,
      saving: false,
      campaigns,
      adsets,
      googleCampaigns,
      google: googleRow,
      sourceOptions: uniqueOptions,
      hasChanges: false
    };
  } catch (error) {
    adminState.mapping.status = 'error';
    adminState.mapping.message = error instanceof Error ? error.message : 'Onbekende fout';
  } finally {
    adminState.mapping.loading = false;
    renderApp();
  }
};

const setMappingValue = (key, value) => {
  if (!key) return;
  const label = value ?? '';
  adminState.mapping.campaigns = adminState.mapping.campaigns.map((row) =>
    row.key === key ? { ...row, source_label: label } : row
  );
  adminState.mapping.adsets = adminState.mapping.adsets.map((row) =>
    row.key === key ? { ...row, source_label: label } : row
  );
  adminState.mapping.googleCampaigns = adminState.mapping.googleCampaigns.map((row) =>
    row.key === key ? { ...row, source_label: label } : row
  );
  if (adminState.mapping.google?.key === key) {
    adminState.mapping.google = { ...adminState.mapping.google, source_label: label };
  }
  adminState.mapping.hasChanges = true;
  if (adminState.mapping.message) {
    adminState.mapping.message = '';
    if (adminState.mapping.status === 'success') {
      adminState.mapping.status = 'ready';
    }
  }
};

const saveSpendMapping = async () => {
  if (!supabase || !adminModeEnabled) return;
  if (adminState.mapping.saving) return;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    adminState.mapping.status = 'error';
    adminState.mapping.message = 'Location ID ontbreekt.';
    renderApp();
    return;
  }

  const token = await getAuthToken();
  if (!token) {
    adminState.mapping.status = 'error';
    adminState.mapping.message = 'Log in om mapping op te slaan.';
    renderApp();
    return;
  }

  adminState.mapping.saving = true;
  adminState.mapping.status = 'saving';
  adminState.mapping.message = '';
  renderApp();

  const now = new Date().toISOString();
  const upserts = [];
  const deletes = [];

  const collectRow = (row) => {
    if (!row) return;
    const label = normalizeSourceLabel(row.source_label);
    if (label) {
      const payload = {
        location_id: activeLocationId,
        platform: row.platform,
        campaign_id: row.campaign_id ?? null,
        campaign_name: row.campaign_name ?? null,
        adset_id: row.adset_id ?? null,
        adset_name: row.adset_name ?? null,
        source_label: label,
        updated_at: now
      };
      if (row.id) {
        payload.id = row.id;
      }
      upserts.push(payload);
    } else if (row.id) {
      deletes.push(row.id);
    }
  };

  adminState.mapping.campaigns.forEach(collectRow);
  adminState.mapping.adsets.forEach(collectRow);
  adminState.mapping.googleCampaigns.forEach(collectRow);
  collectRow(adminState.mapping.google);

  try {
    if (deletes.length) {
      const { error } = await supabase
        .from('marketing_spend_source_mapping')
        .delete()
        .in('id', deletes);
      if (error) throw error;
    }

    if (upserts.length) {
      const { error } = await supabase
        .from('marketing_spend_source_mapping')
        .upsert(upserts, { onConflict: 'id' });
      if (error) throw error;
    }

    await loadSpendMapping();
    adminState.mapping.status = 'success';
    adminState.mapping.message = 'Mapping opgeslagen.';
    adminState.mapping.hasChanges = false;
    liveState.spendBySource = {
      status: 'idle',
      totals: null,
      rangeKey: '',
      errorMessage: '',
      inFlight: false
    };
    ensureSpendBySource(dateRange);
  } catch (error) {
    adminState.mapping.status = 'error';
    adminState.mapping.message = error instanceof Error ? error.message : 'Onbekende fout';
  } finally {
    adminState.mapping.saving = false;
    renderApp();
  }
};

const formatNumber = (value, decimals = 0) => {
  if (!Number.isFinite(value)) return '0';
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.length === 2 ? `${integer}.${parts[1]}` : integer;
};

const formatCurrency = (value, decimals = 2) => `EUR ${formatNumber(value, decimals)}`;
const formatOptionalCurrency = (value, decimals = 2, suffix = '') =>
  Number.isFinite(value) ? `${formatCurrency(value, decimals)}${suffix}` : '--';
const formatPercent = (value, decimals = 1) => `${formatNumber(value * 100, decimals)}%`;
const safeDivide = (numerator, denominator) => (denominator ? numerator / denominator : 0);
const META_SOURCE_BY_LANG = {
  nl: 'Meta - Calculator',
  fr: 'Meta - FR Calculator'
};
const GOOGLE_SPEND_SOURCE = 'Google Ads';
const GOOGLE_SOURCE_LABEL = 'Google - woning prijsberekening';

const hasLangToken = (label, token) => {
  const pattern = new RegExp(`(^|[^a-z])${token}([^a-z]|$)`, 'i');
  return pattern.test(label);
};
const classifyMetaAdset = (value) => {
  if (!value) return 'nl';
  const label = String(value).trim().toLowerCase();
  if (!label) return 'nl';

  const frSignals = ['fr', 'french', 'francais', 'francaise', 'wallonie', 'wallonia'];
  const hasFrSignal = (token) =>
    hasLangToken(label, token) || (token.length > 2 && label.includes(token));
  if (frSignals.some(hasFrSignal)) return 'fr';

  // Default to NL when no FR signal is found (NL adsets often omit "NL").
  return 'nl';
};
const applySourceSpendToSourceRows = (rows, spendBySource) => {
  if (!Array.isArray(rows)) return rows;

  return rows.map((row) => {
    const spend = Number(spendBySource?.[row.source] ?? 0);
    const confirmed = Number(row.rawConfirmedAppointments ?? row.rawAppointments ?? 0);
    if (spend <= 0 || confirmed <= 0) return { ...row, cost: '--' };
    const costPerAppointment = spend / confirmed;
    return { ...row, cost: formatOptionalCurrency(costPerAppointment, 2) };
  });
};
const MAPPING_PLATFORMS = {
  meta: 'meta',
  google: 'google'
};
const normalizeMappingPlatform = (value) => String(value ?? '').trim().toLowerCase();
const normalizeSourceLabel = (value) => String(value ?? '').trim();
const buildMappingKey = (platform, campaignId, adsetId) => {
  const normalized = normalizeMappingPlatform(platform);
  if (normalized === MAPPING_PLATFORMS.google) {
    if (campaignId) return `google:campaign:${campaignId}`;
    return 'google:default';
  }
  if (adsetId) return `${normalized}:adset:${adsetId}`;
  if (campaignId) return `${normalized}:campaign:${campaignId}`;
  return `${normalized}:default`;
};
const buildRecentRange = (days = 60) => {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(days - 1, 0));
  return { start: formatIsoDate(start), end: formatIsoDate(end) };
};
const buildSourceOptions = (rows) => {
  const options = new Set();
  (rows ?? []).forEach((row) => {
    if (row?.source) options.add(row.source);
  });
  options.add(META_SOURCE_BY_LANG.nl);
  options.add(META_SOURCE_BY_LANG.fr);
  options.add(GOOGLE_SOURCE_LABEL);
  return Array.from(options).sort((a, b) => a.localeCompare(b));
};
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const buildRangeKey = (range) => `${range.start}|${range.end}`;
const toUtcStart = (dateValue) => new Date(`${dateValue}T00:00:00Z`).toISOString();
const toUtcEndExclusive = (dateValue) => {
  const dt = new Date(`${dateValue}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString();
};
const toDateEndExclusive = (dateValue) => toUtcEndExclusive(dateValue).slice(0, 10);
const withTimeout = (promise, ms, message) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });

const normalizeRange = (start, end) => {
  let normalizedStart = start || dateRange.start || DEFAULT_RANGE.start;
  let normalizedEnd = end || dateRange.end || DEFAULT_RANGE.end;

  if (normalizedStart < dataBounds.min) normalizedStart = dataBounds.min;
  if (normalizedEnd > dataBounds.max) normalizedEnd = dataBounds.max;

  if (normalizedStart > normalizedEnd) {
    return { start: normalizedEnd, end: normalizedStart };
  }

  return { start: normalizedStart, end: normalizedEnd };
};

const isInRange = (dateValue, range) => dateValue >= range.start && dateValue <= range.end;

const APPOINTMENT_STATUS_FILTERS = {
  cancelled: ['cancel'],
  confirmed: ['confirm'],
  noShow: ['no show', 'no-show', 'noshow']
};

const applyStatusFilter = (query, patterns) => {
  if (!patterns?.length) return query;
  const filter = patterns.map((pattern) => `appointment_status.ilike.%${pattern}%`).join(',');
  return query.or(filter);
};

const fetchOpportunityCount = async (range) => {
  if (!supabase) return null;

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  let query = supabase
    .from('opportunities')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', startIso)
    .lt('created_at', endIso);

  query = query.eq('location_id', activeLocationId);

  const { count, error } = await withTimeout(
    query,
    12000,
    'Supabase query timeout. Voeg index toe of check netwerk/RLS.'
  );

  if (error) {
    throw error;
  }

  return count ?? 0;
};

const fetchAppointmentCounts = async (range) => {
  if (!supabase) return null;

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const buildQuery = (patterns) => {
    let query = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', startIso)
      .lt('start_time', endIso)
      .eq('location_id', activeLocationId);
    query = applyStatusFilter(query, patterns);
    return query;
  };

  const [totalResult, cancelledResult, confirmedResult, noShowResult] = await Promise.all([
    withTimeout(buildQuery(), 12000, 'Supabase query timeout (appointments total).'),
    withTimeout(buildQuery(APPOINTMENT_STATUS_FILTERS.cancelled), 12000, 'Supabase query timeout (cancelled).'),
    withTimeout(buildQuery(APPOINTMENT_STATUS_FILTERS.confirmed), 12000, 'Supabase query timeout (confirmed).'),
    withTimeout(buildQuery(APPOINTMENT_STATUS_FILTERS.noShow), 12000, 'Supabase query timeout (no-show).')
  ]);

  return {
    total: totalResult?.count ?? 0,
    cancelled: cancelledResult?.count ?? 0,
    confirmed: confirmedResult?.count ?? 0,
    noShow: noShowResult?.count ?? 0
  };
};

const fetchLatestSyncTimestamp = async () => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) return null;

  const query = supabase
    .from('sync_state')
    .select('updated_at')
    .eq('location_id', activeLocationId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await withTimeout(query, 12000, 'Supabase query timeout (sync).');
  if (error) throw error;
  return data?.updated_at ?? null;
};

const fetchSourceBreakdown = async (range) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  const { data, error } = await withTimeout(
    supabase.rpc('get_source_breakdown', {
      p_location_id: activeLocationId,
      p_start: startIso,
      p_end: endIso
    }),
    12000,
    'Supabase query timeout (source breakdown).'
  );

  if (error) throw error;
  return data ?? [];
};

const fetchHookPerformance = async (range) => {
  if (!supabase) return null;
  if (!configState.hookFieldId && !configState.campaignFieldId) return [];
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  const { data, error } = await withTimeout(
    supabase.rpc('get_hook_performance', {
      p_location_id: activeLocationId,
      p_start: startIso,
      p_end: endIso
    }),
    12000,
    'Supabase query timeout (hook performance).'
  );

  if (error) throw error;
  return data ?? [];
};

const fetchLostReasons = async (range) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  const { data, error } = await withTimeout(
    supabase.rpc('get_lost_reasons', {
      p_location_id: activeLocationId,
      p_start: startIso,
      p_end: endIso
    }),
    12000,
    'Supabase query timeout (lost reasons).'
  );

  if (error) throw error;
  return data ?? [];
};

const fetchFinanceSummary = async (range) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  const { data, error } = await withTimeout(
    supabase.rpc('get_finance_summary', {
      p_location_id: activeLocationId,
      p_start: startIso,
      p_end: endIso
    }),
    12000,
    'Supabase query timeout (finance summary).'
  );

  if (error) throw error;
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
};

const fetchSpendBySource = async (range) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startDate = range.start;
  const endDate = toDateEndExclusive(range.end);

  const totals = {};

  const { data: mappingRows, error: mappingError } = await withTimeout(
    supabase
      .from('marketing_spend_source_mapping')
      .select('platform, campaign_id, adset_id, source_label, updated_at')
      .eq('location_id', activeLocationId)
      .order('updated_at', { ascending: false }),
    12000,
    'Supabase query timeout (marketing spend mapping).'
  );
  if (mappingError) throw mappingError;

  const metaAdsetMap = new Map();
  const metaCampaignMap = new Map();
  const googleCampaignMap = new Map();
  let googleLabel = '';

  (mappingRows ?? []).forEach((row) => {
    const platform = normalizeMappingPlatform(row?.platform);
    const label = normalizeSourceLabel(row?.source_label);
    if (!label) return;

    if (platform === MAPPING_PLATFORMS.meta) {
      if (row?.adset_id) {
        if (!metaAdsetMap.has(row.adset_id)) metaAdsetMap.set(row.adset_id, label);
      } else if (row?.campaign_id) {
        if (!metaCampaignMap.has(row.campaign_id)) metaCampaignMap.set(row.campaign_id, label);
      }
    }

    if (platform === MAPPING_PLATFORMS.google) {
      if (row?.campaign_id) {
        if (!googleCampaignMap.has(row.campaign_id)) googleCampaignMap.set(row.campaign_id, label);
      } else if (!googleLabel) {
        googleLabel = label;
      }
    }
  });

  const addSpend = (label, amount) => {
    const key = normalizeSourceLabel(label);
    if (!key) return;
    totals[key] = (totals[key] ?? 0) + amount;
  };

  const { data: adsetRows, error: adsetError } = await withTimeout(
    supabase
      .from('marketing_spend_adset_daily')
      .select('adset_id, adset_name, campaign_id, spend')
      .eq('location_id', activeLocationId)
      .eq('source', 'META')
      .gte('date', startDate)
      .lt('date', endDate),
    12000,
    'Supabase query timeout (marketing spend adset).'
  );
  if (adsetError) throw adsetError;

  (adsetRows ?? []).forEach((row) => {
    const mappedLabel =
      (row?.adset_id && metaAdsetMap.get(row.adset_id)) ||
      (row?.campaign_id && metaCampaignMap.get(row.campaign_id));
    const lang = mappedLabel ? null : classifyMetaAdset(row?.adset_name);
    const fallbackLabel = META_SOURCE_BY_LANG[lang] || META_SOURCE_BY_LANG.nl;
    addSpend(mappedLabel || fallbackLabel, Number(row?.spend ?? 0));
  });

  let usedGoogleCampaigns = false;
  try {
    const { data: googleCampaignRows, error: googleCampaignError } = await withTimeout(
      supabase
        .from('marketing_spend_campaign_daily')
        .select('campaign_id, spend')
        .eq('location_id', activeLocationId)
        .gte('date', startDate)
        .lt('date', endDate),
      12000,
      'Supabase query timeout (marketing spend google campaigns).'
    );
    if (googleCampaignError) throw googleCampaignError;

    (googleCampaignRows ?? []).forEach((row) => {
      usedGoogleCampaigns = true;
      const mappedLabel = row?.campaign_id ? googleCampaignMap.get(row.campaign_id) : '';
      addSpend(mappedLabel || googleLabel || GOOGLE_SOURCE_LABEL, Number(row?.spend ?? 0));
    });
  } catch (_error) {
    usedGoogleCampaigns = false;
  }

  if (!usedGoogleCampaigns) {
    const { data: googleRows, error: googleError } = await withTimeout(
      supabase
        .from('marketing_spend_daily')
        .select('spend')
        .eq('location_id', activeLocationId)
        .eq('source', GOOGLE_SPEND_SOURCE)
        .gte('date', startDate)
        .lt('date', endDate),
      12000,
      'Supabase query timeout (marketing spend google).'
    );
    if (googleError) throw googleError;

    (googleRows ?? []).forEach((row) => {
      addSpend(googleLabel || GOOGLE_SOURCE_LABEL, Number(row?.spend ?? 0));
    });
  }

  return totals;
};

const fetchDrilldownRecords = async ({ kind, source, range }) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  if (kind === 'hook_leads' || kind === 'hook_appointments') {
    const hookKind = kind === 'hook_leads' ? 'leads' : 'appointments';
    const { data, error } = await withTimeout(
      supabase.rpc('get_hook_records', {
        p_location_id: activeLocationId,
        p_start: startIso,
        p_end: endIso,
        p_kind: hookKind,
        p_hook: source || null,
        p_limit: 200
      }),
      12000,
      'Supabase query timeout (hook records).'
    );

    if (error) throw error;
    return data ?? [];
  }

  if (kind === 'lost_reason_leads') {
    const { data, error } = await withTimeout(
      supabase.rpc('get_lost_reason_records', {
        p_location_id: activeLocationId,
        p_start: startIso,
        p_end: endIso,
        p_reason: source || null,
        p_limit: 200
      }),
      12000,
      'Supabase query timeout (lost reason records).'
    );

    if (error) throw error;
    return data ?? [];
  }

  const { data, error } = await withTimeout(
    supabase.rpc('get_source_records', {
      p_location_id: activeLocationId,
      p_start: startIso,
      p_end: endIso,
      p_kind: kind,
      p_source: source || null,
      p_limit: 200
    }),
    12000,
    'Supabase query timeout (records).'
  );

  if (error) throw error;
  return data ?? [];
};

const normalizeEmail = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const chunkValues = (values, size = 100) => {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) {
    chunks.push(values.slice(i, i + size));
  }
  return chunks;
};

const hydrateDrilldownContacts = async (rows) => {
  if (!supabase || !Array.isArray(rows) || rows.length === 0) return rows;

  const missing = rows.filter((row) => !row?.contact_name || !row?.contact_email);
  if (!missing.length) return rows;

  const ids = Array.from(new Set(missing.map((row) => row?.contact_id).filter(Boolean)));
  const emails = Array.from(
    new Set(missing.map((row) => normalizeEmail(row?.contact_email)).filter(Boolean))
  );

  const contactById = new Map();
  const contactByEmail = new Map();

  const fetchContacts = async (field, values) => {
    const chunks = chunkValues(values, 100);
    for (const chunk of chunks) {
      const { data, error } = await supabase
        .from('contacts_view')
        .select('id, email, contact_name, first_name, last_name')
        .in(field, chunk);
      if (error) throw error;
      (data ?? []).forEach((contact) => {
        const contactName =
          contact?.contact_name ||
          [contact?.first_name, contact?.last_name].filter(Boolean).join(' ').trim();
        const email = normalizeEmail(contact?.email);
        if (contact?.id) {
          contactById.set(contact.id, { name: contactName, email: contact?.email });
        }
        if (email) {
          contactByEmail.set(email, { name: contactName, email: contact?.email });
        }
      });
    }
  };

  try {
    if (ids.length) {
      await fetchContacts('id', ids);
    }
    if (emails.length) {
      await fetchContacts('email', emails);
    }
  } catch (error) {
    console.warn('Drilldown contact hydration failed.', error);
    return rows;
  }

  return rows.map((row) => {
    if (!row) return row;
    const byId = row.contact_id ? contactById.get(row.contact_id) : null;
    const byEmail = row.contact_email ? contactByEmail.get(normalizeEmail(row.contact_email)) : null;
    const fallback = byId || byEmail;
    if (!fallback) return row;
    return {
      ...row,
      contact_name: row.contact_name || fallback.name || row.contact_name,
      contact_email: row.contact_email || fallback.email || row.contact_email
    };
  });
};

const buildDrilldownTitle = (kind, source, label) => {
  const base = label || DRILLDOWN_LABELS[kind] || 'Records';
  if (!source) return base;
  if (kind?.startsWith('hook_') || kind?.startsWith('lost_reason_')) return base;
  return `${base} · ${source}`;
};

const getDrilldownFilterLabel = (kind, source) => {
  if (!source) return '';
  if (kind?.startsWith('hook_')) {
    return `Hook: ${escapeHtml(source)}`;
  }
  if (kind?.startsWith('lost_reason_')) {
    return `Verliesreden: ${escapeHtml(source)}`;
  }
  return `Bron: ${escapeHtml(source)}`;
};

const openDrilldown = async ({ kind, source, label, range }) => {
  if (!kind) return;

  if (!supabase) {
    drilldownState.open = true;
    drilldownState.status = 'error';
    drilldownState.title = buildDrilldownTitle(kind, source, label);
    drilldownState.errorMessage = 'Supabase ontbreekt. Vul VITE_SUPABASE_URL en VITE_SUPABASE_PUBLISHABLE_KEY in.';
    drilldownState.range = { ...range };
    renderApp();
    return;
  }

  drilldownState.open = true;
  drilldownState.status = 'loading';
  drilldownState.kind = kind;
  drilldownState.source = source || null;
  drilldownState.title = buildDrilldownTitle(kind, source, label);
  drilldownState.errorMessage = '';
  drilldownState.rows = [];
  drilldownState.range = { ...range };
  renderApp();

  try {
    const rows = await fetchDrilldownRecords({ kind, source, range });
    const hydratedRows = await hydrateDrilldownContacts(Array.isArray(rows) ? rows : []);
    drilldownState.status = 'ready';
    drilldownState.rows = Array.isArray(hydratedRows) ? hydratedRows : [];
  } catch (error) {
    drilldownState.status = 'error';
    drilldownState.errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
  }

  renderApp();
};

const closeDrilldown = () => {
  drilldownState.open = false;
  drilldownState.status = 'idle';
  drilldownState.rows = [];
  drilldownState.errorMessage = '';
  drilldownState.range = null;
};

const ensureOpportunityCount = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }

    if (configState.status === 'loading') {
      const alreadyLoading =
        liveState.opportunities.status === 'loading' && liveState.opportunities.rangeKey === key;
      if (!alreadyLoading) {
        liveState.opportunities = {
          status: 'loading',
          count: null,
          rangeKey: key,
          errorMessage: '',
          inFlight: false
        };
        scheduleRender();
      }
      return;
    }

    if (configState.status === 'error') {
      const nextError = configState.errorMessage || 'Location ID ontbreekt.';
      const alreadyError =
        liveState.opportunities.status === 'error' &&
        liveState.opportunities.rangeKey === key &&
        liveState.opportunities.errorMessage === nextError;
      if (!alreadyError) {
        liveState.opportunities = {
          status: 'error',
          count: null,
          rangeKey: key,
          errorMessage: nextError,
          inFlight: false
        };
        scheduleRender();
      }
      return;
    }
  }

  if (liveState.opportunities.rangeKey === key && liveState.opportunities.inFlight) return;
  if (liveState.opportunities.rangeKey === key && liveState.opportunities.status === 'ready') return;

  liveState.opportunities = { status: 'loading', count: null, rangeKey: key, errorMessage: '', inFlight: true };
  scheduleRender();

  try {
    const count = await fetchOpportunityCount(range);
    liveState.opportunities = { status: 'ready', count, rangeKey: key, errorMessage: '', inFlight: false };
  } catch (error) {
    liveState.opportunities = {
      status: 'error',
      count: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureSourceBreakdown = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (liveState.sourceBreakdown.rangeKey === key && liveState.sourceBreakdown.inFlight) return;
  if (liveState.sourceBreakdown.rangeKey === key && liveState.sourceBreakdown.status === 'ready') return;

  liveState.sourceBreakdown = {
    status: 'loading',
    rows: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const rows = await fetchSourceBreakdown(range);
    liveState.sourceBreakdown = {
      status: 'ready',
      rows,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.sourceBreakdown = {
      status: 'error',
      rows: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureHookPerformance = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (!configState.hookFieldId && !configState.campaignFieldId) return;

  if (liveState.hookPerformance.rangeKey === key && liveState.hookPerformance.inFlight) return;
  if (liveState.hookPerformance.rangeKey === key && liveState.hookPerformance.status === 'ready') return;

  liveState.hookPerformance = {
    status: 'loading',
    rows: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const rows = await fetchHookPerformance(range);
    liveState.hookPerformance = {
      status: 'ready',
      rows,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.hookPerformance = {
      status: 'error',
      rows: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureLostReasons = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (liveState.lostReasons.rangeKey === key && liveState.lostReasons.inFlight) return;
  if (liveState.lostReasons.rangeKey === key && liveState.lostReasons.status === 'ready') return;

  liveState.lostReasons = {
    status: 'loading',
    rows: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const rows = await fetchLostReasons(range);
    liveState.lostReasons = {
      status: 'ready',
      rows,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.lostReasons = {
      status: 'error',
      rows: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureFinanceSummary = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (liveState.finance.rangeKey === key && liveState.finance.inFlight) return;
  if (liveState.finance.rangeKey === key && liveState.finance.status === 'ready') return;

  liveState.finance = {
    status: 'loading',
    totals: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const totals = await fetchFinanceSummary(range);
    liveState.finance = {
      status: 'ready',
      totals,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.finance = {
      status: 'error',
      totals: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureSpendBySource = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (liveState.spendBySource.rangeKey === key && liveState.spendBySource.inFlight) return;
  if (liveState.spendBySource.rangeKey === key && liveState.spendBySource.status === 'ready') return;

  liveState.spendBySource = {
    status: 'loading',
    totals: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const totals = await fetchSpendBySource(range);
    liveState.spendBySource = {
      status: 'ready',
      totals,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.spendBySource = {
      status: 'error',
      totals: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureAppointmentCounts = async (range) => {
  if (!supabase) return;

  const key = buildRangeKey(range);

  if (!configState.locationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    return;
  }

  if (liveState.appointments.rangeKey === key && liveState.appointments.inFlight) return;
  if (liveState.appointments.rangeKey === key && liveState.appointments.status === 'ready') return;

  liveState.appointments = {
    status: 'loading',
    counts: null,
    rangeKey: key,
    errorMessage: '',
    inFlight: true
  };
  scheduleRender();

  try {
    const counts = await fetchAppointmentCounts(range);
    liveState.appointments = {
      status: 'ready',
      counts,
      rangeKey: key,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.appointments = {
      status: 'error',
      counts: null,
      rangeKey: key,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const ensureLatestSync = async () => {
  if (!supabase) return;
  if (!configState.locationId) return;
  if (liveState.sync.inFlight || liveState.sync.status === 'ready') return;

  liveState.sync = { ...liveState.sync, status: 'loading', inFlight: true };
  scheduleRender();

  try {
    const timestamp = await fetchLatestSyncTimestamp();
    liveState.sync = {
      status: 'ready',
      timestamp,
      errorMessage: '',
      inFlight: false
    };
  } catch (error) {
    liveState.sync = {
      status: 'error',
      timestamp: null,
      errorMessage: error instanceof Error ? error.message : 'Onbekende fout',
      inFlight: false
    };
  }

  scheduleRender();
};

const MONTHS_SHORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december'
];
const WEEKDAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

const pad2 = (value) => String(value).padStart(2, '0');

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return '--';
  const [year, month, day] = dateValue.split('-').map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]}. ${year}`;
};

const formatSyncTimestamp = (value) => {
  if (!value) return 'Laatste sync: onbekend';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'Laatste sync: onbekend';
  const formatted = dt.toLocaleString('nl-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return `Laatste sync: ${formatted}`;
};

const formatDateTime = (value) => {
  if (!value) return '--';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '--';
  return dt.toLocaleString('nl-BE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const shiftMonth = (viewMonth, delta) => {
  const [year, month] = viewMonth.split('-').map(Number);
  const next = new Date(year, month - 1 + delta, 1);
  return `${next.getFullYear()}-${pad2(next.getMonth() + 1)}`;
};

const getMonthLabel = (viewMonth) => {
  const [year, month] = viewMonth.split('-').map(Number);
  return `${MONTHS_LONG[month - 1]} ${year}`;
};

const buildCalendarCells = (viewMonth, range) => {
  const [year, month] = viewMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateValue = `${year}-${pad2(month)}-${pad2(day)}`;
    const disabled = dateValue < dataBounds.min || dateValue > dataBounds.max;
    const isStart = dateValue === range.start;
    const isEnd = dateValue === range.end;
    const inRange = dateValue > range.start && dateValue < range.end;
    cells.push({ day, dateValue, disabled, isStart, isEnd, inRange });
  }

  const totalCells = Math.ceil(cells.length / 7) * 7;
  while (cells.length < totalCells) {
    cells.push({ empty: true });
  }

  return cells;
};

const renderDatePicker = (range) => {
  if (!pickerState.open) return '';

  let viewMonth = pickerState.viewMonth || range.start.slice(0, 7);
  if (viewMonth < monthBounds.min) viewMonth = monthBounds.min;
  if (viewMonth > monthBounds.max) viewMonth = monthBounds.max;
  pickerState.viewMonth = viewMonth;
  const prevMonth = shiftMonth(viewMonth, -1);
  const nextMonth = shiftMonth(viewMonth, 1);
  const prevDisabled = prevMonth < monthBounds.min;
  const nextDisabled = nextMonth > monthBounds.max;

  const weekdays = WEEKDAYS.map((day) => `<div class="date-picker-weekday">${day}</div>`).join('');
  const cells = buildCalendarCells(viewMonth, range)
    .map((cell) => {
      if (cell.empty) {
        return '<div class="date-cell date-cell-empty"></div>';
      }

      const classes = [
        'date-cell',
        cell.disabled ? 'date-cell-disabled' : '',
        cell.inRange ? 'date-cell-range' : '',
        cell.isStart ? 'date-cell-start' : '',
        cell.isEnd ? 'date-cell-end' : ''
      ]
        .filter(Boolean)
        .join(' ');

      const attrs = cell.disabled ? 'disabled' : `data-date-value="${cell.dateValue}"`;
      return `<button type="button" class="${classes}" ${attrs}>${cell.day}</button>`;
    })
    .join('');

  return `
    <div class="date-picker-backdrop" data-date-overlay></div>
    <div class="date-picker-panel" role="dialog" aria-label="Kies periode">
      <div class="date-picker-header">
        <div class="date-picker-selection">
          <button type="button" class="date-chip${pickerState.selecting === 'start' ? ' active' : ''}" data-date-mode="start">
            Start: ${formatDisplayDate(range.start)}
          </button>
          <button type="button" class="date-chip${pickerState.selecting === 'end' ? ' active' : ''}" data-date-mode="end">
            Eind: ${formatDisplayDate(range.end)}
          </button>
        </div>
        <div class="date-picker-nav">
          <button type="button" class="date-nav-button" data-month-prev ${prevDisabled ? 'disabled' : ''}>
            ${icons.chevronLeft('lucide lucide-chevron-left w-4 h-4')}
          </button>
          <div class="date-picker-title">${getMonthLabel(viewMonth)}</div>
          <button type="button" class="date-nav-button" data-month-next ${nextDisabled ? 'disabled' : ''}>
            ${icons.chevronLeft('lucide lucide-chevron-left w-4 h-4 rotate-180')}
          </button>
        </div>
      </div>
      <div class="date-picker-grid">
        ${weekdays}
        ${cells}
      </div>
      <div class="date-picker-footer">
        <button type="button" class="date-footer-button" data-date-clear>Reset</button>
        <button type="button" class="date-footer-button primary" data-date-close>Sluit</button>
      </div>
    </div>
  `;
};

const getOpportunityDebug = (range) => {
  if (!supabase) {
    return {
      tone: 'warning',
      text: 'Supabase ontbreekt. Vul VITE_SUPABASE_URL en VITE_SUPABASE_PUBLISHABLE_KEY in en herstart de dev server.'
    };
  }

  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    if (configState.status === 'loading') {
      return { tone: 'info', text: 'Dashboard config wordt geladen...' };
    }
    if (configState.status === 'error') {
      return {
        tone: 'danger',
        text: `Dashboard config error: ${configState.errorMessage || 'onbekend'}`
      };
    }
    return {
      tone: 'warning',
      text: 'Location ID ontbreekt. Zet deze in dashboard_config of in VITE_GHL_LOCATION_ID.'
    };
  }

  const key = buildRangeKey(range);
  if (
    liveState.opportunities.rangeKey !== key &&
    liveState.appointments.rangeKey !== key &&
    liveState.sourceBreakdown.rangeKey !== key &&
    liveState.lostReasons.rangeKey !== key
  ) {
    return null;
  }

  if (
    liveState.opportunities.status === 'loading' ||
    liveState.appointments.status === 'loading' ||
    liveState.sourceBreakdown.status === 'loading' ||
    liveState.lostReasons.status === 'loading'
  ) {
    return { tone: 'info', text: 'Live data wordt opgehaald uit Supabase...' };
  }

  if (liveState.opportunities.status === 'error') {
    return {
      tone: 'danger',
      text: `Supabase error: ${liveState.opportunities.errorMessage || 'onbekend'} (check RLS/policies).`
    };
  }

  if (liveState.appointments.status === 'error') {
    return {
      tone: 'danger',
      text: `Supabase error: ${liveState.appointments.errorMessage || 'onbekend'} (check RLS/policies).`
    };
  }

  if (liveState.sourceBreakdown.status === 'error') {
    return {
      tone: 'danger',
      text: `Supabase error: ${liveState.sourceBreakdown.errorMessage || 'onbekend'} (check RLS/policies).`
    };
  }

  if (liveState.lostReasons.status === 'error') {
    return {
      tone: 'danger',
      text: `Supabase error: ${liveState.lostReasons.errorMessage || 'onbekend'} (check RLS/policies).`
    };
  }

  return null;
};

const renderDebugPanel = (range) => {
  if (!DEBUG_ENABLED) return '';

  const key = buildRangeKey(range);
  const supabaseStatus = supabase ? 'configured' : 'missing';
  const locationStatus = configState.locationId || ghlLocationId || 'missing';
  const locationSource = configState.source || (ghlLocationId ? 'env' : 'missing');
  const configStatus = configState.status;
  const status = liveState.opportunities.status;
  const appointmentStatus = liveState.appointments.status;
  const sourceStatus = liveState.sourceBreakdown.status;
  const hookStatus = liveState.hookPerformance.status;
  const lostStatus = liveState.lostReasons.status;
  const inFlight = liveState.opportunities.inFlight ? 'yes' : 'no';
  const count = liveState.opportunities.count;
  const errorMessage = liveState.opportunities.errorMessage;
  const rangeMatch = liveState.opportunities.rangeKey === key ? 'yes' : 'no';
  const sourceCount = Array.isArray(liveState.sourceBreakdown.rows) ? liveState.sourceBreakdown.rows.length : 0;
  const hookCount = Array.isArray(liveState.hookPerformance.rows) ? liveState.hookPerformance.rows.length : 0;
  const lostCount = Array.isArray(liveState.lostReasons.rows) ? liveState.lostReasons.rows.length : 0;

  const message = [
    `supabase: ${supabaseStatus}`,
    `location_id: ${locationStatus}`,
    `location_source: ${locationSource}`,
    `config_status: ${configStatus}`,
    `range: ${range.start} -> ${range.end}`,
    `range_key_match: ${rangeMatch}`,
    `status: ${status}`,
    `appointments_status: ${appointmentStatus}`,
    `source_status: ${sourceStatus}`,
    `hook_status: ${hookStatus}`,
    `lost_status: ${lostStatus}`,
    `in_flight: ${inFlight}`,
    typeof count === 'number' ? `count: ${count}` : '',
    sourceCount ? `sources: ${sourceCount}` : '',
    hookCount ? `hooks: ${hookCount}` : '',
    lostCount ? `lost_reasons: ${lostCount}` : '',
    errorMessage ? `error: ${errorMessage}` : ''
  ]
    .filter(Boolean)
    .join(' | ');

  return `<div class="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">${message}</div>`;
};

const renderAdminModal = () => {
  if (!adminModeEnabled) return '';

  const loggedIn = Boolean(authSession);
  const userEmail = authSession?.user?.email || '';
  const adminBusy = adminState.loading || adminState.status === 'saving';
  const mappingBusy = adminState.mapping.loading || adminState.mapping.saving;
  const mappingStatusClass = adminState.mapping.status === 'error' ? 'error' : 'success';
  const sourceOptionsMarkup = (adminState.mapping.sourceOptions ?? [])
    .map((option) => `<option value="${escapeHtml(option)}"></option>`)
    .join('');
  const sourceOptionsList = sourceOptionsMarkup
    ? `<datalist id="source-options">${sourceOptionsMarkup}</datalist>`
    : '';

  const renderMappingInput = (row, placeholder) =>
    `<input type="text" class="admin-input admin-mapping-input" value="${escapeHtml(
      row?.source_label ?? ''
    )}" placeholder="${escapeHtml(placeholder)}" list="source-options" data-map-key="${escapeHtml(
      row?.key ?? ''
    )}" ${mappingBusy ? 'disabled' : ''} />`;

  const campaignRows = adminState.mapping.campaigns ?? [];
  const campaignRowsMarkup = campaignRows.length
    ? campaignRows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.campaign_name || row.campaign_id)}</td>
              <td>${renderMappingInput(row, META_SOURCE_BY_LANG.nl)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="2" class="admin-mapping-empty">Geen campagnes gevonden.</td></tr>';

  const adsetRows = adminState.mapping.adsets ?? [];
  const adsetRowsMarkup = adsetRows.length
    ? adsetRows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.campaign_name || row.campaign_id)}</td>
              <td>${escapeHtml(row.adset_name || row.adset_id)}</td>
              <td class="admin-mapping-muted">${escapeHtml(row.default_label || META_SOURCE_BY_LANG.nl)}</td>
              <td>${renderMappingInput(row, row.default_label || META_SOURCE_BY_LANG.nl)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="4" class="admin-mapping-empty">Geen adsets gevonden.</td></tr>';

  const googleCampaignRows = adminState.mapping.googleCampaigns ?? [];
  const googleCampaignRowsMarkup = googleCampaignRows.length
    ? googleCampaignRows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row.campaign_name || row.campaign_id)}</td>
              <td>${renderMappingInput(row, GOOGLE_SOURCE_LABEL)}</td>
            </tr>
          `
        )
        .join('')
    : '<tr><td colspan="2" class="admin-mapping-empty">Geen Google campagnes gevonden.</td></tr>';

  const googleRow =
    adminState.mapping.google ?? {
      key: buildMappingKey(MAPPING_PLATFORMS.google, null, null),
      platform: MAPPING_PLATFORMS.google,
      source_label: ''
    };

  return `
    <div class="admin-modal${adminState.open ? ' open' : ''}">
      <div class="admin-overlay" data-admin-close></div>
      <div class="admin-panel" role="dialog" aria-label="GHL Integratie">
        <div class="admin-header">
          <div>
            <h3 class="admin-title">GHL Integratie</h3>
            <p class="admin-subtitle">Sla Location ID + PIT veilig op in Supabase</p>
          </div>
          <button type="button" class="admin-close" data-admin-close>Sluit</button>
        </div>
        ${
          loggedIn
            ? `<div class="admin-meta">Ingelogd als ${userEmail}</div>
               ${adminState.loading ? '<div class="admin-meta">Integratie wordt geladen...</div>' : ''}
               <form class="admin-form" data-admin-form>
                 <label class="admin-label">
                   Location ID
                   <input type="text" class="admin-input" value="${adminState.form.locationId}" placeholder="loc_..." data-admin-location ${adminBusy ? 'disabled' : ''} required />
                 </label>
                 <label class="admin-label">
                   Private Integration Token (PIT)
                   <input type="password" class="admin-input" value="${adminState.form.token}" placeholder="pit-..." data-admin-token ${adminBusy ? 'disabled' : ''} />
                 </label>
                 <label class="admin-checkbox">
                   <input type="checkbox" ${adminState.form.active ? 'checked' : ''} data-admin-active ${adminBusy ? 'disabled' : ''} />
                   Actief
                 </label>
                 ${
                   adminState.message
                     ? `<div class="admin-message ${adminState.status === 'error' ? 'error' : 'success'}">${adminState.message}</div>`
                     : ''
                 }
                 <button type="submit" class="admin-submit" ${adminBusy ? 'disabled' : ''}>
                   ${adminState.status === 'saving' ? 'Opslaan...' : 'Opslaan'}
                 </button>
                 <button type="button" class="admin-ghost" data-admin-signout>Uitloggen</button>
               </form>
               <div class="admin-section">
                 <div class="admin-section-header">
                   <div>
                     <h4 class="admin-section-title">Kostattributie</h4>
                     <p class="admin-section-subtitle">
                       Koppel Meta campagnes of adsets en Google campagnes aan de juiste Source. Adset mapping overschrijft campagne mapping.
                       Laat leeg om de NL default te gebruiken. Google zonder mapping krijgt het standaard label.
                     </p>
                   </div>
                   <div class="admin-mapping-toolbar">
                     <button type="button" class="admin-ghost" data-map-refresh ${mappingBusy ? 'disabled' : ''}>Vernieuw</button>
                     <button type="button" class="admin-submit" data-map-save ${mappingBusy ? 'disabled' : ''}>
                       ${adminState.mapping.saving ? 'Opslaan...' : 'Opslaan'}
                     </button>
                   </div>
                 </div>
                 ${
                   adminState.mapping.message
                     ? `<div class="admin-message ${mappingStatusClass}">${adminState.mapping.message}</div>`
                     : ''
                 }
                 ${adminState.mapping.loading ? '<div class="admin-meta">Mapping wordt geladen...</div>' : ''}
                 <div class="admin-mapping-block">
                   <h5 class="admin-mapping-title">Meta campagnes</h5>
                   <div class="admin-mapping-table-wrapper">
                     <table class="admin-mapping-table">
                       <thead>
                         <tr>
                           <th>Campagne</th>
                           <th>Source label</th>
                         </tr>
                       </thead>
                       <tbody>${campaignRowsMarkup}</tbody>
                     </table>
                   </div>
                 </div>
                 <div class="admin-mapping-block">
                   <h5 class="admin-mapping-title">Meta adsets</h5>
                   <div class="admin-mapping-table-wrapper">
                     <table class="admin-mapping-table">
                       <thead>
                         <tr>
                           <th>Campagne</th>
                           <th>Adset</th>
                           <th>Default</th>
                           <th>Source label</th>
                         </tr>
                       </thead>
                       <tbody>${adsetRowsMarkup}</tbody>
                     </table>
                   </div>
                 </div>
                 <div class="admin-mapping-block">
                   <h5 class="admin-mapping-title">Google</h5>
                   <div class="admin-mapping-table-wrapper">
                     <table class="admin-mapping-table">
                       <thead>
                         <tr>
                           <th>Platform</th>
                           <th>Source label</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr>
                           <td>Google (sheet)</td>
                           <td>${renderMappingInput(googleRow, GOOGLE_SOURCE_LABEL)}</td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                 </div>
                 <div class="admin-mapping-block">
                   <h5 class="admin-mapping-title">Google campagnes</h5>
                   <div class="admin-mapping-table-wrapper">
                     <table class="admin-mapping-table">
                       <thead>
                         <tr>
                           <th>Campagne</th>
                           <th>Source label</th>
                         </tr>
                       </thead>
                       <tbody>${googleCampaignRowsMarkup}</tbody>
                     </table>
                   </div>
                 </div>
                 ${sourceOptionsList}
               </div>`
            : `<form class="admin-form" data-admin-login>
                 <label class="admin-label">
                   Email
                   <input type="email" class="admin-input" value="${adminState.auth.email}" placeholder="jij@bedrijf.be" data-admin-email required />
                 </label>
                 ${
                   adminState.auth.message
                     ? `<div class="admin-message ${adminState.auth.status === 'error' ? 'error' : 'success'}">${adminState.auth.message}</div>`
                     : ''
                 }
                 <button type="submit" class="admin-submit" ${adminState.auth.status === 'sending' ? 'disabled' : ''}>
                   ${adminState.auth.status === 'sending' ? 'Versturen...' : 'Stuur magic link'}
                 </button>
               </form>`
        }
      </div>
    </div>
  `;
};

const renderDrilldownValue = ({ value, kind, source, label, enabled, className, fallbackTag = 'span' }) => {
  const safeValue = escapeHtml(value);
  if (!kind || !enabled) {
    return `<${fallbackTag} class="${className}">${safeValue}</${fallbackTag}>`;
  }

  const sourceAttr = source ? ` data-drill-source="${escapeHtml(source)}"` : '';
  const labelAttr = label ? ` data-drill-label="${escapeHtml(label)}"` : '';
  return `<button type="button" class="drilldown-button ${className}" data-drill-kind="${kind}"${sourceAttr}${labelAttr}>${safeValue}</button>`;
};

const distributeCounts = (total, ratios) => {
  if (total <= 0) return ratios.map(() => 0);
  const raw = ratios.map((ratio) => total * ratio);
  const base = raw.map((value) => Math.floor(value));
  let remainder = total - base.reduce((sum, value) => sum + value, 0);
  const fractions = raw
    .map((value, index) => ({ index, fraction: value - base[index] }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < remainder; i += 1) {
    base[fractions[i].index] += 1;
  }

  return base;
};

const computeMetrics = (range) => {
  const filtered = mockEntries.filter((entry) => isInRange(entry.date, range));
  const totals = filtered.reduce(
    (acc, entry) => {
      acc.leads += entry.leads;
      acc.appointments += entry.appointments;
      acc.cancelled += entry.cancelled;
      acc.rescheduled += entry.rescheduled;
      acc.noShow += entry.noShow;
      acc.deals += entry.deals;
      acc.cost += entry.leads * entry.costPerLead;
      acc.revenue += entry.deals * entry.dealValue;
      return acc;
    },
    { leads: 0, appointments: 0, cancelled: 0, rescheduled: 0, noShow: 0, confirmed: 0, deals: 0, cost: 0, revenue: 0 }
  );

  totals.confirmed = Math.max(totals.appointments - totals.cancelled - totals.noShow - totals.rescheduled, 0);

  const conversionRate = safeDivide(totals.appointments, totals.leads);
  const profit = totals.revenue - totals.cost;
  const roi = safeDivide(profit, totals.cost);

  const funnelMetrics = [
    {
      label: 'Totaal Leads',
      value: formatNumber(totals.leads),
      rawValue: totals.leads,
      drilldown: { kind: 'leads', label: 'Leads (opportunities)' },
      icon: icons.users('lucide lucide-users w-4 h-4 text-primary'),
      className: ''
    },
    {
      label: 'Totaal Afspraken',
      value: formatNumber(totals.appointments),
      rawValue: totals.appointments,
      drilldown: { kind: 'appointments', label: 'Afspraken' },
      icon: icons.calendar('lucide lucide-calendar w-4 h-4 text-primary'),
      className: ''
    },
    {
      label: 'Confirmed',
      value: formatNumber(totals.confirmed),
      rawValue: totals.confirmed,
      drilldown: { kind: 'appointments_confirmed', label: 'Confirmed afspraken' },
      icon: icons.check('lucide lucide-circle-check-big w-4 h-4 text-primary'),
      className: 'kpi-card-success'
    },
    {
      label: 'Cancelled',
      value: formatNumber(totals.cancelled),
      rawValue: totals.cancelled,
      drilldown: { kind: 'appointments_cancelled', label: 'Cancelled afspraken' },
      icon: icons.circleX('lucide lucide-circle-x w-4 h-4 text-primary'),
      className: 'kpi-card-danger'
    },
    {
      label: 'No-Show',
      value: formatNumber(totals.noShow),
      rawValue: totals.noShow,
      drilldown: { kind: 'appointments_no_show', label: 'No-show afspraken' },
      icon: icons.clock('lucide lucide-clock w-4 h-4 text-primary'),
      className: 'kpi-card-danger'
    },
    { label: 'Lead -> Afspraak', value: formatPercent(conversionRate, 1), icon: icons.target('lucide lucide-target w-4 h-4 text-primary'), className: '' }
  ];

  const sourceRows = SOURCE_ORDER.map((source) => {
    const sourceEntries = filtered.filter((entry) => entry.source === source);
    const sourceTotals = sourceEntries.reduce(
      (acc, entry) => {
        const confirmed = Math.max(entry.appointments - entry.cancelled - entry.noShow - entry.rescheduled, 0);
        acc.leads += entry.leads;
        acc.appointments += entry.appointments;
        acc.confirmed += confirmed;
        acc.cost += entry.leads * entry.costPerLead;
        return acc;
      },
      { leads: 0, appointments: 0, confirmed: 0, cost: 0 }
    );

    return {
      source,
      leads: formatNumber(sourceTotals.leads),
      appointments: formatNumber(sourceTotals.appointments),
      confirmed: formatNumber(sourceTotals.confirmed),
      noLeadInRange: formatNumber(0),
      plan: formatPercent(safeDivide(sourceTotals.appointments, sourceTotals.leads), 1),
      cost: formatCurrency(safeDivide(sourceTotals.cost, sourceTotals.confirmed), 2),
      rawLeads: sourceTotals.leads,
      rawAppointments: sourceTotals.appointments,
      rawConfirmedAppointments: sourceTotals.confirmed,
      rawNoLeadInRange: 0
    };
  });

  const costPerLead = totals.leads > 0 ? totals.cost / totals.leads : Number.NaN;
  const financeMetrics = [
    { label: 'Totale Leadkosten', value: formatCurrency(totals.cost, 0), icon: icons.dollar('lucide lucide-dollar-sign w-4 h-4 text-primary'), className: '' },
    { label: 'Kost per Lead', value: formatOptionalCurrency(costPerLead, 2), icon: icons.chartColumn('lucide lucide-chart-column w-4 h-4 text-primary'), className: '' }
  ];

  const hookMetrics = HOOK_ORDER.map((hook) => {
    const hookEntries = filtered.filter((entry) => entry.hook === hook);
    const totalsByHook = hookEntries.reduce(
      (acc, entry) => {
        const confirmed = Math.max(entry.appointments - entry.cancelled - entry.noShow - entry.rescheduled, 0);
        acc.leads += entry.leads;
        acc.appointments += confirmed;
        acc.cost += entry.leads * entry.costPerLead;
        return acc;
      },
      { leads: 0, appointments: 0, cost: 0 }
    );

    return {
      hook,
      leads: totalsByHook.leads,
      appointments: totalsByHook.appointments,
      conversion: safeDivide(totalsByHook.appointments, totalsByHook.leads),
      costPerLead: safeDivide(totalsByHook.cost, totalsByHook.leads),
      costPerCall: safeDivide(totalsByHook.cost, totalsByHook.appointments),
      spend: totalsByHook.cost
    };
  });

  const activeHooks = hookMetrics.filter((hook) => hook.leads > 0 || hook.appointments > 0);
  const fallbackHook = activeHooks[0] || {
    hook: 'Geen data',
    leads: 0,
    appointments: 0,
    conversion: 0,
    costPerLead: 0,
    costPerCall: 0,
    spend: 0
  };
  const bestConversion = activeHooks.reduce((best, hook) => (hook.conversion > best.conversion ? hook : best), fallbackHook);
  const worstConversion = activeHooks.reduce((worst, hook) => (hook.conversion < worst.conversion ? hook : worst), fallbackHook);
  const cheapestLeads = activeHooks.reduce((best, hook) => (hook.costPerLead < best.costPerLead ? hook : best), fallbackHook);
  const mostExpensiveLeads = activeHooks.reduce((best, hook) => (hook.costPerLead > best.costPerLead ? hook : best), fallbackHook);
  const mostVolume = activeHooks.reduce((best, hook) => (hook.leads > best.leads ? hook : best), fallbackHook);

    const hookCards = [...activeHooks]
      .sort((a, b) => b.leads - a.leads)
      .map((hook) => ({
        label: hook.hook,
        leads: formatNumber(hook.leads),
        rawLeads: hook.leads,
        appointments: formatNumber(hook.appointments),
        rawAppointments: hook.appointments,
        conversion: formatPercent(hook.conversion, 1),
        costPerLead: formatCurrency(hook.costPerLead, 2),
        costPerCall: formatCurrency(hook.costPerCall, 2),
        spend: formatCurrency(hook.spend, 0),
        badges: {
        bestConversion: bestConversion && hook.hook === bestConversion.hook,
        cheapest: cheapestLeads && hook.hook === cheapestLeads.hook,
        mostVolume: mostVolume && hook.hook === mostVolume.hook,
        lowestConversion: worstConversion && hook.hook === worstConversion.hook,
        mostExpensive: mostExpensiveLeads && hook.hook === mostExpensiveLeads.hook
      }
    }));

  const totalLost = Math.max(totals.leads - totals.deals, 0);
  const lostCounts = distributeCounts(totalLost, LOST_REASON_RATIOS.map((reason) => reason.ratio));
  const maxLost = Math.max(0, ...lostCounts);
  const lostReasons = LOST_REASON_RATIOS.map((reason, index) => {
    const count = lostCounts[index];
    const percent = safeDivide(count, totalLost);
    return {
      label: reason.label,
      count,
      value: `${formatNumber(count)} (${formatNumber(percent * 100, 0)}%)`,
      width: `${Math.round(percent * 100)}%`,
      color: reason.color,
      highlight: count === maxLost && count > 0
    };
  });

  const topReason = lostReasons.find((reason) => reason.highlight) || lostReasons[0];
  const summaryCards = [
    { icon: icons.trendingUp('lucide lucide-trending-up w-5 h-5 text-primary'), label: 'Totale ROI', value: `${roi >= 0 ? '+' : ''}${formatPercent(roi, 1)}`, detail: `${formatCurrency(profit, 0)} winst` },
    { icon: icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-primary'), label: 'Top Verliesreden', value: topReason.label, detail: `${formatNumber(safeDivide(topReason ? topReason.count : 0, totalLost) * 100, 0)}% van verloren leads` },
    { icon: icons.award('lucide lucide-award w-5 h-5 text-primary'), label: 'Aanbeveling', value: bestConversion ? `Schaal "${bestConversion.hook}"` : 'Schaal top hook', detail: '+25% budget verhogen' }
  ];

  return {
    funnelMetrics,
    sourceRows,
    sourceRowsLive: false,
    financeMetrics,
    hookHighlights: { best: bestConversion, worst: worstConversion },
    hookCards,
    hookPerformanceLive: false,
    lostReasons,
    lostReasonsLive: false,
    summaryCards,
    totalLost
  };
};

const buildHookMetricsFromLive = (rows, spendBySource) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const aggregated = new Map();
  const sourceTotals = new Map();
  rows.forEach((row) => {
    const rawHook = row?.hook ? String(row.hook) : 'Onbekend';
    const campaign = row?.campaign ? String(row.campaign) : 'Onbekend';
    const source = row?.source ? String(row.source) : 'Onbekend';
    const hook =
      rawHook !== 'Onbekend'
        ? rawHook
        : source && source !== 'Onbekend'
          ? source
          : campaign && campaign !== 'Onbekend'
            ? campaign
            : 'Onbekend';
    const leads = Number(row?.leads ?? 0);
    const appointments = Number(row?.appointments ?? 0);
    const weight = leads > 0 ? leads : appointments;
    const current = aggregated.get(hook) || { hook, leads: 0, appointments: 0, sources: new Map() };
    current.leads += Number.isFinite(leads) ? leads : 0;
    current.appointments += Number.isFinite(appointments) ? appointments : 0;
    if (source && source !== 'Onbekend') {
      const sourceWeight = current.sources.get(source) || 0;
      current.sources.set(source, sourceWeight + (Number.isFinite(weight) ? weight : 0));
      const totalWeight = sourceTotals.get(source) || 0;
      sourceTotals.set(source, totalWeight + (Number.isFinite(weight) ? weight : 0));
    }
    aggregated.set(hook, current);
  });

  const resolveSpend = (hook) => {
    if (!spendBySource) return Number.NaN;
    if (!hook.sources || hook.sources.size === 0) return Number.NaN;
    let spend = 0;
    hook.sources.forEach((weight, source) => {
      const sourceTotal = sourceTotals.get(source) || 0;
      if (!sourceTotal) return;
      const sourceSpend = Number(spendBySource?.[source] ?? 0);
      spend += sourceSpend * (weight / sourceTotal);
    });
    return spend;
  };

  const hookMetrics = Array.from(aggregated.values()).map((hook) => {
    const spend = resolveSpend(hook);
    const costPerLead = hook.leads > 0 ? spend / hook.leads : Number.NaN;
    const costPerCall = hook.appointments > 0 ? spend / hook.appointments : Number.NaN;
    return {
      hook: hook.hook,
      leads: hook.leads,
      appointments: hook.appointments,
      conversion: safeDivide(hook.appointments, hook.leads),
      costPerLead,
      costPerCall,
      spend
    };
  });

  const activeHooks = hookMetrics.filter((hook) => hook.leads > 0 || hook.appointments > 0);
  if (!activeHooks.length) return null;

  const fallbackHook = activeHooks[0] || {
    hook: 'Geen data',
    leads: 0,
    appointments: 0,
    conversion: 0,
    costPerLead: Number.NaN,
    costPerCall: Number.NaN,
    spend: Number.NaN
  };
  const bestConversion = activeHooks.reduce((best, hook) => (hook.conversion > best.conversion ? hook : best), fallbackHook);
  const worstConversion = activeHooks.reduce((worst, hook) => (hook.conversion < worst.conversion ? hook : worst), fallbackHook);
  const mostVolume = activeHooks.reduce((best, hook) => (hook.leads > best.leads ? hook : best), fallbackHook);

  const hasCost = activeHooks.some((hook) => Number.isFinite(hook.costPerLead));
  const cheapestLeads = hasCost
    ? activeHooks.reduce((best, hook) => (hook.costPerLead < best.costPerLead ? hook : best), fallbackHook)
    : null;
  const mostExpensiveLeads = hasCost
    ? activeHooks.reduce((best, hook) => (hook.costPerLead > best.costPerLead ? hook : best), fallbackHook)
    : null;

    const hookCards = [...activeHooks]
      .sort((a, b) => b.leads - a.leads)
      .map((hook) => ({
        label: hook.hook,
        leads: formatNumber(hook.leads),
        rawLeads: hook.leads,
        appointments: formatNumber(hook.appointments),
        rawAppointments: hook.appointments,
        conversion: formatPercent(hook.conversion, 1),
        costPerLead: formatOptionalCurrency(hook.costPerLead, 2),
        costPerCall: formatOptionalCurrency(hook.costPerCall, 2),
        spend: formatOptionalCurrency(hook.spend, 0),
        badges: {
          bestConversion: bestConversion && hook.hook === bestConversion.hook,
          cheapest: cheapestLeads ? hook.hook === cheapestLeads.hook : false,
          mostVolume: mostVolume && hook.hook === mostVolume.hook,
          lowestConversion: worstConversion && hook.hook === worstConversion.hook,
          mostExpensive: mostExpensiveLeads ? hook.hook === mostExpensiveLeads.hook : false
        }
      }));

  return {
    hookHighlights: { best: bestConversion, worst: worstConversion },
    hookCards
  };
};

const normalizeLostReasonLabel = (value) => {
  if (!value) return '';
  const label = String(value).trim();
  return label;
};

const buildLostReasonsFromLive = (rows) => {
  if (!Array.isArray(rows)) return null;

  const cleaned = rows
    .map((row) => {
      const label = normalizeLostReasonLabel(
        row?.reason ?? row?.lost_reason ?? row?.label ?? row?.lostReason ?? row?.lostreason
      );
      const count = Number(row?.total ?? row?.count ?? 0);
      return {
        label: label || 'Overig',
        count: Number.isFinite(count) ? count : 0
      };
    })
    .filter((entry) => entry.count > 0);

  if (!cleaned.length) {
    return {
      lostReasons: [
        {
          label: 'Geen data',
          count: 0,
          value: '0 (0%)',
          width: '0%',
          color: LOST_REASON_COLORS[0],
          highlight: false
        }
      ],
      totalLost: 0
    };
  }

  const totalLost = cleaned.reduce((sum, entry) => sum + entry.count, 0);
  const maxLost = Math.max(...cleaned.map((entry) => entry.count));

  const lostReasons = cleaned
    .sort((a, b) => b.count - a.count)
    .map((entry, index) => {
      const percent = safeDivide(entry.count, totalLost);
      return {
        label: entry.label,
        count: entry.count,
        value: `${formatNumber(entry.count)} (${formatNumber(percent * 100, 0)}%)`,
        width: `${Math.round(percent * 100)}%`,
        color: LOST_REASON_COLORS[index % LOST_REASON_COLORS.length],
        highlight: entry.count === maxLost && entry.count > 0
      };
    });

  return { lostReasons, totalLost };
};

const updateLostReasonSummary = (metrics, lostReasons, totalLost) => {
  if (!metrics?.summaryCards?.length || !lostReasons?.length) return;
  const topReason = lostReasons.find((reason) => reason.highlight) || lostReasons[0];
  if (!topReason) return;
  const card = metrics.summaryCards.find((entry) => entry.label === 'Top Verliesreden');
  if (!card) return;
  card.value = topReason.label;
  card.detail = `${formatNumber(safeDivide(topReason.count, totalLost) * 100, 0)}% van verloren leads`;
};

const applyLiveOverrides = (metrics, range) => {
  if (!metrics?.funnelMetrics?.length) return metrics;

  const key = buildRangeKey(range);
  const getCard = (label) => metrics.funnelMetrics.find((card) => card.label === label);
  const totalLeads = getCard('Totaal Leads');
  const totalAppointments = getCard('Totaal Afspraken');
  const cancelledCard = getCard('Cancelled');
  const noShowCard = getCard('No-Show');
  const conversionCard = getCard('Lead -> Afspraak');

  if (!supabase) {
    if (totalLeads) totalLeads.isMock = true;
    return metrics;
  }

  if (liveState.opportunities.rangeKey !== key && liveState.appointments.rangeKey !== key) {
    if (totalLeads) totalLeads.isMock = true;
    if (totalAppointments) totalAppointments.isMock = true;
    const confirmedCard = metrics.funnelMetrics.find((card) => card.label === 'Confirmed');
    if (confirmedCard) confirmedCard.isMock = true;
    if (cancelledCard) cancelledCard.isMock = true;
    if (noShowCard) noShowCard.isMock = true;
    if (conversionCard) conversionCard.isMock = true;
    return metrics;
  }

  if (liveState.opportunities.status === 'ready') {
    if (totalLeads) {
      const leadCount = liveState.opportunities.count ?? 0;
      totalLeads.value = formatNumber(leadCount);
      totalLeads.rawValue = leadCount;
      totalLeads.isMock = false;
    }
  } else if (liveState.opportunities.status === 'loading') {
    if (totalLeads) {
      totalLeads.value = '...';
      totalLeads.rawValue = null;
      totalLeads.isMock = false;
    }
  } else {
    if (totalLeads) totalLeads.isMock = true;
  }

  if (liveState.appointments.status === 'ready') {
    const counts = liveState.appointments.counts || { total: 0, cancelled: 0, confirmed: 0, noShow: 0 };
    if (totalAppointments) {
      totalAppointments.value = formatNumber(counts.total);
      totalAppointments.rawValue = counts.total;
      totalAppointments.isMock = false;
    }
    const confirmedCard = metrics.funnelMetrics.find((card) => card.label === 'Confirmed');
    if (confirmedCard) {
      confirmedCard.value = formatNumber(counts.confirmed);
      confirmedCard.rawValue = counts.confirmed;
      confirmedCard.isMock = false;
    }
    if (cancelledCard) {
      cancelledCard.value = formatNumber(counts.cancelled);
      cancelledCard.rawValue = counts.cancelled;
      cancelledCard.isMock = false;
    }
    if (noShowCard) {
      noShowCard.value = formatNumber(counts.noShow);
      noShowCard.rawValue = counts.noShow;
      noShowCard.isMock = false;
    }
  } else if (liveState.appointments.status === 'loading') {
    if (totalAppointments) {
      totalAppointments.value = '...';
      totalAppointments.rawValue = null;
      totalAppointments.isMock = false;
    }
    const confirmedCard = metrics.funnelMetrics.find((card) => card.label === 'Confirmed');
    if (confirmedCard) {
      confirmedCard.value = '...';
      confirmedCard.rawValue = null;
      confirmedCard.isMock = false;
    }
    if (cancelledCard) {
      cancelledCard.value = '...';
      cancelledCard.rawValue = null;
      cancelledCard.isMock = false;
    }
    if (noShowCard) {
      noShowCard.value = '...';
      noShowCard.rawValue = null;
      noShowCard.isMock = false;
    }
  }

  if (conversionCard) {
    const leadsLive = liveState.opportunities.status === 'ready' ? liveState.opportunities.count ?? 0 : null;
    const apptLive =
      liveState.appointments.status === 'ready' ? liveState.appointments.counts?.total ?? 0 : null;
    if (leadsLive !== null && apptLive !== null) {
      conversionCard.value = formatPercent(safeDivide(apptLive, leadsLive), 1);
      conversionCard.isMock = false;
    }
  }

  if (liveState.sourceBreakdown.status === 'ready' && Array.isArray(liveState.sourceBreakdown.rows)) {
    let liveRows = liveState.sourceBreakdown.rows.map((row) => {
      const leads = Number(row.leads ?? 0);
      const appointments = Number(row.appointments ?? 0);
      const confirmed = Number(row.appointments_confirmed ?? row.confirmed_appointments ?? 0);
      const noLeadInRange = Number(row.appointments_without_lead_in_range ?? 0);

      return {
        source: row.source ?? 'Onbekend',
        leads: formatNumber(leads),
        appointments: formatNumber(appointments),
        confirmed: formatNumber(confirmed),
        noLeadInRange: formatNumber(noLeadInRange),
        plan: formatPercent(safeDivide(appointments, leads), 1),
        cost: '--',
        rawLeads: leads,
        rawAppointments: appointments,
        rawConfirmedAppointments: confirmed,
        rawNoLeadInRange: noLeadInRange
      };
    });

    if (liveState.spendBySource.status === 'ready') {
      liveRows = applySourceSpendToSourceRows(liveRows, liveState.spendBySource.totals);
    }

    metrics.sourceRows = liveRows.length ? liveRows : metrics.sourceRows;
    metrics.sourceRowsLive = liveRows.length > 0;
  }

  if (liveState.hookPerformance.status === 'ready' && Array.isArray(liveState.hookPerformance.rows)) {
    const spendTotals =
      liveState.spendBySource.status === 'ready' ? liveState.spendBySource.totals : null;
    const hookMetrics = buildHookMetricsFromLive(liveState.hookPerformance.rows, spendTotals);
    if (hookMetrics) {
      metrics.hookHighlights = hookMetrics.hookHighlights;
      metrics.hookCards = hookMetrics.hookCards;
      metrics.hookPerformanceLive = true;
    }
  }

  if (liveState.lostReasons.status === 'ready' && Array.isArray(liveState.lostReasons.rows)) {
    const lostMetrics = buildLostReasonsFromLive(liveState.lostReasons.rows);
    if (lostMetrics) {
      metrics.lostReasons = lostMetrics.lostReasons;
      metrics.totalLost = lostMetrics.totalLost;
      metrics.lostReasonsLive = true;
      updateLostReasonSummary(metrics, lostMetrics.lostReasons, lostMetrics.totalLost);
    }
  }

  if (liveState.finance.status === 'ready') {
    const totals = liveState.finance.totals || {};
    const spend = Number(totals.total_spend ?? 0);
    const leads = Number(totals.total_leads ?? 0);
    const costPerLead = leads > 0 ? spend / leads : Number.NaN;
    metrics.financeMetrics = [
      {
        label: 'Totale Leadkosten',
        value: formatCurrency(spend, 0),
        icon: icons.dollar('lucide lucide-dollar-sign w-4 h-4 text-primary'),
        className: '',
        isMock: false
      },
      {
        label: 'Kost per Lead',
        value: formatOptionalCurrency(costPerLead, 2),
        icon: icons.chartColumn('lucide lucide-chart-column w-4 h-4 text-primary'),
        className: '',
        isMock: false
      }
    ];
  } else if (liveState.finance.status === 'loading') {
    metrics.financeMetrics = [
      {
        label: 'Totale Leadkosten',
        value: '...',
        icon: icons.dollar('lucide lucide-dollar-sign w-4 h-4 text-primary'),
        className: '',
        isMock: false
      },
      {
        label: 'Kost per Lead',
        value: '...',
        icon: icons.chartColumn('lucide lucide-chart-column w-4 h-4 text-primary'),
        className: '',
        isMock: false
      }
    ];
  }

  return metrics;
};
const renderNavLinks = navLinks
  .map((item) =>
    `<li>
      <a class="nav-link${item.active ? ' active' : ''}" href="${item.href}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    </li>`
  )
  .join('');

const renderKpiCards = (cards) =>
  cards
    .map((card) => {
      const canDrill = Boolean(card.drilldown) && card.isMock === false && Number(card.rawValue) > 0;
      const valueMarkup = renderDrilldownValue({
        value: card.value,
        kind: card.drilldown?.kind,
        source: card.drilldown?.source,
        label: card.drilldown?.label || card.label,
        enabled: canDrill,
        className: 'metric-value mt-2',
        fallbackTag: 'p'
      });

      return `<div class="kpi-card animate-slide-up ${card.className}">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="metric-label truncate">${card.label}</p>
                ${icons.info('lucide lucide-info w-3 h-3 text-muted-foreground hover:text-foreground cursor-help flex-shrink-0')}
                ${card.isMock === false ? '' : mockBadge}
              </div>
              ${valueMarkup}
            </div>
            <div class="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              ${card.icon}
            </div>
          </div>
        </div>`;
    })
    .join('');

const renderSourceRows = (rows, isLive) =>
  rows
    .map((row) => {
      const sourceText = row.source ? escapeHtml(row.source) : 'Onbekend';
      const leadsValue = renderDrilldownValue({
        value: row.leads,
        kind: 'leads',
        source: row.source,
        label: 'Leads (opportunities)',
        enabled: isLive && Number(row.rawLeads) > 0,
        className: 'drilldown-cell'
      });
      const appointmentsValue = renderDrilldownValue({
        value: row.appointments,
        kind: 'appointments',
        source: row.source,
        label: 'Afspraken',
        enabled: isLive && Number(row.rawAppointments) > 0,
        className: 'drilldown-cell'
      });
      const confirmedValue = renderDrilldownValue({
        value: row.confirmed,
        kind: 'appointments_confirmed',
        source: row.source,
        label: 'Confirmed afspraken',
        enabled: isLive && Number(row.rawConfirmedAppointments) > 0,
        className: 'drilldown-cell'
      });
      const noLeadValue = renderDrilldownValue({
        value: row.noLeadInRange,
        kind: 'appointments_without_lead_in_range',
        source: row.source,
        label: 'Afspraken zonder lead in periode',
        enabled: isLive && Number(row.rawNoLeadInRange) > 0,
        className: 'drilldown-cell'
      });

      return `<tr class="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">${sourceText}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${leadsValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${appointmentsValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${confirmedValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${noLeadValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${row.plan}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${row.cost}</td>
        </tr>`;
    })
    .join('');

const renderDrilldownRows = (rows) =>
  rows
    .map((row) => {
      const occurred = formatDateTime(row.occurred_at);
      const contactName = row.contact_name ? escapeHtml(row.contact_name) : '—';
      const contactEmail = row.contact_email ? escapeHtml(row.contact_email) : '—';
      const source = row.source ? escapeHtml(row.source) : 'Onbekend';
      const status = row.status ? escapeHtml(row.status) : '—';
      const type = row.record_type ? escapeHtml(row.record_type) : 'record';

      return `<tr class="border-b last:border-0">
          <td class="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">${type}</td>
          <td class="px-3 py-2 text-sm text-foreground">${occurred}</td>
          <td class="px-3 py-2 text-sm text-foreground">${contactName}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${contactEmail}</td>
          <td class="px-3 py-2 text-sm text-foreground">${source}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${status}</td>
        </tr>`;
    })
    .join('');

const renderDrilldownModal = () => {
  if (!drilldownState.open) return '';

  const range = drilldownState.range;
  const rangeLabel = range ? `${formatDisplayDate(range.start)} → ${formatDisplayDate(range.end)}` : '';
  const sourceLabel = getDrilldownFilterLabel(drilldownState.kind, drilldownState.source);
  const subtitle = [rangeLabel, sourceLabel].filter(Boolean).join(' · ');

  let body = '';
  if (drilldownState.status === 'loading') {
    body = '<div class="drilldown-loading">Records laden...</div>';
  } else if (drilldownState.status === 'error') {
    body = `<div class="drilldown-error">${escapeHtml(drilldownState.errorMessage || 'Onbekende fout')}</div>`;
  } else if (!drilldownState.rows?.length) {
    body = '<div class="drilldown-empty">Geen records gevonden voor deze selectie.</div>';
  } else {
    body = `
      <div class="drilldown-table-wrapper">
        <table class="drilldown-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Datum</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${renderDrilldownRows(drilldownState.rows)}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <div class="drilldown-modal open">
      <div class="drilldown-overlay" data-drilldown-close></div>
      <div class="drilldown-panel" role="dialog" aria-label="Records">
        <div class="drilldown-header">
          <div>
            <h3 class="drilldown-title">${escapeHtml(drilldownState.title || 'Records')}</h3>
            ${subtitle ? `<p class="drilldown-subtitle">${subtitle}</p>` : ''}
          </div>
          <button type="button" class="drilldown-close" data-drilldown-close>Sluit</button>
        </div>
        ${body}
      </div>
    </div>
  `;
};

const renderLostReasons = (reasons, isLive) =>
  reasons
    .map((reason) => {
      const valueMarkup = renderDrilldownValue({
        value: reason.value,
        kind: 'lost_reason_leads',
        source: reason.label,
        label: 'Verloren leads',
        enabled: isLive && Number(reason.count) > 0,
        className: 'text-sm font-medium text-foreground w-16 text-right inline-block',
        fallbackTag: 'span'
      });

      return `<div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="w-3 h-3 rounded-full" style="background-color: ${reason.color};"></div>
            <span class="text-sm text-foreground">${reason.label}</span>
            ${
              reason.highlight
                ? '<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 text-xs">Top reden</div>'
                : ''
            }
          </div>
          <div class="flex items-center gap-4">
            <div class="w-24 h-2 bg-secondary rounded-full overflow-hidden">
              <div class="h-full rounded-full" style="width: ${reason.width}; background-color: ${reason.color};"></div>
            </div>
            ${valueMarkup}
          </div>
        </div>`;
    })
    .join('');

const renderLostReasonsChart = (reasons) => {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return '<p class="text-sm text-muted-foreground">Geen data beschikbaar.</p>';
  }

  const total = reasons.reduce((sum, reason) => sum + (Number(reason.count) || 0), 0);
  if (!total) {
    return '<p class="text-sm text-muted-foreground">Geen verloren leads in deze periode.</p>';
  }

  const defaultIndex = Math.max(0, reasons.findIndex((reason) => reason.highlight));
  const defaultReason = reasons[defaultIndex] || reasons[0];
  const defaultPercent = safeDivide(defaultReason?.count ?? 0, total) * 100;

  let cumulative = 0;
  const gradientStops = reasons.map((reason) => {
    const count = Number(reason.count) || 0;
    const start = (cumulative / total) * 100;
    cumulative += count;
    const end = (cumulative / total) * 100;
    return `${reason.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  const chartStyle = `background: conic-gradient(${gradientStops.join(', ')});`;

  const legend = reasons
    .map((reason, index) => {
      const percent = safeDivide(reason.count, total) * 100;
      const isDefault = index === defaultIndex;
      return `
        <button
          type="button"
          class="lost-reason-legend-item${isDefault ? ' is-default is-active' : ''}"
          data-lost-reason-item
          data-index="${index}"
          data-count="${reason.count}"
          data-percent="${percent.toFixed(3)}"
          data-color="${escapeHtml(reason.color)}"
          aria-pressed="${isDefault ? 'true' : 'false'}"
          title="${escapeHtml(reason.label)} - ${formatNumber(percent, 1)}%"
        >
          <span class="lost-reason-dot" style="background-color: ${reason.color};"></span>
          <span class="lost-reason-name" data-lost-label>${escapeHtml(reason.label)}</span>
          <span class="lost-reason-meta">${formatNumber(percent, 1)}%</span>
        </button>
      `;
    })
    .join('');

  return `
    <div class="lost-reason-chart" data-lost-reason-chart data-default-index="${defaultIndex}">
      <div class="lost-reason-donut" data-lost-donut style="${chartStyle}">
        <div class="lost-reason-center">
          <p class="lost-reason-kicker">Verloren leads</p>
          <p class="lost-reason-total" data-lost-total>${formatNumber(total)}</p>
          <p class="lost-reason-active" data-lost-active>${escapeHtml(defaultReason?.label ?? 'Onbekend')}</p>
          <p class="lost-reason-percent" data-lost-percent>${formatNumber(defaultPercent, 1)}%</p>
        </div>
      </div>
      <div class="lost-reason-legend">
        ${legend}
      </div>
    </div>
  `;
};

const getLostReasonTip = (reasons) => {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return 'Vul een verliesreden in op je lead om betere inzichten te krijgen.';
  }
  const topReason = reasons.find((reason) => reason.highlight) || reasons[0];
  const labelRaw = topReason?.label ? String(topReason.label) : '';
  const label = labelRaw ? escapeHtml(labelRaw) : 'Onbekend';
  const normalized = labelRaw.trim().toLowerCase();
  if (!topReason || !Number.isFinite(topReason.count) || topReason.count <= 0) {
    return 'Vul een verliesreden in op je lead om betere inzichten te krijgen.';
  }
  if (!labelRaw || normalized === 'geen data' || normalized === 'onbekend') {
    return 'Vul een verliesreden in op je lead om betere inzichten te krijgen.';
  }
  return `"${label}" is je grootste blocker. Overweeg een gratis waardebepaling of exclusieve verkooptips te delen.`;
};

const bindLostReasonCharts = () => {
  document.querySelectorAll('[data-lost-reason-chart]').forEach((chart) => {
    const items = Array.from(chart.querySelectorAll('[data-lost-reason-item]'));
    if (!items.length) return;

    const donut = chart.querySelector('[data-lost-donut]');
    const activeLabel = chart.querySelector('[data-lost-active]');
    const activePercent = chart.querySelector('[data-lost-percent]');
    const defaultIndex = Number(chart.getAttribute('data-default-index') || 0);
    const defaultItem = items[defaultIndex] || items[0];
    let lockedItem = null;

    const toRgba = (color, alpha) => {
      if (typeof color !== 'string') return '';
      if (color.startsWith('rgb(')) {
        return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
      }
      return color;
    };

    const setActive = (item) => {
      if (!item) return;
      const labelNode = item.querySelector('[data-lost-label]');
      const labelText = labelNode ? labelNode.textContent.trim() : 'Onbekend';
      const percentRaw = Number(item.getAttribute('data-percent') || 0);

      if (activeLabel) activeLabel.textContent = labelText || 'Onbekend';
      if (activePercent) activePercent.textContent = `${formatNumber(percentRaw, 1)}%`;

      items.forEach((entry) => {
        const isActive = entry === item;
        entry.classList.toggle('is-active', isActive);
        entry.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      if (donut) {
        const color = item.getAttribute('data-color');
        if (color) {
          donut.style.boxShadow = `0 0 0 6px ${toRgba(color, 0.2)}`;
          donut.style.transform = 'scale(1.01)';
        } else {
          donut.style.boxShadow = '';
          donut.style.transform = '';
        }
      }
    };

    const reset = () => {
      lockedItem = null;
      setActive(defaultItem);
    };

    setActive(defaultItem);

    items.forEach((item) => {
      item.addEventListener('mouseenter', () => {
        if (lockedItem) return;
        setActive(item);
      });
      item.addEventListener('focus', () => {
        if (lockedItem) return;
        setActive(item);
      });
      item.addEventListener('mouseleave', () => {
        if (lockedItem) return;
        setActive(defaultItem);
      });
      item.addEventListener('blur', () => {
        if (lockedItem) return;
        setActive(defaultItem);
      });
      item.addEventListener('click', () => {
        if (lockedItem === item) {
          reset();
        } else {
          lockedItem = item;
          setActive(item);
        }
      });
    });
  });
};

const renderSummaryCards = (cards) =>
  cards
    .map(
      (card) =>
        `<div>
          <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
            ${card.icon}
          </div>
          <p class="text-sm text-muted-foreground mb-1 flex items-center justify-center gap-2">
            <span>${card.label}</span>
            ${mockBadge}
          </p>
          <p class="text-2xl font-bold text-foreground">${card.value}</p>
          <p class="text-sm text-primary">${card.detail}</p>
        </div>`
    )
    .join('');

const renderHookBadges = (badges) => {
  const items = [];
  if (badges.bestConversion) {
    items.push({ icon: icons.trophy('lucide lucide-trophy w-3 h-3'), label: 'Beste Conversie', className: 'bg-primary text-primary-foreground', hoverClass: 'hover:bg-primary/80' });
  }
  if (badges.cheapest) {
    items.push({ icon: icons.zap('lucide lucide-zap w-3 h-3'), label: 'Goedkoopste Leads', className: 'bg-primary text-primary-foreground', hoverClass: 'hover:bg-primary/80' });
  }
  if (badges.mostVolume) {
    items.push({ icon: icons.star('lucide lucide-star w-3 h-3'), label: 'Meeste Volume', className: 'bg-secondary text-secondary-foreground', hoverClass: 'hover:bg-secondary/80' });
  }
  if (badges.lowestConversion) {
    items.push({ icon: icons.trendingDown('lucide lucide-trending-down w-3 h-3'), label: 'Laagste Conversie', className: 'bg-destructive text-destructive-foreground', hoverClass: 'hover:bg-destructive/80' });
  }
  if (badges.mostExpensive) {
    items.push({ icon: icons.dollar('lucide lucide-dollar-sign w-3 h-3'), label: 'Duurste Leads', className: 'bg-destructive text-destructive-foreground', hoverClass: 'hover:bg-destructive/80' });
  }

  return items
    .map(
      (item) =>
        `<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${item.className} ${item.hoverClass} text-xs gap-1">
          ${item.icon}
          ${item.label}
        </div>`
    )
    .join('');
};

const renderHookHighlights = (best, worst) => `
  <div class="rounded-lg border bg-card text-card-foreground border-l-4 shadow-sm border-transparent" style="background-color: rgb(27, 156, 84);">
    <div class="p-6 pt-5 pb-5">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgba(255, 255, 255, 0.2);">
          ${icons.trophy('lucide lucide-trophy w-6 h-6 text-white')}
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-white">${best.hook}</p>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-sm font-bold text-white">${formatPercent(best.conversion, 1)} conversie</span>
            <span class="text-sm text-white/80">${formatOptionalCurrency(best.costPerLead, 2, '/lead')}</span>
          </div>
          <div class="mt-3 p-2 rounded-md" style="background-color: rgba(255, 255, 255, 0.15);">
            <p class="text-sm text-white/90">Tip: Schaal dit budget op voor maximale ROI</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="rounded-lg border text-card-foreground border-l-4 bg-[#FEF6DC] shadow-sm border-amber-300">
    <div class="p-6 pt-5 pb-5">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-lg flex items-center justify-center" style="background-color: rgb(242, 185, 45);">
          ${icons.thumbsDown('lucide lucide-thumbs-down w-6 h-6 text-white')}
        </div>
        <div class="flex-1">
          <p class="text-lg font-bold text-gray-900">${worst.hook}</p>
          <div class="flex items-center gap-3 mt-2">
            <span class="text-sm font-bold text-gray-900">${formatPercent(worst.conversion, 1)} conversie</span>
            <span class="text-sm text-gray-700">${formatOptionalCurrency(worst.costPerLead, 2, '/lead')}</span>
          </div>
          <div class="mt-3 p-2 bg-amber-100/70 rounded-md">
            <p class="text-sm text-gray-900">Tip: Test nieuwe creatives of pauzeer deze campagne</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderHookCards = (cards, isLive) =>
  cards
    .map((card, index) => {
      const leadsValue = renderDrilldownValue({
        value: card.leads,
        kind: 'hook_leads',
        source: card.label,
        label: 'Leads',
        enabled: isLive && Number(card.rawLeads) > 0,
        className: 'text-lg font-bold block',
        fallbackTag: 'p'
      });

      const appointmentsValue = renderDrilldownValue({
        value: card.appointments,
        kind: 'hook_appointments',
        source: card.label,
        label: 'Afspraken',
        enabled: isLive && Number(card.rawAppointments) > 0,
        className: 'text-lg font-bold text-amber-700 block',
        fallbackTag: 'p'
      });

      return `<div class="rounded-lg border bg-card text-card-foreground shadow-sm relative overflow-hidden">
          ${
            index === 0
              ? `<div class="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div class="absolute transform rotate-45 text-white text-xs font-bold py-1 right-[-35px] top-[15px] w-[120px] text-center" style="background-color: rgb(27, 156, 84);">#1</div>
                </div>`
              : ''
          }
          <div class="flex flex-col space-y-1.5 p-6 pb-2">
            <div class="flex items-start justify-between">
              <h3 class="tracking-tight text-base font-semibold">${card.label}</h3>
            </div>
            <div class="flex flex-wrap gap-1 mt-2">
              ${renderHookBadges(card.badges)}
            </div>
          </div>
          <div class="p-6 pt-0">
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p class="text-xs text-muted-foreground">Leads</p>
                ${leadsValue}
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Afspraken</p>
                ${appointmentsValue}
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Conversie</p>
                <p class="text-lg font-bold text-amber-700">${card.conversion}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Kost/Lead</p>
                <p class="text-lg font-bold">${card.costPerLead}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Kost/Call</p>
                <p class="text-lg font-bold text-amber-700">${card.costPerCall}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Spend</p>
                <p class="text-lg font-bold">${card.spend}</p>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join('');

const root = document.getElementById('root');

const buildMarkup = (range) => {
  const metrics = applyLiveOverrides(computeMetrics(range), range);
  const debugInfo = getOpportunityDebug(range);

  return `
    <div role="region" aria-label="Notifications (F8)" tabindex="-1" style="pointer-events: none;">
      <ol tabindex="-1" class="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"></ol>
    </div>
    <section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false"></section>
    <div class="flex min-h-screen w-full bg-background">
      <div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden sidebar-overlay" data-sidebar-close></div>
      <aside class="fixed lg:sticky lg:top-0 z-50 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col overflow-hidden w-64 translate-x-0 sidebar-panel">
        <div class="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div class="flex items-center gap-3">
            <div class="flex items-center rounded-lg bg-white/90 px-3 py-1.5 shadow-sm ring-1 ring-black/5">
              <img src="/assets/logos/placeholder-logo.svg" alt="Company logo" class="h-9 w-auto object-contain" />
            </div>
          </div>
          <button class="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hidden lg:flex" data-sidebar-toggle>
            ${icons.chevronLeft('lucide lucide-chevron-left w-4 h-4 transition-transform')}
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3">
          <div class="mb-6">
            <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Dashboards</h3>
            <ul class="space-y-1">
              ${renderNavLinks}
            </ul>
          </div>
        </nav>
        <div class="p-4 border-t border-sidebar-border">
          <p class="text-xs text-sidebar-foreground/60 text-center">Dashboard Template</p>
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-border bg-card shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div class="flex items-center gap-4">
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 lg:hidden hover:bg-accent" aria-label="Sluit menu" data-sidebar-toggle>
              ${icons.menu('lucide lucide-menu h-5 w-5')}
            </button>
            <div class="flex items-center gap-3">
              <div class="flex items-center rounded-xl bg-white/80 px-3.5 py-2 shadow-sm ring-1 ring-black/5">
                <img src="/assets/logos/placeholder-logo.svg" alt="Company logo" class="h-10 w-auto object-contain" />
              </div>
              <div class="hidden sm:block">
                <div class="text-lg font-bold text-primary tracking-tight">Your Company</div>
                <p class="text-xs text-muted-foreground -mt-0.5">Performance Dashboard</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/20">
              <div class="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
              <div class="flex flex-col leading-tight">
                <span class="text-xs font-semibold text-secondary">Live Data</span>
                <span class="text-[10px] text-muted-foreground">
                  ${
                    liveState.sync.status === 'loading'
                      ? 'Laatste sync: laden...'
                      : liveState.sync.status === 'ready'
                        ? formatSyncTimestamp(liveState.sync.timestamp)
                        : 'Laatste sync: onbekend'
                  }
                </span>
              </div>
            </div>
            ${
              adminModeEnabled
                ? `<button class="admin-trigger" type="button" data-admin-open>Setup</button>`
                : ''
            }
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 hover:bg-accent" title="Herlaad pagina" data-action="refresh">
              ${icons.refresh('lucide lucide-refresh-cw h-4 w-4')}
            </button>
          </div>
        </header>
        <main class="flex-1 p-6 overflow-auto">
          <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
            <div>
              <h1 class="text-2xl font-bold text-foreground tracking-tight">Your Company</h1>
              <p class="text-sm text-muted-foreground">Performance Dashboard - Leads, Afspraken &amp; ROI</p>
            </div>
            <div class="date-picker relative flex items-center gap-2 flex-wrap">
              <button class="date-trigger${pickerState.selecting === 'start' && pickerState.open ? ' active' : ''}" type="button" data-date-trigger="start">
                ${icons.calendar('lucide lucide-calendar h-4 w-4')}
                ${formatDisplayDate(range.start)}
              </button>
              <span class="text-muted-foreground">-></span>
              <button class="date-trigger${pickerState.selecting === 'end' && pickerState.open ? ' active' : ''}" type="button" data-date-trigger="end">
                ${icons.calendar('lucide lucide-calendar h-4 w-4')}
                ${formatDisplayDate(range.end)}
              </button>
              ${renderDatePicker(range)}
            </div>
          </div>
          ${
            debugInfo
              ? `<div class="mb-2 rounded-lg border px-4 py-2 text-xs font-medium ${
                  debugInfo.tone === 'danger'
                    ? 'bg-destructive/10 border-destructive/30 text-destructive'
                    : debugInfo.tone === 'warning'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                      : 'bg-muted/50 border-border text-muted-foreground'
                }">${debugInfo.text}</div>`
              : ''
          }
          ${renderDebugPanel(range)}
          <div class="mt-6 space-y-8">
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.users('lucide lucide-users w-5 h-5 text-primary')}
                Funnel Metrics
                ${metrics.funnelMetrics.some((card) => card.isMock !== false) ? mockBadge : ''}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Overzicht van leads en afspraken</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                ${renderKpiCards(metrics.funnelMetrics)}
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.chartColumn('lucide lucide-chart-column w-5 h-5 text-primary')}
                Source Breakdown
                ${metrics.sourceRowsLive ? '' : mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Prestaties per leadgenerator - Leads = opportunities in periode - extra kolom = afspraken zonder lead in periode</p>
              <div class="overflow-x-auto">
                <div class="relative w-full overflow-auto">
                  <table class="w-full caption-bottom text-sm">
                    <thead class="[&_tr]:border-b">
                      <tr class="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
                        <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Bron</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Leads</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Appointments</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Confirmed</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Afspraken zonder lead in periode</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Inplan %</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Cost per Afspraak</th>
                      </tr>
                    </thead>
                    <tbody class="[&_tr:last-child]:border-0">
                      ${renderSourceRows(metrics.sourceRows, metrics.sourceRowsLive)}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.dollar('lucide lucide-dollar-sign w-5 h-5 text-primary')}
                Financiele Metrics
                ${metrics.financeMetrics.some((card) => card.isMock === false) ? '' : mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Totale leadkosten en kost per lead</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                ${renderKpiCards(metrics.financeMetrics)}
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.chartColumn('lucide lucide-chart-column w-5 h-5 text-primary')}
                Ad Hook Performance
                ${metrics.hookPerformanceLive ? '' : mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Vergelijk de prestaties van je advertentie hooks</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                ${renderHookHighlights(metrics.hookHighlights.best, metrics.hookHighlights.worst)}
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                ${renderHookCards(metrics.hookCards, metrics.hookPerformanceLive)}
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-orange-500')}
                Analyse &amp; Inzichten
                ${metrics.lostReasonsLive ? '' : mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Verloren leads en verdeling per reden</p>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="font-semibold tracking-tight text-lg flex items-center gap-2">
                      ${icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-orange-500')}
                      Verloren Leads - Redenen
                      ${metrics.lostReasonsLive ? '' : mockBadge}
                    </h3>
                    <p class="text-sm text-muted-foreground">Analyseer waarom leads niet converteren</p>
                  </div>
                  <div class="p-6 pt-0">
                    <div class="space-y-3">
                      ${renderLostReasons(metrics.lostReasons, metrics.lostReasonsLive)}
                    </div>
                    <div class="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p class="text-sm text-amber-600 dark:text-amber-400"><strong>Tip:</strong> ${getLostReasonTip(metrics.lostReasons)}</p>
                    </div>
                  </div>
                </div>
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="font-semibold tracking-tight text-lg flex items-center gap-2">
                      Verdeling Verloren Leads
                      ${metrics.lostReasonsLive ? '' : mockBadge}
                    </h3>
                  </div>
                  <div class="p-6 pt-0">
                    <div class="h-64 flex items-center justify-center">
                      ${renderLostReasonsChart(metrics.lostReasons)}
                    </div>
                  </div>
                </div>
              </div>
              </section>
            </div>
        </main>
        <footer class="h-12 border-t border-border bg-card/50 flex items-center justify-center px-6">
          <p class="text-xs text-muted-foreground font-medium">(c) 2026 Your Company - Performance Dashboard</p>
        </footer>
      </div>
    </div>
    ${renderDrilldownModal()}
    ${renderAdminModal()}
  `;
};

const renderApp = () => {
  if (!root) return;
  root.innerHTML = buildMarkup(dateRange);
  bindInteractions();
  ensureOpportunityCount(dateRange);
  ensureAppointmentCounts(dateRange);
  ensureLatestSync();
  ensureSourceBreakdown(dateRange);
  ensureHookPerformance(dateRange);
  ensureFinanceSummary(dateRange);
  ensureSpendBySource(dateRange);
  ensureLostReasons(dateRange);
};

const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
const openSidebar = () => {
  if (!isDesktop()) {
    document.body.dataset.sidebar = 'open';
  }
};
const closeSidebar = () => {
  delete document.body.dataset.sidebar;
};
const toggleSidebar = () => {
  if (isDesktop()) return;
  if (document.body.dataset.sidebar === 'open') {
    closeSidebar();
  } else {
    openSidebar();
  }
};

const bindInteractions = () => {
  document.querySelectorAll('[data-sidebar-toggle]').forEach((button) => {
    button.addEventListener('click', toggleSidebar);
  });

  const sidebarOverlay = document.querySelector('[data-sidebar-close]');
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  const refresh = document.querySelector('[data-action="refresh"]');
  if (refresh) {
    refresh.addEventListener('click', () => window.location.reload());
  }

  document.querySelectorAll('[data-drill-kind]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.disabled) return;
      const kind = button.getAttribute('data-drill-kind');
      const source = button.getAttribute('data-drill-source');
      const label = button.getAttribute('data-drill-label');
      openDrilldown({ kind, source, label, range: dateRange });
    });
  });

  document.querySelectorAll('[data-drilldown-close]').forEach((button) => {
    button.addEventListener('click', () => {
      closeDrilldown();
      renderApp();
    });
  });

  if (adminModeEnabled) {
    document.querySelectorAll('[data-admin-open]').forEach((button) => {
      button.addEventListener('click', () => {
        adminState.open = true;
        adminState.status = 'idle';
        adminState.message = '';
        adminState.auth.message = '';
        adminState.auth.status = 'idle';
        adminState.loading = false;
        renderApp();
        if (authSession) {
          loadAdminIntegration();
          loadSpendMapping();
        }
      });
    });

    document.querySelectorAll('[data-admin-close]').forEach((button) => {
      button.addEventListener('click', () => {
        adminState.open = false;
        adminState.loading = false;
        renderApp();
      });
    });

    const locationInput = document.querySelector('[data-admin-location]');
    if (locationInput) {
      locationInput.addEventListener('input', (event) => {
        adminState.form.locationId = event.target.value;
      });
    }

    const tokenInput = document.querySelector('[data-admin-token]');
    if (tokenInput) {
      tokenInput.addEventListener('input', (event) => {
        adminState.form.token = event.target.value;
      });
    }

    const activeInput = document.querySelector('[data-admin-active]');
    if (activeInput) {
      activeInput.addEventListener('change', (event) => {
        adminState.form.active = event.target.checked;
      });
    }

    const emailInput = document.querySelector('[data-admin-email]');
    if (emailInput) {
      emailInput.addEventListener('input', (event) => {
        adminState.auth.email = event.target.value;
      });
    }

    const loginForm = document.querySelector('[data-admin-login]');
    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        adminState.auth.status = 'sending';
        adminState.auth.message = '';
        renderApp();

        if (!supabase) {
          adminState.auth.status = 'error';
          adminState.auth.message = 'Supabase is niet geconfigureerd.';
          renderApp();
          return;
        }

        const email = adminState.auth.email.trim();
        if (!email) {
          adminState.auth.status = 'error';
          adminState.auth.message = 'Vul een geldig emailadres in.';
          renderApp();
          return;
        }

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin }
        });

        if (error) {
          adminState.auth.status = 'error';
          adminState.auth.message = error.message;
        } else {
          adminState.auth.status = 'success';
          adminState.auth.message = 'Check je inbox voor de magic link.';
        }

        renderApp();
      });
    }

    const form = document.querySelector('[data-admin-form]');
    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        adminState.status = 'saving';
        adminState.message = '';
        renderApp();

        if (!adminEndpoint) {
          adminState.status = 'error';
          adminState.message = 'Supabase URL ontbreekt.';
          renderApp();
          return;
        }

        if (!supabase) {
          adminState.status = 'error';
          adminState.message = 'Supabase is niet geconfigureerd.';
          renderApp();
          return;
        }

        const locationId = adminState.form.locationId.trim();
        if (!locationId) {
          adminState.status = 'error';
          adminState.message = 'Location ID is verplicht.';
          renderApp();
          return;
        }

        try {
          const token = await getAuthToken();
          if (!token) {
            adminState.status = 'error';
            adminState.message = 'Log in om de integratie op te slaan.';
            renderApp();
            return;
          }

          const response = await fetch(adminEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              apikey: supabaseKey
            },
            body: JSON.stringify({
              location_id: locationId,
              private_integration_token: adminState.form.token.trim(),
              active: adminState.form.active
            })
          });

          const result = await response.json();
          if (!response.ok) {
            throw new Error(result?.error || 'Onbekende fout');
          }

          adminState.status = 'success';
          adminState.message = 'Integratie opgeslagen in Supabase.';
          adminState.form.token = '';
          configState.locationId = locationId;
          configState.source = 'supabase';
          configState.status = 'ready';
          configState.errorMessage = '';
        } catch (error) {
          adminState.status = 'error';
          adminState.message = error instanceof Error ? error.message : 'Onbekende fout';
        }

        renderApp();
      });
    }

    const signOut = document.querySelector('[data-admin-signout]');
    if (signOut) {
      signOut.addEventListener('click', async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }
        adminState.open = false;
        adminState.loading = false;
        resetMappingState();
        renderApp();
      });
    }

    const mappingRefresh = document.querySelector('[data-map-refresh]');
    if (mappingRefresh) {
      mappingRefresh.addEventListener('click', () => {
        loadSpendMapping();
      });
    }

    const mappingSave = document.querySelector('[data-map-save]');
    if (mappingSave) {
      mappingSave.addEventListener('click', () => {
        saveSpendMapping();
      });
    }

    document.querySelectorAll('[data-map-key]').forEach((input) => {
      input.addEventListener('input', (event) => {
        setMappingValue(input.getAttribute('data-map-key'), event.target.value);
      });
    });
  }

  document.querySelectorAll('[data-date-trigger]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-date-trigger');
      if (pickerState.open && pickerState.selecting === mode) {
        pickerState.open = false;
        renderApp();
        return;
      }

      pickerState.open = true;
      pickerState.selecting = mode === 'end' ? 'end' : 'start';
      const nextMonth = (mode === 'end' ? dateRange.end : dateRange.start).slice(0, 7);
      pickerState.viewMonth = nextMonth;
      renderApp();
    });
  });

  document.querySelectorAll('[data-date-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      pickerState.selecting = button.getAttribute('data-date-mode');
      renderApp();
    });
  });

  document.querySelectorAll('[data-date-value]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-date-value');
      if (!value) return;

      if (pickerState.selecting === 'start') {
        let start = value;
        let end = dateRange.end;
        if (start > end) {
          [start, end] = [end, start];
        }
        dateRange = normalizeRange(start, end);
        pickerState.selecting = 'end';
      } else {
        let start = dateRange.start;
        let end = value;
        if (start > end) {
          [start, end] = [end, start];
        }
        dateRange = normalizeRange(start, end);
        pickerState.selecting = 'start';
        pickerState.open = false;
      }

      renderApp();
    });
  });

  const prevButton = document.querySelector('[data-month-prev]');
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      const nextMonth = shiftMonth(pickerState.viewMonth, -1);
      if (nextMonth < monthBounds.min) return;
      pickerState.viewMonth = nextMonth;
      renderApp();
    });
  }

  const nextButton = document.querySelector('[data-month-next]');
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      const nextMonth = shiftMonth(pickerState.viewMonth, 1);
      if (nextMonth > monthBounds.max) return;
      pickerState.viewMonth = nextMonth;
      renderApp();
    });
  }

  const dateOverlay = document.querySelector('[data-date-overlay]');
  if (dateOverlay) {
    dateOverlay.addEventListener('click', () => {
      pickerState.open = false;
      renderApp();
    });
  }

  const closeButton = document.querySelector('[data-date-close]');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      pickerState.open = false;
      renderApp();
    });
  }

  const clearButton = document.querySelector('[data-date-clear]');
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      dateRange = normalizeRange(DEFAULT_RANGE.start, DEFAULT_RANGE.end);
      pickerState.open = false;
      pickerState.selecting = 'start';
      pickerState.viewMonth = dateRange.start.slice(0, 7);
      renderApp();
    });
  }

  bindLostReasonCharts();
};

dateRange = normalizeRange(dateRange.start, dateRange.end);
initAuth();
loadLocationConfig();
renderApp();

const desktopQuery = window.matchMedia('(min-width: 1024px)');
desktopQuery.addEventListener('change', (event) => {
  if (event.matches) {
    closeSidebar();
  }
});




