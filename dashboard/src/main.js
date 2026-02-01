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
  { label: 'Sales Resultaten', href: '/sales-resultaten', icon: icons.target('lucide lucide-target w-5 h-5 flex-shrink-0'), active: false },
  { label: 'Call Center', href: '/call-center', icon: icons.headphones('lucide lucide-headphones w-5 h-5 flex-shrink-0'), active: false }
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

const DRILLDOWN_LABELS = {
  leads: 'Leads (opportunities)',
  appointments: 'Afspraken',
  appointments_without_lead_in_range: 'Afspraken zonder lead in periode',
  appointments_cancelled: 'Cancelled afspraken',
  appointments_confirmed: 'Confirmed afspraken',
  appointments_no_show: 'No-show afspraken',
  deals: 'Deals'
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
const DEBUG_ENABLED = true;

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
  }
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

  configState.status = 'loading';
  configState.errorMessage = '';

  const { data, error } = await supabase
    .from('dashboard_config')
    .select('location_id, hook_field_id, campaign_field_id, updated_at')
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
    .from('opportunities')
    .select('synced_at')
    .eq('location_id', activeLocationId)
    .order('synced_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await withTimeout(query, 12000, 'Supabase query timeout (sync).');
  if (error) throw error;
  return data?.synced_at ?? null;
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

const fetchDrilldownRecords = async ({ kind, source, range }) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

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

const buildDrilldownTitle = (kind, source, label) => {
  const base = label || DRILLDOWN_LABELS[kind] || 'Records';
  return source ? `${base} · ${source}` : base;
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
    drilldownState.status = 'ready';
    drilldownState.rows = Array.isArray(rows) ? rows : [];
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
    liveState.sourceBreakdown.rangeKey !== key
  ) {
    return null;
  }

  if (
    liveState.opportunities.status === 'loading' ||
    liveState.appointments.status === 'loading' ||
    liveState.sourceBreakdown.status === 'loading'
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
  const inFlight = liveState.opportunities.inFlight ? 'yes' : 'no';
  const count = liveState.opportunities.count;
  const errorMessage = liveState.opportunities.errorMessage;
  const rangeMatch = liveState.opportunities.rangeKey === key ? 'yes' : 'no';
  const sourceCount = Array.isArray(liveState.sourceBreakdown.rows) ? liveState.sourceBreakdown.rows.length : 0;

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
    `in_flight: ${inFlight}`,
    typeof count === 'number' ? `count: ${count}` : '',
    sourceCount ? `sources: ${sourceCount}` : '',
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
               </form>`
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
        acc.leads += entry.leads;
        acc.appointments += entry.appointments;
        acc.deals += entry.deals;
        acc.cost += entry.leads * entry.costPerLead;
        return acc;
      },
      { leads: 0, appointments: 0, deals: 0, cost: 0 }
    );

    return {
      source,
      leads: formatNumber(sourceTotals.leads),
      appointments: formatNumber(sourceTotals.appointments),
      noLeadInRange: formatNumber(0),
      plan: formatPercent(safeDivide(sourceTotals.appointments, sourceTotals.leads), 1),
      deals: formatNumber(sourceTotals.deals),
      toDeals: formatPercent(safeDivide(sourceTotals.deals, sourceTotals.leads), 1),
      cost: formatCurrency(safeDivide(sourceTotals.cost, sourceTotals.deals), 2),
      rawLeads: sourceTotals.leads,
      rawAppointments: sourceTotals.appointments,
      rawNoLeadInRange: 0,
      rawDeals: sourceTotals.deals
    };
  });

  const financeMetrics = [
    { label: 'Totale Leadkosten', value: formatCurrency(totals.cost, 0), icon: icons.dollar('lucide lucide-dollar-sign w-4 h-4 text-primary'), className: '' },
    { label: 'Kost per Afspraak', value: formatCurrency(safeDivide(totals.cost, totals.appointments), 0), icon: icons.chartColumn('lucide lucide-chart-column w-4 h-4 text-primary'), className: '' },
    { label: 'Totale Omzet', value: formatCurrency(totals.revenue, 0), icon: icons.trendingUp('lucide lucide-trending-up w-4 h-4 text-primary'), className: 'kpi-card-success' },
    { label: 'Winst / Verlies', value: formatCurrency(profit, 0), icon: icons.check('lucide lucide-circle-check-big w-4 h-4 text-primary'), className: 'kpi-card-success' },
    { label: 'ROI', value: formatPercent(roi, 1), icon: icons.percent('lucide lucide-percent w-4 h-4 text-primary'), className: 'kpi-card-success' }
  ];

  const hookMetrics = HOOK_ORDER.map((hook) => {
    const hookEntries = filtered.filter((entry) => entry.hook === hook);
    const totalsByHook = hookEntries.reduce(
      (acc, entry) => {
        acc.leads += entry.leads;
        acc.appointments += entry.appointments;
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
      appointments: formatNumber(hook.appointments),
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
    summaryCards,
    totalLost
  };
};

const buildHookMetricsFromLive = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const aggregated = new Map();
  rows.forEach((row) => {
    const hook = row?.hook ? String(row.hook) : 'Onbekend';
    const leads = Number(row?.leads ?? 0);
    const appointments = Number(row?.appointments ?? 0);
    const current = aggregated.get(hook) || { hook, leads: 0, appointments: 0 };
    current.leads += Number.isFinite(leads) ? leads : 0;
    current.appointments += Number.isFinite(appointments) ? appointments : 0;
    aggregated.set(hook, current);
  });

  const hookMetrics = Array.from(aggregated.values()).map((hook) => ({
    hook: hook.hook,
    leads: hook.leads,
    appointments: hook.appointments,
    conversion: safeDivide(hook.appointments, hook.leads),
    costPerLead: Number.NaN,
    costPerCall: Number.NaN,
    spend: Number.NaN
  }));

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
      appointments: formatNumber(hook.appointments),
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
    const liveRows = liveState.sourceBreakdown.rows.map((row) => {
      const leads = Number(row.leads ?? 0);
      const appointments = Number(row.appointments ?? 0);
      const noLeadInRange = Number(row.appointments_without_lead_in_range ?? 0);
      const deals = Number(row.deals ?? 0);

      return {
        source: row.source ?? 'Onbekend',
        leads: formatNumber(leads),
        appointments: formatNumber(appointments),
        noLeadInRange: formatNumber(noLeadInRange),
        plan: formatPercent(safeDivide(appointments, leads), 1),
        deals: formatNumber(deals),
        toDeals: formatPercent(safeDivide(deals, leads), 1),
        cost: '--',
        rawLeads: leads,
        rawAppointments: appointments,
        rawNoLeadInRange: noLeadInRange,
        rawDeals: deals
      };
    });

    metrics.sourceRows = liveRows.length ? liveRows : metrics.sourceRows;
    metrics.sourceRowsLive = liveRows.length > 0;
  }

  if (liveState.hookPerformance.status === 'ready' && Array.isArray(liveState.hookPerformance.rows)) {
    const hookMetrics = buildHookMetricsFromLive(liveState.hookPerformance.rows);
    if (hookMetrics) {
      metrics.hookHighlights = hookMetrics.hookHighlights;
      metrics.hookCards = hookMetrics.hookCards;
      metrics.hookPerformanceLive = true;
    }
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
      const noLeadValue = renderDrilldownValue({
        value: row.noLeadInRange,
        kind: 'appointments_without_lead_in_range',
        source: row.source,
        label: 'Afspraken zonder lead in periode',
        enabled: isLive && Number(row.rawNoLeadInRange) > 0,
        className: 'drilldown-cell'
      });
      const dealsValue = renderDrilldownValue({
        value: row.deals,
        kind: 'deals',
        source: row.source,
        label: 'Deals',
        enabled: isLive && Number(row.rawDeals) > 0,
        className: 'drilldown-cell'
      });

      return `<tr class="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">${sourceText}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${leadsValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${appointmentsValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${noLeadValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${row.plan}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${dealsValue}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">${row.toDeals}</td>
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
  const sourceLabel = drilldownState.source ? `Bron: ${escapeHtml(drilldownState.source)}` : '';
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

const renderLostReasons = (reasons) =>
  reasons
    .map(
      (reason) =>
        `<div class="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
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
            <span class="text-sm font-medium text-foreground w-16 text-right">${reason.value}</span>
          </div>
        </div>`
    )
    .join('');

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

const renderHookCards = (cards) =>
  cards
    .map(
      (card, index) =>
        `<div class="rounded-lg border bg-card text-card-foreground shadow-sm relative overflow-hidden">
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
                <p class="text-lg font-bold">${card.leads}</p>
              </div>
              <div>
                <p class="text-xs text-muted-foreground">Afspraken</p>
                <p class="text-lg font-bold text-amber-700">${card.appointments}</p>
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
        </div>`
    )
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
            <img src="/assets/immo-beguin-logo.svg" alt="Immo Beguin" class="h-8 w-auto brightness-0 invert" />
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
          <p class="text-xs text-sidebar-foreground/60 text-center">Immo Beguin Dashboard</p>
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-border bg-card shadow-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div class="flex items-center gap-4">
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 lg:hidden hover:bg-accent" aria-label="Sluit menu" data-sidebar-toggle>
              ${icons.menu('lucide lucide-menu h-5 w-5')}
            </button>
            <div class="flex items-center gap-3">
              <img src="/assets/immo-beguin-logo.svg" alt="Immo Beguin Logo" class="h-10 w-auto object-contain" />
              <div class="hidden sm:block">
                <div class="text-lg font-bold text-primary tracking-tight">Immo Beguin</div>
                <p class="text-xs text-muted-foreground -mt-0.5">Vastgoed met Passie</p>
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
              <h1 class="text-2xl font-bold text-foreground tracking-tight">Immo Beguin</h1>
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
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Afspraken zonder lead in periode</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Inplan %</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Deals</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">% naar Deals</th>
                        <th class="h-12 px-4 align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 text-right">Cost per Deal</th>
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
                ${mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Kosten, omzet en rendement</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                ${renderHookCards(metrics.hookCards)}
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                ${icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-orange-500')}
                Analyse &amp; Inzichten
                ${mockBadge}
              </h2>
              <p class="text-sm text-gray-500 mb-4">Verloren leads en verdeling per reden</p>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="font-semibold tracking-tight text-lg flex items-center gap-2">
                      ${icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-orange-500')}
                      Verloren Leads - Redenen
                      ${mockBadge}
                    </h3>
                    <p class="text-sm text-muted-foreground">Analyseer waarom leads niet converteren</p>
                  </div>
                  <div class="p-6 pt-0">
                    <div class="space-y-3">
                      ${renderLostReasons(metrics.lostReasons)}
                    </div>
                    <div class="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p class="text-sm text-amber-600 dark:text-amber-400"><strong>Tip:</strong> "Wilt zelf verkopen" is je grootste blocker. Overweeg een gratis waardebepaling of exclusieve verkooptips te delen.</p>
                    </div>
                  </div>
                </div>
                <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                  <div class="flex flex-col space-y-1.5 p-6">
                    <h3 class="font-semibold tracking-tight text-lg flex items-center gap-2">
                      Verdeling Verloren Leads
                      ${mockBadge}
                    </h3>
                  </div>
                  <div class="p-6 pt-0">
                    <div class="h-64 flex items-center justify-center">
                      <img src="/assets/verd-leads-pie.svg" alt="Verdeling verloren leads" class="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
              <h2 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                ${icons.award('lucide lucide-award w-5 h-5 text-primary')}
                Samenvatting &amp; Aanbevelingen
                ${mockBadge}
              </h2>
              <div class="rounded-lg border bg-card text-card-foreground shadow-sm bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <div class="p-6 pt-6">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    ${renderSummaryCards(metrics.summaryCards)}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
        <footer class="h-12 border-t border-border bg-card/50 flex items-center justify-center px-6">
          <p class="text-xs text-muted-foreground font-medium">(c) 2026 Immo Beguin - Vastgoed met Passie</p>
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
        renderApp();
      });
    }
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



