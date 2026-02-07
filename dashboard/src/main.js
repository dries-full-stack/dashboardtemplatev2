import './styles.css';
import { createClient } from '@supabase/supabase-js';
import salesMainMarkup from './sales-layout.html?raw';

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

const ROUTES = {
  lead: '/',
  sales: '/sales-resultaten',
  callCenter: '/call-center'
};

const ALL_DASHBOARD_TABS = [
  { id: 'lead', label: 'Leadgeneratie', href: ROUTES.lead, icon: icons.dashboard('lucide lucide-layout-dashboard w-5 h-5 flex-shrink-0') },
  { id: 'sales', label: 'Sales Resultaten', href: ROUTES.sales, icon: icons.target('lucide lucide-target w-5 h-5 flex-shrink-0') },
  { id: 'call-center', label: 'Call Center', href: ROUTES.callCenter, icon: icons.headphones('lucide lucide-headphones w-5 h-5 flex-shrink-0') }
];

const DASHBOARD_LOOKUP = new Map(ALL_DASHBOARD_TABS.map((tab) => [tab.id, tab]));

const normalizePath = (value = '') => {
  if (!value) return '/';
  let path = value.split('?')[0].split('#')[0];
  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'/index.html'.length);
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1);
  }
  return path || '/';
};

const getRouteId = (availableTabs = ALL_DASHBOARD_TABS) => {
  const path = normalizePath(window.location.pathname);
  let candidate = 'lead';
  if (path === ROUTES.sales) candidate = 'sales';
  if (path === ROUTES.callCenter) candidate = 'call-center';

  if (!Array.isArray(availableTabs) || availableTabs.length === 0) return candidate;
  const hasCandidate = availableTabs.some((tab) => tab.id === candidate);
  if (hasCandidate) return candidate;
  return availableTabs[0].id || 'lead';
};

const DEFAULT_BRANDING = {
  title: 'Your Company',
  headerSubtitle: 'Performance Dashboard',
  pageSubtitle: 'Performance Dashboard - Leads, Afspraken & ROI',
  logoUrl: '/assets/logos/placeholder-logo.svg',
  logoAlt: 'Company logo'
};

const DEFAULT_LAYOUT = [
  {
    id: 'funnel',
    kind: 'funnel_metrics',
    title: 'Funnel Metrics',
    description: 'Overzicht van leads en afspraken',
    columns: 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3'
  },
  {
    id: 'source',
    kind: 'source_breakdown',
    title: 'Source Breakdown',
    description: 'Prestaties per leadgenerator - Leads = opportunities in periode - extra kolom = afspraken zonder lead in periode'
  },
  {
    id: 'finance',
    kind: 'finance_metrics',
    title: 'Financiele Metrics',
    description: 'Totale leadkosten en kost per lead',
    columns: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4'
  },
  {
    id: 'hook',
    kind: 'hook_performance',
    title: 'Ad Hook Performance',
    description: 'Vergelijk de prestaties van je advertentie hooks'
  },
  {
    id: 'lost',
    kind: 'lost_reasons',
    title: 'Analyse & Inzichten',
    description: 'Verloren leads en verdeling per reden'
  }
];

const MOCK_ENABLED = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';
const SALES_RANGE_MONTHS = 6;
const SALES_TARGET_MONTHLY_DEALS = 25;
const SALES_MAIN_MARKUP = salesMainMarkup.trim();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const ghlLocationId = import.meta.env.VITE_GHL_LOCATION_ID;
const adminModeEnabled = import.meta.env.VITE_ADMIN_MODE === 'true';
const settingsModeEnabled = import.meta.env.VITE_SETTINGS_MODE === 'true';
const settingsEnabled = settingsModeEnabled || adminModeEnabled;
const settingsButtonLabel = adminModeEnabled ? 'Setup' : 'Instellingen';
const teamleaderDealUrlTemplate =
  import.meta.env.VITE_TEAMLEADER_DEAL_URL_TEMPLATE || 'https://app.teamleader.eu/deals/{id}';
const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      })
    : null;
const adminEndpoint = supabaseUrl ? `${supabaseUrl}/functions/v1/ghl-admin` : '';

const formatIsoDate = (date) => date.toISOString().slice(0, 10);
const pickFirstUrl = (...candidates) =>
  candidates.find((value) => typeof value === 'string' && value.startsWith('http')) || '';

const getTeamleaderDealUrlFromRaw = (rawData) => {
  if (!rawData || typeof rawData !== 'object') return '';
  const links = rawData.links && typeof rawData.links === 'object' ? rawData.links : {};
  return pickFirstUrl(
    rawData.web_url,
    rawData.url,
    rawData.link,
    rawData.permalink,
    links.web_url,
    links.url,
    links.self,
    links.html
  );
};

const buildTeamleaderDealUrl = (dealId, rawData) => {
  const direct = getTeamleaderDealUrlFromRaw(rawData);
  if (direct) return direct;
  if (!teamleaderDealUrlTemplate || !dealId) return '';
  const encodedId = encodeURIComponent(String(dealId));
  if (teamleaderDealUrlTemplate.includes('{id}')) {
    return teamleaderDealUrlTemplate.replace('{id}', encodedId);
  }
  return `${teamleaderDealUrlTemplate.replace(/\/$/, '')}/${encodedId}`;
};

const getDefaultRange = () => {
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const start = new Date(end);
  start.setUTCMonth(start.getUTCMonth() - 1);
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

const mockEntries = MOCK_ENABLED
  ? [
      {
        date: '2026-10-05',
        source: 'META',
        hook: 'Bereken mijn woningwaarde',
        leads: 100,
        appointments: 39,
        cancelled: 4,
        rescheduled: 3,
        noShow: 2,
        deals: 9,
        costPerLead: 12.8,
        dealValue: 340
      },
      {
        date: '2026-10-10',
        source: 'Google Ads',
        hook: 'Gratis schatting',
        leads: 80,
        appointments: 29,
        cancelled: 3,
        rescheduled: 2,
        noShow: 1,
        deals: 7,
        costPerLead: 15.2,
        dealValue: 320
      },
      {
        date: '2026-10-16',
        source: 'Makelaar vergelijker',
        hook: '5 verkooptips',
        leads: 70,
        appointments: 25,
        cancelled: 2,
        rescheduled: 2,
        noShow: 1,
        deals: 5,
        costPerLead: 14.5,
        dealValue: 330
      },
      {
        date: '2026-10-24',
        source: 'Immoweb',
        hook: 'Lokale makelaar vs grote groep?',
        leads: 50,
        appointments: 19,
        cancelled: 2,
        rescheduled: 1,
        noShow: 1,
        deals: 4,
        costPerLead: 16.5,
        dealValue: 350
      },
      {
        date: '2026-11-04',
        source: 'META',
        hook: 'Bereken mijn woningwaarde',
        leads: 95,
        appointments: 36,
        cancelled: 4,
        rescheduled: 3,
        noShow: 2,
        deals: 8,
        costPerLead: 12.8,
        dealValue: 340
      },
      {
        date: '2026-11-12',
        source: 'Google Ads',
        hook: 'Gratis schatting',
        leads: 70,
        appointments: 26,
        cancelled: 3,
        rescheduled: 2,
        noShow: 1,
        deals: 6,
        costPerLead: 15.2,
        dealValue: 320
      },
      {
        date: '2026-11-18',
        source: 'Makelaar vergelijker',
        hook: '5 verkooptips',
        leads: 65,
        appointments: 23,
        cancelled: 2,
        rescheduled: 2,
        noShow: 1,
        deals: 5,
        costPerLead: 14.5,
        dealValue: 330
      },
      {
        date: '2026-11-26',
        source: 'Immoweb',
        hook: 'Lokale makelaar vs grote groep?',
        leads: 50,
        appointments: 18,
        cancelled: 2,
        rescheduled: 1,
        noShow: 0,
        deals: 4,
        costPerLead: 16.5,
        dealValue: 350
      },
      {
        date: '2026-12-03',
        source: 'META',
        hook: 'Bereken mijn woningwaarde',
        leads: 90,
        appointments: 34,
        cancelled: 3,
        rescheduled: 3,
        noShow: 2,
        deals: 7,
        costPerLead: 12.8,
        dealValue: 340
      },
      {
        date: '2026-12-11',
        source: 'Google Ads',
        hook: 'Gratis schatting',
        leads: 65,
        appointments: 23,
        cancelled: 2,
        rescheduled: 2,
        noShow: 1,
        deals: 5,
        costPerLead: 15.2,
        dealValue: 320
      },
      {
        date: '2026-12-17',
        source: 'Makelaar vergelijker',
        hook: '5 verkooptips',
        leads: 55,
        appointments: 19,
        cancelled: 2,
        rescheduled: 1,
        noShow: 1,
        deals: 4,
        costPerLead: 14.5,
        dealValue: 330
      },
      {
        date: '2026-12-28',
        source: 'Immoweb',
        hook: 'Lokale makelaar vs grote groep?',
        leads: 57,
        appointments: 21,
        cancelled: 2,
        rescheduled: 2,
        noShow: 1,
        deals: 5,
        costPerLead: 16.5,
        dealValue: 350
      }
    ]
  : [];

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

const mockBadge = MOCK_ENABLED ? '<span class="mock-badge">Mock data</span>' : '';
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

const salesState = {
  status: 'idle',
  data: null,
  rangeKey: '',
  errorMessage: '',
  inFlight: false
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
  salesMonthlyDealsTarget: null,
  salesMonthlyDealsTargets: null,
  salesQuotesFromPhaseId: null,
  billingPortalUrl: null,
  billingCheckoutUrl: null,
  billingCheckoutEmbed: false,
  dashboardTitle: null,
  dashboardSubtitle: null,
  dashboardLogoUrl: null,
  dashboardLayout: null,
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
  },
  kpi: {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    year: new Date().getFullYear(),
    monthlyDealsTarget: '',
    monthlyDealsTargets: {},
    quotesFromPhaseId: '',
    quotesPhaseOptions: [],
    hasChanges: false
  },
  billing: {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    portalUrl: '',
    checkoutUrl: '',
    checkoutEmbed: false,
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

const resetKpiState = () => {
  adminState.kpi = {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    year: new Date().getFullYear(),
    monthlyDealsTarget: '',
    monthlyDealsTargets: {},
    quotesFromPhaseId: '',
    quotesPhaseOptions: [],
    hasChanges: false
  };
};

const resetBillingState = () => {
  adminState.billing = {
    status: 'idle',
    message: '',
    loading: false,
    saving: false,
    portalUrl: '',
    checkoutUrl: '',
    checkoutEmbed: false,
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
  if (!supabase || !settingsEnabled) return;
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
      resetKpiState();
      resetBillingState();
    } else if (adminState.open) {
      if (adminModeEnabled) {
        loadAdminIntegration();
        loadSpendMapping();
      }
      loadKpiSettings();
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
    // Use '*' so older schemas (missing optional branding/layout columns) don't 400.
    .select('*')
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
  configState.salesMonthlyDealsTarget =
    typeof data?.sales_monthly_deals_target === 'number' && Number.isFinite(data.sales_monthly_deals_target)
      ? data.sales_monthly_deals_target
      : null;
  configState.salesMonthlyDealsTargets =
    data?.sales_monthly_deals_targets && typeof data.sales_monthly_deals_targets === 'object' && !Array.isArray(data.sales_monthly_deals_targets)
      ? data.sales_monthly_deals_targets
      : null;
  configState.salesQuotesFromPhaseId =
    typeof data?.sales_quotes_from_phase_id === 'string' && data.sales_quotes_from_phase_id.trim()
      ? data.sales_quotes_from_phase_id.trim()
      : null;
  configState.billingPortalUrl = normalizeBillingUrl(data?.billing_portal_url);
  configState.billingCheckoutUrl = normalizeBillingUrl(data?.billing_checkout_url);
  configState.billingCheckoutEmbed = data?.billing_checkout_embed === true;
  configState.dashboardTitle = data?.dashboard_title || null;
  configState.dashboardSubtitle = data?.dashboard_subtitle || null;
  configState.dashboardLogoUrl = data?.dashboard_logo_url || null;
  configState.dashboardLayout = data?.dashboard_layout || null;

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

const loadKpiSettings = async () => {
  if (!supabase || !settingsEnabled) return;
  if (adminState.kpi.loading || adminState.billing.loading) return;

  adminState.kpi.loading = true;
  adminState.kpi.status = 'loading';
  adminState.kpi.message = '';
  adminState.billing.loading = true;
  adminState.billing.status = 'loading';
  adminState.billing.message = '';
  renderApp();

  try {
    const { data, error } = await supabase.from('dashboard_config').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;

    const rawTarget = data?.sales_monthly_deals_target;
    const rawTargetsByMonth =
      data?.sales_monthly_deals_targets &&
      typeof data.sales_monthly_deals_targets === 'object' &&
      !Array.isArray(data.sales_monthly_deals_targets)
        ? data.sales_monthly_deals_targets
        : null;
    const fallbackTarget =
      Number.isFinite(configState.salesMonthlyDealsTarget) && configState.salesMonthlyDealsTarget > 0
        ? configState.salesMonthlyDealsTarget
        : SALES_TARGET_MONTHLY_DEALS;
    const target =
      typeof rawTarget === 'number' && Number.isFinite(rawTarget) && rawTarget > 0 ? rawTarget : fallbackTarget;

    adminState.kpi.monthlyDealsTarget = String(Math.max(1, Math.round(target)));

    const fallbackTargets =
      configState.salesMonthlyDealsTargets &&
      typeof configState.salesMonthlyDealsTargets === 'object' &&
      !Array.isArray(configState.salesMonthlyDealsTargets)
        ? configState.salesMonthlyDealsTargets
        : {};
    const sourceTargets = rawTargetsByMonth || fallbackTargets;
    const cleanedTargets = {};
    const monthKeyPattern = /^\d{4}-\d{2}$/;
    Object.entries(sourceTargets || {}).forEach(([key, value]) => {
      if (!monthKeyPattern.test(key)) return;
      const month = Number(key.slice(5));
      if (!Number.isFinite(month) || month < 1 || month > 12) return;
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num) || num <= 0) return;
      cleanedTargets[key] = String(Math.max(1, Math.round(num)));
    });
    adminState.kpi.monthlyDealsTargets = cleanedTargets;

    const rawQuotesFromPhase = data?.sales_quotes_from_phase_id;
    const fallbackQuotesFromPhase = configState.salesQuotesFromPhaseId;
    const normalizedQuotesFromPhase =
      typeof rawQuotesFromPhase === 'string'
        ? rawQuotesFromPhase.trim()
        : typeof fallbackQuotesFromPhase === 'string'
          ? fallbackQuotesFromPhase.trim()
          : '';
    adminState.kpi.quotesFromPhaseId = normalizedQuotesFromPhase || '';

    const rawPortalUrl = normalizeBillingUrl(data?.billing_portal_url);
    const fallbackPortalUrl = normalizeBillingUrl(configState.billingPortalUrl);
    const rawCheckoutUrl = normalizeBillingUrl(data?.billing_checkout_url);
    const fallbackCheckoutUrl = normalizeBillingUrl(configState.billingCheckoutUrl);
    const portalUrl = rawPortalUrl || fallbackPortalUrl || '';
    const checkoutUrl = rawCheckoutUrl || fallbackCheckoutUrl || '';
    const checkoutEmbedFlag = data?.billing_checkout_embed === true || configState.billingCheckoutEmbed === true;

    adminState.billing.portalUrl = portalUrl;
    adminState.billing.checkoutUrl = checkoutUrl;
    adminState.billing.checkoutEmbed = Boolean(checkoutUrl && checkoutEmbedFlag);

    const locationId = (configState.locationId || ghlLocationId || data?.location_id || adminState.form.locationId || '').trim();
    adminState.kpi.quotesPhaseOptions = [];
    if (locationId) {
      const { data: phaseRows, error: phaseError } = await supabase
        .from('teamleader_deal_phases')
        .select('id,name,probability,sort_order')
        .eq('location_id', locationId);
      if (phaseError) {
        const phaseMessage = phaseError.message ?? String(phaseError);
        if (phaseMessage.includes('sort_order') && phaseMessage.includes('does not exist')) {
          const { data: fallbackRows, error: fallbackError } = await supabase
            .from('teamleader_deal_phases')
            .select('id,name,probability')
            .eq('location_id', locationId);
          if (fallbackError) {
            console.warn('Unable to load Teamleader deal phases for Sales KPI settings', fallbackError);
          } else {
            adminState.kpi.quotesPhaseOptions = (fallbackRows || []).map((row) => ({ ...row, sort_order: null }));
          }
        } else {
          console.warn('Unable to load Teamleader deal phases for Sales KPI settings', phaseError);
        }
      } else {
        adminState.kpi.quotesPhaseOptions = phaseRows || [];
      }
    }

    if (!Number.isFinite(Number(adminState.kpi.year))) {
      adminState.kpi.year = new Date().getFullYear();
    }
    adminState.kpi.status = 'ready';
    adminState.kpi.message = '';
    adminState.kpi.hasChanges = false;
    adminState.billing.status = 'ready';
    adminState.billing.message = '';
    adminState.billing.hasChanges = false;
  } catch (error) {
    adminState.kpi.status = 'error';
    adminState.kpi.message = error instanceof Error ? error.message : 'Onbekende fout';
    adminState.billing.status = 'error';
    adminState.billing.message = error instanceof Error ? error.message : 'Onbekende fout';
    if (!adminState.kpi.monthlyDealsTarget) {
      adminState.kpi.monthlyDealsTarget = String(SALES_TARGET_MONTHLY_DEALS);
    }
    if (
      !adminState.kpi.monthlyDealsTargets ||
      typeof adminState.kpi.monthlyDealsTargets !== 'object' ||
      Array.isArray(adminState.kpi.monthlyDealsTargets)
    ) {
      adminState.kpi.monthlyDealsTargets = {};
    }
    if (
      Object.keys(adminState.kpi.monthlyDealsTargets).length === 0 &&
      configState.salesMonthlyDealsTargets &&
      typeof configState.salesMonthlyDealsTargets === 'object' &&
      !Array.isArray(configState.salesMonthlyDealsTargets)
    ) {
      const cleanedTargets = {};
      const monthKeyPattern = /^\d{4}-\d{2}$/;
      Object.entries(configState.salesMonthlyDealsTargets).forEach(([key, value]) => {
        if (!monthKeyPattern.test(key)) return;
        const month = Number(key.slice(5));
        if (!Number.isFinite(month) || month < 1 || month > 12) return;
        const num = typeof value === 'number' ? value : Number(value);
        if (!Number.isFinite(num) || num <= 0) return;
        cleanedTargets[key] = String(Math.max(1, Math.round(num)));
      });
      adminState.kpi.monthlyDealsTargets = cleanedTargets;
    }

    if (typeof adminState.kpi.quotesFromPhaseId !== 'string') {
      adminState.kpi.quotesFromPhaseId = configState.salesQuotesFromPhaseId || '';
    }
    if (!Array.isArray(adminState.kpi.quotesPhaseOptions)) {
      adminState.kpi.quotesPhaseOptions = [];
    }
    adminState.billing.portalUrl = configState.billingPortalUrl || '';
    adminState.billing.checkoutUrl = configState.billingCheckoutUrl || '';
    adminState.billing.checkoutEmbed = Boolean(configState.billingCheckoutEmbed && configState.billingCheckoutUrl);
    adminState.billing.hasChanges = false;
  } finally {
    adminState.kpi.loading = false;
    adminState.billing.loading = false;
    renderApp();
  }
};

const saveKpiSettings = async () => {
  if (!supabase || !settingsEnabled) return;
  if (adminState.kpi.saving) return;

  const kpiOnlyMode = settingsModeEnabled && !adminModeEnabled;
  if (adminModeEnabled) {
    const token = await getAuthToken();
    if (!token) {
      adminState.kpi.status = 'error';
      adminState.kpi.message = 'Log in om KPI instellingen op te slaan.';
      renderApp();
      return;
    }
  }

  const rawValue = String(adminState.kpi.monthlyDealsTarget ?? '').trim();
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    adminState.kpi.status = 'error';
    adminState.kpi.message = 'Vul een geldig positief getal in voor de maandelijkse target.';
    renderApp();
    return;
  }

  const target = Math.max(1, Math.round(parsed));

  const monthTargets = adminState.kpi.monthlyDealsTargets;
  const monthKeyPattern = /^\d{4}-\d{2}$/;
  const monthOverrides = {};
  if (monthTargets && typeof monthTargets === 'object' && !Array.isArray(monthTargets)) {
    for (const [key, value] of Object.entries(monthTargets)) {
      if (!monthKeyPattern.test(key)) continue;
      const month = Number(key.slice(5));
      if (!Number.isFinite(month) || month < 1 || month > 12) continue;

      const raw = String(value ?? '').trim();
      if (!raw) continue;
      const num = Number(raw);
      if (!Number.isFinite(num) || num <= 0) {
        adminState.kpi.status = 'error';
        adminState.kpi.message = `Ongeldige maandtarget voor ${key}. Gebruik een positief getal of laat leeg.`;
        renderApp();
        return;
      }

      const rounded = Math.max(1, Math.round(num));
      if (rounded !== target) {
        monthOverrides[key] = rounded;
      }
    }
  }

  const quotesFromPhaseIdRaw = String(adminState.kpi.quotesFromPhaseId ?? '').trim();
  const quotesFromPhaseId = quotesFromPhaseIdRaw || null;

  const locationId = (configState.locationId || ghlLocationId || adminState.form.locationId || '').trim();
  if (adminModeEnabled && !locationId) {
    adminState.kpi.status = 'error';
    adminState.kpi.message = 'Location ID ontbreekt. Sla eerst de integratie op.';
    renderApp();
    return;
  }

  adminState.kpi.saving = true;
  adminState.kpi.status = 'saving';
  adminState.kpi.message = '';
  renderApp();

  try {
    const now = new Date().toISOString();
    if (kpiOnlyMode) {
      const { data, error } = await supabase
        .from('dashboard_config')
        .update({
          sales_monthly_deals_target: target,
          sales_monthly_deals_targets: monthOverrides,
          sales_quotes_from_phase_id: quotesFromPhaseId,
          updated_at: now
        })
        .eq('id', 1)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) {
        throw new Error('dashboard_config ontbreekt. Contacteer je dashboardbeheerder.');
      }
    } else {
      const { error } = await supabase
        .from('dashboard_config')
        .upsert(
          {
            id: 1,
            location_id: locationId,
            sales_monthly_deals_target: target,
            sales_monthly_deals_targets: monthOverrides,
            sales_quotes_from_phase_id: quotesFromPhaseId,
            updated_at: now
          },
          { onConflict: 'id' }
        );
      if (error) throw error;
    }

    adminState.kpi.saving = false;
    adminState.kpi.status = 'success';
    adminState.kpi.message = 'KPI opgeslagen.';
    adminState.kpi.hasChanges = false;
    adminState.kpi.monthlyDealsTarget = String(target);
    adminState.kpi.monthlyDealsTargets = Object.fromEntries(
      Object.entries(monthOverrides).map(([key, value]) => [key, String(value)])
    );
    adminState.kpi.quotesFromPhaseId = quotesFromPhaseIdRaw;

    configState.salesMonthlyDealsTarget = target;
    configState.salesMonthlyDealsTargets = monthOverrides;
    configState.salesQuotesFromPhaseId = quotesFromPhaseId;

    // Refresh Sales metrics if the Sales dashboard is open.
    const routeId = getRouteId(resolveDashboardTabs());
    if (routeId === 'sales') {
      salesState.status = 'idle';
      salesState.data = null;
      salesState.rangeKey = '';
      salesState.errorMessage = '';
      salesState.inFlight = false;
      ensureSalesData();
    }
  } catch (error) {
    adminState.kpi.status = 'error';
    adminState.kpi.message = error instanceof Error ? error.message : 'Onbekende fout';
  } finally {
    adminState.kpi.saving = false;
    renderApp();
  }
};

const saveBillingSettings = async () => {
  if (!supabase || !settingsEnabled) return;
  if (adminState.billing.saving) return;

  const kpiOnlyMode = settingsModeEnabled && !adminModeEnabled;
  if (adminModeEnabled) {
    const token = await getAuthToken();
    if (!token) {
      adminState.billing.status = 'error';
      adminState.billing.message = 'Log in om abonnement instellingen op te slaan.';
      renderApp();
      return;
    }
  }

  const rawPortalUrl = String(adminState.billing.portalUrl ?? '').trim();
  const rawCheckoutUrl = String(adminState.billing.checkoutUrl ?? '').trim();
  const portalUrl = rawPortalUrl ? normalizeBillingUrl(rawPortalUrl) : null;
  const checkoutUrl = rawCheckoutUrl ? normalizeBillingUrl(rawCheckoutUrl) : null;
  const checkoutEmbed = Boolean(adminState.billing.checkoutEmbed && checkoutUrl);

  if (rawPortalUrl && !portalUrl) {
    adminState.billing.status = 'error';
    adminState.billing.message = 'Gebruik een geldige HTTPS URL of een pad dat start met /.';
    renderApp();
    return;
  }

  if (rawCheckoutUrl && !checkoutUrl) {
    adminState.billing.status = 'error';
    adminState.billing.message = 'Gebruik een geldige HTTPS URL of een pad dat start met /.';
    renderApp();
    return;
  }

  const locationId = (configState.locationId || ghlLocationId || adminState.form.locationId || '').trim();
  if (adminModeEnabled && !locationId) {
    adminState.billing.status = 'error';
    adminState.billing.message = 'Location ID ontbreekt. Sla eerst de integratie op.';
    renderApp();
    return;
  }

  adminState.billing.saving = true;
  adminState.billing.status = 'saving';
  adminState.billing.message = '';
  renderApp();

  try {
    const now = new Date().toISOString();
    if (kpiOnlyMode) {
      const { data, error } = await supabase
        .from('dashboard_config')
        .update({
          billing_portal_url: portalUrl,
          billing_checkout_url: checkoutUrl,
          billing_checkout_embed: checkoutEmbed,
          updated_at: now
        })
        .eq('id', 1)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) {
        throw new Error('dashboard_config ontbreekt. Contacteer je dashboardbeheerder.');
      }
    } else {
      const { error } = await supabase
        .from('dashboard_config')
        .upsert(
          {
            id: 1,
            location_id: locationId,
            billing_portal_url: portalUrl,
            billing_checkout_url: checkoutUrl,
            billing_checkout_embed: checkoutEmbed,
            updated_at: now
          },
          { onConflict: 'id' }
        );
      if (error) throw error;
    }

    adminState.billing.status = 'success';
    adminState.billing.message = 'Abonnement instellingen opgeslagen.';
    adminState.billing.hasChanges = false;
    adminState.billing.portalUrl = portalUrl || '';
    adminState.billing.checkoutUrl = checkoutUrl || '';
    adminState.billing.checkoutEmbed = checkoutEmbed;

    configState.billingPortalUrl = portalUrl;
    configState.billingCheckoutUrl = checkoutUrl;
    configState.billingCheckoutEmbed = checkoutEmbed;
  } catch (error) {
    adminState.billing.status = 'error';
    adminState.billing.message = error instanceof Error ? error.message : 'Onbekende fout';
  } finally {
    adminState.billing.saving = false;
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
const MONTH_LABELS_NL = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const buildMonthBuckets = (start, end) => {
  const buckets = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    buckets.push({
      key: toMonthKey(cursor),
      label: MONTH_LABELS_NL[cursor.getMonth()],
      quotes: 0,
      won: 0
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
};
const getSalesRange = (range) => {
  if (range?.start && range?.end) {
    const start = new Date(`${range.start}T00:00:00Z`);
    const end = new Date(`${range.end}T23:59:59Z`);
    return { start, end };
  }
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setMonth(start.getMonth() - (SALES_RANGE_MONTHS - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};
const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const diffDays = (later, earlier) => {
  if (!later || !earlier) return null;
  return (later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24);
};
const formatDays = (value, decimals = 1) =>
  Number.isFinite(value) ? `${formatNumber(value, decimals)} dagen` : '--';
const normalizeStatus = (value) => String(value || '').trim().toLowerCase();
const isWonStatus = (status) => status.includes('won');
const isLostStatus = (status) =>
  !isWonStatus(status) &&
  (status.includes('lost') ||
    status.includes('declined') ||
    status.includes('rejected') ||
    status.includes('cancel') ||
    status.includes('closed'));
const formatFullName = (first, last, fallback = 'Onbekend') => {
  const parts = [first, last].map((value) => (value || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : fallback;
};
const buildInitials = (name) => {
  if (!name) return '--';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '--';
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
  return `${first}${last}`.toUpperCase();
};
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

const toTrimmedText = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const normalizeBillingUrl = (value) => {
  const text = toTrimmedText(value);
  if (!text) return null;
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch (_error) {
    return null;
  }
};

const resolveBillingUrl = (value) => {
  const normalized = normalizeBillingUrl(value);
  if (!normalized) return null;
  if (normalized.startsWith('/')) {
    try {
      return new URL(normalized, window.location.origin).toString();
    } catch (_error) {
      return null;
    }
  }
  return normalized;
};

// Mirrors public.normalize_source() in SQL.
const normalizeSourceValue = (value) => {
  const text = toTrimmedText(value);
  if (!text) return null;
  const lowered = text.toLowerCase();
  if (lowered === 'meta - calculator' || lowered === 'meta ads - calculator') return 'Meta - Calculator';
  return text;
};

const normalizeEmailValue = (value) => {
  const text = toTrimmedText(value);
  if (!text) return null;
  return text.toLowerCase();
};

const isWonOrClosedStatus = (status) => {
  const text = toTrimmedText(status);
  if (!text) return false;
  const lowered = text.toLowerCase();
  return lowered === 'won' || lowered.includes('won') || lowered.startsWith('closed');
};

const isAppointmentConfirmedStatus = (status, statusRaw) => {
  const combined = `${toTrimmedText(status) ?? ''} ${toTrimmedText(statusRaw) ?? ''}`.toLowerCase();
  return combined.includes('confirm');
};

const extractCustomFieldValue = (customFields, fieldId) => {
  const targetId = toTrimmedText(fieldId);
  if (!targetId) return null;
  if (!customFields) return null;

  if (typeof customFields === 'object' && !Array.isArray(customFields)) {
    return toTrimmedText(customFields[targetId]);
  }

  if (!Array.isArray(customFields)) return null;

  const match = customFields.find((cf) => {
    if (!cf || typeof cf !== 'object') return false;
    const id = toTrimmedText(cf.id ?? cf.fieldId ?? cf.field_id);
    return id === targetId;
  });

  if (!match || typeof match !== 'object') return null;

  // Different providers/versions use different keys.
  return toTrimmedText(
    match.value ??
      match.fieldValue ??
      match.field_value ??
      match.text ??
      match.fieldValueString ??
      match.field_value_string ??
      match.fieldValueNumber ??
      match.field_value_number ??
      match.fieldValueBoolean ??
      match.field_value_boolean ??
      match.fieldValueDate ??
      match.fieldValueDateTime
  );
};

const firstText = (...candidates) => {
  for (const candidate of candidates) {
    const text = toTrimmedText(candidate);
    if (text) return text;
  }
  return null;
};

const extractLostReasonRaw = (opportunityRaw, lostReasonFieldId, contactRaw) => {
  const opp = opportunityRaw && typeof opportunityRaw === 'object' ? opportunityRaw : {};
  const contact = contactRaw && typeof contactRaw === 'object' ? contactRaw : {};
  const oppCustomFields = opp.customFields ?? opp.custom_fields;
  const contactCustomFields = contact.customFields ?? contact.custom_fields;
  const lostReasonId = toTrimmedText(lostReasonFieldId);

  return firstText(
    lostReasonId ? extractCustomFieldValue(oppCustomFields, lostReasonId) : null,
    lostReasonId ? extractCustomFieldValue(contactCustomFields, lostReasonId) : null,
    opp.lostReason,
    opp.lost_reason,
    opp.lostReasonName,
    opp.lost_reason_name,
    opp.lostReasonId,
    opp.lost_reason_id,
    opp.reason,
    opp.closedReason,
    opp.closed_reason,
    opp.statusChangeReason,
    opp.status_change_reason,
    opp.disposition,
    opp.outcome,
    opp.leadStatus,
    opp.status?.reason,
    opp.lostReason?.name,
    opp.lostReason?.label,
    opp.lostReason?.reason,
    opp.lost_reason?.name,
    opp.lost_reason?.label
  );
};

const fetchSourceBreakdownComputed = async (range, activeLocationId) => {
  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);

  const opportunities = await fetchAllRows(() =>
    supabase
      .from('opportunities_view')
      .select('id,contact_id,contact_email,source_guess,status,created_at')
      .eq('location_id', activeLocationId)
      .gte('created_at', startIso)
      .lt('created_at', endIso)
  );

  const leadContactIds = new Set();
  const leadEmails = new Set();
  const leadsBySource = new Map();
  const dealsBySource = new Map();

  opportunities.forEach((row) => {
    const source = normalizeSourceValue(row?.source_guess) || 'Onbekend';
    const prevLeads = leadsBySource.get(source) || 0;
    leadsBySource.set(source, prevLeads + 1);

    if (isWonOrClosedStatus(row?.status)) {
      const prevDeals = dealsBySource.get(source) || 0;
      dealsBySource.set(source, prevDeals + 1);
    }

    const contactId = toTrimmedText(row?.contact_id);
    if (contactId) leadContactIds.add(contactId);

    const emailNorm = normalizeEmailValue(row?.contact_email);
    if (emailNorm) leadEmails.add(emailNorm);
  });

  const appointments = await fetchAllRows(() =>
    supabase
      .from('appointments_view')
      .select('id,contact_id,contact_email,source,appointment_status,appointment_status_raw,start_time')
      .eq('location_id', activeLocationId)
      .gte('start_time', startIso)
      .lt('start_time', endIso)
  );

  const appointmentContactIds = Array.from(
    new Set(appointments.map((row) => toTrimmedText(row?.contact_id)).filter(Boolean))
  );

  let opportunitiesForAppointments = [];
  if (appointmentContactIds.length) {
    opportunitiesForAppointments = await fetchAllRows(() =>
      supabase
        .from('opportunities_view')
        .select('contact_id,contact_email,source_guess,created_at')
        .eq('location_id', activeLocationId)
        .in('contact_id', appointmentContactIds)
        .order('created_at', { ascending: false })
    );
  }

  const sourceByContactId = new Map();
  const sourceByEmail = new Map();
  opportunitiesForAppointments.forEach((row) => {
    const source = normalizeSourceValue(row?.source_guess);
    if (!source) return;

    const contactId = toTrimmedText(row?.contact_id);
    if (contactId && !sourceByContactId.has(contactId)) {
      sourceByContactId.set(contactId, source);
    }

    const emailNorm = normalizeEmailValue(row?.contact_email);
    if (emailNorm && !sourceByEmail.has(emailNorm)) {
      sourceByEmail.set(emailNorm, source);
    }
  });

  const apptAgg = new Map();
  appointments.forEach((row) => {
    const contactId = toTrimmedText(row?.contact_id);
    const emailNorm = normalizeEmailValue(row?.contact_email);

    let source =
      normalizeSourceValue(row?.source) ||
      (contactId ? sourceByContactId.get(contactId) : null) ||
      (emailNorm ? sourceByEmail.get(emailNorm) : null) ||
      'Onbekend';

    const existing = apptAgg.get(source) || { appointments: 0, confirmed: 0, withoutLead: 0 };
    existing.appointments += 1;
    if (isAppointmentConfirmedStatus(row?.appointment_status, row?.appointment_status_raw)) {
      existing.confirmed += 1;
    }

    const leadInRange =
      (contactId && leadContactIds.has(contactId)) || (emailNorm && leadEmails.has(emailNorm));
    if (!leadInRange) existing.withoutLead += 1;
    apptAgg.set(source, existing);
  });

  const sources = new Set([
    ...Array.from(leadsBySource.keys()),
    ...Array.from(dealsBySource.keys()),
    ...Array.from(apptAgg.keys())
  ]);

  const rows = Array.from(sources).map((source) => {
    const appts = apptAgg.get(source);
    return {
      source,
      leads: leadsBySource.get(source) || 0,
      appointments: appts?.appointments || 0,
      appointments_confirmed: appts?.confirmed || 0,
      appointments_without_lead_in_range: appts?.withoutLead || 0,
      deals: dealsBySource.get(source) || 0
    };
  });

  rows.sort((a, b) => {
    const leadDiff = (b.leads ?? 0) - (a.leads ?? 0);
    if (leadDiff) return leadDiff;
    const apptDiff = (b.appointments ?? 0) - (a.appointments ?? 0);
    if (apptDiff) return apptDiff;
    return String(a.source ?? '').localeCompare(String(b.source ?? ''));
  });

  return rows;
};

const fetchLostReasonsComputed = async (range, activeLocationId) => {
  const startIso = toUtcStart(range.start);
  const endIso = toUtcEndExclusive(range.end);
  const lostReasonFieldId = toTrimmedText(configState.lostReasonFieldId);

  const lookupRows = await supabase
    .from('lost_reason_lookup')
    .select('reason_id,reason_name')
    .eq('location_id', activeLocationId)
    .then(({ data, error }) => {
      if (error) throw error;
      return data || [];
    });

  const lookupById = new Map(
    lookupRows
      .map((row) => [toTrimmedText(row?.reason_id), toTrimmedText(row?.reason_name)])
      .filter(([id, name]) => id && name)
  );

  const opportunities = await fetchAllRows(
    () =>
      supabase
        .from('opportunities')
        .select('id,status,contact_id,raw_data,created_at')
        .eq('location_id', activeLocationId)
        .gte('created_at', startIso)
        .lt('created_at', endIso),
    500
  );

  let contactsById = null;
  if (lostReasonFieldId) {
    const contactIds = Array.from(
      new Set(opportunities.map((row) => toTrimmedText(row?.contact_id)).filter(Boolean))
    );
    contactsById = new Map();
    const chunkSize = 100;
    for (let i = 0; i < contactIds.length; i += chunkSize) {
      const chunk = contactIds.slice(i, i + chunkSize);
      // contacts PK is (id, location_id), so include location filter.
      const { data, error } = await supabase
        .from('contacts')
        .select('id,raw_data')
        .eq('location_id', activeLocationId)
        .in('id', chunk);
      if (error) throw error;
      (data || []).forEach((row) => {
        const id = toTrimmedText(row?.id);
        if (id) contactsById.set(id, row?.raw_data || null);
      });
    }
  }

  const counts = new Map();

  opportunities.forEach((row) => {
    if (isWonOrClosedStatus(row?.status)) return;
    const raw = row?.raw_data || null;
    const contactRaw = contactsById ? contactsById.get(toTrimmedText(row?.contact_id) || '') : null;
    const reasonRaw = extractLostReasonRaw(raw, lostReasonFieldId, contactRaw);
    if (!reasonRaw) return;

    const label = lookupById.get(reasonRaw) || reasonRaw;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  const rows = Array.from(counts.entries()).map(([reason, total]) => ({ reason, total }));
  rows.sort((a, b) => {
    const diff = (b.total ?? 0) - (a.total ?? 0);
    if (diff) return diff;
    return String(a.reason ?? '').localeCompare(String(b.reason ?? ''));
  });

  return rows;
};

const fetchSourceBreakdown = async (range) => {
  if (!supabase) return null;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    throw new Error('Location ID ontbreekt. Voeg deze toe via de setup (dashboard_config).');
  }

  // The RPC version is convenient but can hit low statement_timeout limits on larger datasets.
  // Compute in the client using indexed table queries instead.
  return fetchSourceBreakdownComputed(range, activeLocationId);
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

  // The RPC version can hit low statement_timeout limits. Compute in the client.
  return fetchLostReasonsComputed(range, activeLocationId);
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
  return `${base} | ${source}`;
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

const fetchAllRows = async (buildQuery, pageSize = 1000) => {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
};

const extractLossReason = (deal, lostReasonById) => {
  const raw = deal?.raw_data;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    // Teamleader stores the lost reason as an id reference (and optional remark).
    const remark = raw.lost_reason?.remark ?? raw.lostReason?.remark;
    if (typeof remark === 'string' && remark.trim()) return remark.trim();

    const reasonId =
      raw.lost_reason?.reason?.id ??
      raw.lostReason?.reason?.id ??
      raw.lost_reason_id ??
      raw.lostReasonId ??
      raw.lost_reason?.id ??
      raw.lostReason?.id;
    if (typeof reasonId === 'string' && reasonId.trim()) {
      const name = lostReasonById?.get(reasonId.trim());
      if (typeof name === 'string' && name.trim()) return name.trim();
    }

    const directKeys = [
      'lostReason',
      'lost_reason',
      'lostReasonName',
      'lost_reason_name',
      'reason',
      'closedReason',
      'closed_reason',
      'statusChangeReason',
      'status_change_reason',
      'disposition',
      'outcome'
    ];
    for (const key of directKeys) {
      const value = raw[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value && typeof value === 'object') {
        const nested = value.name || value.label || value.reason;
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
      }
    }
    const nestedStatus = raw.status?.reason;
    if (typeof nestedStatus === 'string' && nestedStatus.trim()) return nestedStatus.trim();
  }
  return null;
};

const buildSalesMetrics = (
  activeRange,
  deals,
  users,
  companies,
  contacts,
  phases,
  spendRows,
  lostReasonsLookupRows,
  monthlyTargetDeals,
  monthlyTargetsByMonth,
  appointmentsSupported = true,
  quotesFromPhaseId = null,
  quotePhaseTimingSupported = true
) => {
  const now = new Date();
  const range = getSalesRange(activeRange);
  const monthBuckets = buildMonthBuckets(range.start, range.end);
  const monthMap = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));
  const lostReasonById = new Map(
    (lostReasonsLookupRows || [])
      .filter((row) => row && row.id && row.name)
      .map((row) => [String(row.id), String(row.name)])
  );

  const companyMap = new Map(
    (companies || []).map((company) => [
      company.id,
      {
        name: company.name || 'Onbekend',
        email: company.email || null
      }
    ])
  );
  const contactMap = new Map(
    (contacts || []).map((contact) => [
      contact.id,
      {
        name: formatFullName(contact.first_name, contact.last_name, contact.email || contact.phone || 'Contact'),
        email: contact.email || null
      }
    ])
  );
  const userMap = new Map(
    (users || []).map((user) => [
      user.id,
      formatFullName(user.first_name, user.last_name, user.email || user.phone || 'Onbekend')
    ])
  );
  const phaseMap = new Map((phases || []).map((phase) => [phase.id, phase]));

  const normalizedQuotesFromPhaseId = typeof quotesFromPhaseId === 'string' ? quotesFromPhaseId.trim() : '';
  const normalizeSortOrder = (value) => {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, Math.round(raw));
  };
  const normalizeProbability = (value) => {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return null;
    const normalized = raw > 1 ? raw / 100 : raw;
    return Math.max(0, Math.min(1, normalized));
  };
  const quoteThresholdPhase = normalizedQuotesFromPhaseId ? phaseMap.get(normalizedQuotesFromPhaseId) : null;
  const quoteThresholdPhaseName = quoteThresholdPhase?.name || (normalizedQuotesFromPhaseId || null);
  const quoteThresholdSortOrder = quoteThresholdPhase ? normalizeSortOrder(quoteThresholdPhase.sort_order) : null;
  const quoteThresholdProbability = quoteThresholdPhase ? normalizeProbability(quoteThresholdPhase.probability) : null;
  const isQuoteDeal = (deal) => {
    if (!normalizedQuotesFromPhaseId) return true;
    const phaseId = String(deal?.phase_id ?? '');
    const phase = phaseMap.get(phaseId);
    if (!phase) return phaseId === normalizedQuotesFromPhaseId;
    const sortOrder = normalizeSortOrder(phase.sort_order);
    if (quoteThresholdSortOrder !== null && sortOrder !== null) {
      return sortOrder >= quoteThresholdSortOrder;
    }
    const probability = normalizeProbability(phase.probability);
    if (quoteThresholdProbability !== null && probability !== null) {
      return probability >= quoteThresholdProbability;
    }
    return phaseId === normalizedQuotesFromPhaseId;
  };

  let allDealsInRangeCount = 0;
  const dealsInRange = [];
  const wonDeals = [];
  const lostDeals = [];
  const openDeals = [];
  const quoteDurations = [];
  const cycleDurations = [];
  const records = [];

  (deals || []).forEach((deal) => {
    const createdAt = parseDate(deal.created_at);
    if (!createdAt) return;
    if (createdAt < range.start || createdAt > range.end) return;

    allDealsInRangeCount += 1;
    if (!isQuoteDeal(deal)) return;

    dealsInRange.push(deal);
    const status = normalizeStatus(deal.status);
    const won = isWonStatus(status);
    const lost = isLostStatus(status);

    if (won) wonDeals.push(deal);
    if (lost) lostDeals.push(deal);
    if (!won && !lost) openDeals.push(deal);

    let customerName = deal.title || 'Onbekend';
    let customerEmail = '';
    if (deal.customer_type === 'company' && companyMap.has(deal.customer_id)) {
      const company = companyMap.get(deal.customer_id);
      customerName = company.name || customerName;
      customerEmail = company.email || '';
    } else if (deal.customer_type === 'contact' && contactMap.has(deal.customer_id)) {
      const contact = contactMap.get(deal.customer_id);
      customerName = contact.name || customerName;
      customerEmail = contact.email || '';
    }

    const phase = phaseMap.get(deal.phase_id);
    const phaseLabel = phase?.name || '';
    const statusType = won ? 'won' : lost ? 'lost' : 'open';
    const sellerId = deal.responsible_user_id || null;
    const sellerName = sellerId ? userMap.get(sellerId) || 'Onbekend' : null;
    const lossReason = lost ? (extractLossReason(deal, lostReasonById) || 'Onbekend') : null;
    records.push({
      record_id: deal.id,
      record_type: 'deal',
      occurred_at: deal.created_at,
      contact_name: customerName,
      contact_email: customerEmail,
      source: phaseLabel || deal.customer_type || 'Deal',
      status: deal.status || 'Onbekend',
      statusType,
      monthKey: toMonthKey(createdAt),
      seller_id: sellerId,
      seller_name: sellerName,
      loss_reason: lossReason ? String(lossReason).trim() : null,
      record_url: buildTeamleaderDealUrl(deal.id, deal.raw_data)
    });

    const updatedAt = parseDate(deal.updated_at);
    const quoteMarkerPhaseId =
      typeof deal.quote_phase_marker_phase_id === 'string' ? deal.quote_phase_marker_phase_id.trim() : '';
    const quotePhaseStartedAt = parseDate(deal.quote_phase_first_started_at);

    let quoteDays = null;
    if (normalizedQuotesFromPhaseId && quotePhaseTimingSupported) {
      if (quoteMarkerPhaseId === normalizedQuotesFromPhaseId && quotePhaseStartedAt) {
        quoteDays = diffDays(quotePhaseStartedAt, createdAt);
      }
    } else {
      quoteDays = diffDays(updatedAt, createdAt);
    }
    if (Number.isFinite(quoteDays) && quoteDays >= 0) quoteDurations.push(quoteDays);

    if (won) {
      const closedAt = parseDate(deal.closed_at);
      const cycleDays = diffDays(closedAt, createdAt);
      if (Number.isFinite(cycleDays) && cycleDays >= 0) cycleDurations.push(cycleDays);
    }

    const createdKey = toMonthKey(createdAt);
    const createdBucket = monthMap.get(createdKey);
    if (createdBucket) createdBucket.quotes += 1;

    if (won) {
      const closedAt = parseDate(deal.closed_at) || updatedAt || createdAt;
      if (closedAt) {
        const closedKey = toMonthKey(closedAt);
        const closedBucket = monthMap.get(closedKey);
        if (closedBucket) closedBucket.won += 1;
      }
    }
  });

  const openValue = openDeals.reduce((sum, deal) => sum + (Number(deal.estimated_value) || 0), 0);
  const approvalRate = safeDivide(wonDeals.length, dealsInRange.length);
  const rejectionRate = safeDivide(lostDeals.length, dealsInRange.length);
  const dealRatio = approvalRate;
  const avgQuoteTimeDays = quoteDurations.length
    ? quoteDurations.reduce((sum, value) => sum + value, 0) / quoteDurations.length
    : null;
  const avgQuoteTimeCount = quoteDurations.length;
  const avgSalesCycleDays = cycleDurations.length
    ? cycleDurations.reduce((sum, value) => sum + value, 0) / cycleDurations.length
    : null;

  const thisMonthKey = toMonthKey(new Date());
  const dealsThisMonth = dealsInRange.filter((deal) => {
    const createdAt = parseDate(deal.created_at);
    return createdAt && toMonthKey(createdAt) === thisMonthKey;
  }).length;
  const defaultTargetDeals =
    Number.isFinite(monthlyTargetDeals) && monthlyTargetDeals > 0 ? monthlyTargetDeals : SALES_TARGET_MONTHLY_DEALS;
  const monthOverrideRaw =
    monthlyTargetsByMonth && typeof monthlyTargetsByMonth === 'object'
      ? monthlyTargetsByMonth[thisMonthKey]
      : null;
  const monthOverride = typeof monthOverrideRaw === 'number' ? monthOverrideRaw : Number(monthOverrideRaw);
  const targetDeals =
    Number.isFinite(monthOverride) && monthOverride > 0 ? monthOverride : defaultTargetDeals;
  const targetPercent = safeDivide(dealsThisMonth, targetDeals);
  const remainingPercent = Math.max(0, 1 - targetPercent);

  const spendTotal = (spendRows || []).reduce((sum, row) => sum + (Number(row.spend) || 0), 0);
  const costPerCustomer = wonDeals.length ? spendTotal / wonDeals.length : null;

  const lossReasonCounts = {};
  lostDeals.forEach((deal) => {
    const reason = extractLossReason(deal, lostReasonById) || 'Onbekend';
    const key = String(reason).trim() || 'Onbekend';
    lossReasonCounts[key] = (lossReasonCounts[key] || 0) + 1;
  });
  const lossReasons = Object.entries(lossReasonCounts)
    .map(([label, count]) => ({ label, count, percent: safeDivide(count, lostDeals.length) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const openDealRows = openDeals
    .map((deal) => {
      const phase = phaseMap.get(deal.phase_id);
      let probability = Number(phase?.probability);
      if (Number.isFinite(probability) && probability > 1) probability /= 100;
      const probabilityValue = Number.isFinite(probability) ? probability : null;
      let probabilityLabel = 'Onbekend';
      let probabilityTone = 'bg-muted text-muted-foreground';
      if (Number.isFinite(probabilityValue)) {
        if (probabilityValue >= 0.7) {
          probabilityLabel = 'Hoog';
          probabilityTone = 'bg-green-100 text-green-800';
        } else if (probabilityValue >= 0.4) {
          probabilityLabel = 'Medium';
          probabilityTone = 'bg-yellow-100 text-yellow-800';
        } else {
          probabilityLabel = 'Laag';
          probabilityTone = 'bg-red-100 text-red-800';
        }
      }

      let customerName = deal.title || 'Onbekend';
      if (deal.customer_type === 'company' && companyMap.has(deal.customer_id)) {
        customerName = companyMap.get(deal.customer_id).name || customerName;
      } else if (deal.customer_type === 'contact' && contactMap.has(deal.customer_id)) {
        customerName = contactMap.get(deal.customer_id).name || customerName;
      }

      const createdAt = parseDate(deal.created_at);
      const daysOpen = createdAt ? Math.max(0, Math.round(diffDays(now, createdAt))) : null;
      return {
        id: deal.id,
        customerName,
        value: Number(deal.estimated_value) || 0,
        daysOpen,
        probabilityLabel,
        probabilityTone
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const sellerMap = new Map();
  dealsInRange.forEach((deal) => {
    const key = deal.responsible_user_id || 'unknown';
    if (!sellerMap.has(key)) {
      const name = key === 'unknown' ? 'Onbekend' : userMap.get(key) || 'Onbekend';
      sellerMap.set(key, {
        id: key,
        name,
        initials: buildInitials(name),
        appointments: 0,
        appointmentsPending: 0,
        deals: 0,
        won: 0,
        lost: 0,
        cycleSum: 0,
        cycleCount: 0,
        revenue: 0
      });
    }
    const seller = sellerMap.get(key);
    seller.deals += 1;

    if (appointmentsSupported) {
      const hadAppointmentPhase = deal?.had_appointment_phase;
      if (hadAppointmentPhase === true) {
        seller.appointments += 1;
      } else if (hadAppointmentPhase === null || hadAppointmentPhase === undefined) {
        seller.appointmentsPending += 1;
      }
    }

    const status = normalizeStatus(deal.status);
    const won = isWonStatus(status);
    const lost = isLostStatus(status);
    if (won) {
      seller.won += 1;
      seller.revenue += Number(deal.estimated_value) || 0;
      const createdAt = parseDate(deal.created_at);
      const closedAt = parseDate(deal.closed_at);
      const cycle = diffDays(closedAt, createdAt);
      if (Number.isFinite(cycle) && cycle >= 0) {
        seller.cycleSum += cycle;
        seller.cycleCount += 1;
      }
    } else if (lost) {
      seller.lost += 1;
    }
  });

  const sellers = Array.from(sellerMap.values())
    .map((seller) => ({
      ...seller,
      conversion: safeDivide(seller.won, seller.deals),
      avgCycle: seller.cycleCount ? seller.cycleSum / seller.cycleCount : null
    }))
    .sort((a, b) => b.won - a.won || b.revenue - a.revenue)
    .slice(0, 10);

  const totalRevenue = wonDeals.reduce((sum, deal) => sum + (Number(deal.estimated_value) || 0), 0);
  const summary = {
    wonDeals: wonDeals.length,
    revenue: totalRevenue,
    conversion: approvalRate,
    avgCycleDays: avgSalesCycleDays
  };

  return {
    range,
    appointmentsSupported,
    totals: {
      allDeals: allDealsInRangeCount,
      quotes: dealsInRange.length,
      won: wonDeals.length,
      lost: lostDeals.length,
      open: openDeals.length,
      openValue,
      spendTotal,
      avgQuoteTimeDays,
      avgQuoteTimeCount,
      quotePhaseName: quoteThresholdPhaseName,
      quotePhaseTimingSupported,
      avgSalesCycleDays,
      avgSalesCycleCount: cycleDurations.length,
      approvalRate,
      rejectionRate,
      dealRatio,
      costPerCustomer
    },
    target: {
      current: dealsThisMonth,
      target: targetDeals,
      percent: targetPercent,
      remainingPercent
    },
    monthly: monthBuckets,
    lossReasons,
    openDeals: openDealRows,
    records,
    sellers,
    summary,
    funnel: {
      quotes: dealsInRange.length,
      approved: wonDeals.length,
      rejected: lostDeals.length
    }
  };
};

const updateSalesStatus = (status, message) => {
  const overlay = document.querySelector('[data-sales-loading-overlay]');
  const content = document.querySelector('[data-sales-loading-content]');
  const isBlocking = status === 'loading' || status === 'idle' || status === 'error';
  if (overlay) overlay.classList.toggle('hidden', !isBlocking);
  if (content) {
    content.classList.toggle('opacity-0', isBlocking);
    content.classList.toggle('pointer-events-none', isBlocking);
    content.classList.toggle('select-none', isBlocking);
  }

  if (overlay) {
    const spinner = overlay.querySelector('[data-sales-loading-spinner]');
    if (spinner) spinner.classList.toggle('hidden', status === 'error');
    const overlayMessage = overlay.querySelector('[data-sales-loading-message]');
    if (overlayMessage) overlayMessage.textContent = message || overlayMessage.textContent;
    const panel = overlay.querySelector('[data-sales-loading-panel]');
    if (panel) {
      panel.classList.toggle('border-border/60', status !== 'error');
      panel.classList.toggle('border-destructive/30', status === 'error');
    }
  }

  const badge = document.querySelector('[data-sales-status]');
  if (badge) {
    const label = badge.querySelector('[data-sales-status-label]');
    const dot = badge.querySelector('[data-sales-status-dot]');
    if (label) label.textContent = message || label.textContent;

    const badgeStatusClass =
      status === 'ready'
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700'
        : status === 'loading' || status === 'idle'
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
          : status === 'error'
            ? 'bg-destructive/10 border-destructive/20 text-destructive'
            : 'bg-muted/60 border-border text-muted-foreground';
    badge.className = `hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${badgeStatusClass}`;

    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${
        status === 'ready'
          ? 'bg-emerald-500'
        : status === 'loading'
            ? 'bg-amber-500'
            : status === 'error'
              ? 'bg-destructive'
              : 'bg-muted-foreground/60'
      }`;
    }
  }
};

const buildTrendMarkup = (monthly) => {
  if (!Array.isArray(monthly) || monthly.length === 0) {
    return '<div class="text-sm text-muted-foreground">Geen trenddata beschikbaar.</div>';
  }

  const totalQuotes = monthly.reduce((sum, entry) => sum + (Number(entry?.quotes) || 0), 0);
  const totalWon = monthly.reduce((sum, entry) => sum + (Number(entry?.won) || 0), 0);
  if (totalQuotes === 0 && totalWon === 0) {
    return `
      <div class="h-[180px] w-full flex items-center justify-center text-sm text-muted-foreground">
        Nog geen offertes of deals in deze periode.
      </div>
      <div class="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary/80"></span>Offertes</span>
        <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500/70"></span>Deals</span>
      </div>
    `;
  }

  const maxValue = Math.max(
    1,
    ...monthly.map((entry) => Math.max(entry.quotes || 0, entry.won || 0))
  );
  const bars = monthly
    .map((entry) => {
      const quotes = Number(entry?.quotes) || 0;
      const won = Number(entry?.won) || 0;
      const quotesHeight = Math.round((quotes / maxValue) * 100);
      const wonHeight = Math.round((won / maxValue) * 100);
      return `
        <div class="flex flex-col items-center gap-2 flex-1 h-full">
          <div class="w-full flex items-end gap-1 flex-1">
            <div class="flex-1 rounded-t-md bg-primary/80" style="height:${quotesHeight}%"></div>
            <div class="flex-1 rounded-t-md bg-emerald-500/70" style="height:${wonHeight}%"></div>
          </div>
          <span class="text-xs text-muted-foreground">${entry.label}</span>
        </div>
      `;
    })
    .join('');
  return `
    <div class="flex gap-4 h-[180px] w-full">${bars}</div>
    <div class="mt-3 flex items-center justify-end gap-4 text-xs text-muted-foreground">
      <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-primary/80"></span>Offertes</span>
      <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500/70"></span>Deals</span>
    </div>
  `;
};

const buildLossReasonsMarkup = (reasons) => {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    return '<div class="text-sm text-muted-foreground">Geen verliesredenen gevonden.</div>';
  }
  return reasons
    .map((reason) => {
      const percent = Math.round((reason.percent || 0) * 100);
      const reasonLabel = escapeHtml(reason.label);
      return `
        <div class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="font-medium">${reasonLabel}</span>
            <span class="text-muted-foreground" data-sales-drill="lost" data-sales-loss-reason="${reasonLabel}">
              ${formatNumber(reason.count)} (${percent}%)
            </span>
          </div>
          <div aria-valuemax="100" aria-valuemin="0" role="progressbar" class="relative w-full overflow-hidden rounded-full bg-secondary h-2">
            <div class="h-full w-full flex-1 bg-primary transition-all" style="transform: translateX(-${100 - percent}%);"></div>
          </div>
        </div>
      `;
    })
    .join('');
};

const buildOpenDealsRows = (deals) => {
  if (!Array.isArray(deals) || deals.length === 0) {
    return `
      <tr class="border-b">
        <td colspan="4" class="p-4 text-sm text-muted-foreground">Geen open deals gevonden.</td>
      </tr>
    `;
  }
  return deals
    .map((deal) => {
      const days = Number.isFinite(deal.daysOpen) ? deal.daysOpen : '--';
      const value = Number.isFinite(deal.value) ? formatCurrency(deal.value, 0) : '--';
      const dealId = escapeHtml(String(deal.id || ''));
      const dealLabel = escapeHtml(deal.customerName);
      return `
        <tr class="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 font-medium">${dealLabel}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right">
            <span data-sales-drill="open" data-sales-record-id="${dealId}" data-sales-record-label="${dealLabel}">${value}</span>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
            <span data-sales-drill="open" data-sales-record-id="${dealId}" data-sales-record-label="${dealLabel}">${days}</span>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
            <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${deal.probabilityTone}">${escapeHtml(deal.probabilityLabel)}</div>
          </td>
        </tr>
      `;
    })
    .join('');
};
const buildFunnelMarkup = (funnel) => {
  const total = funnel.quotes || 0;
  const approved = funnel.approved || 0;
  const rejected = funnel.rejected || 0;
  const approvedRate = safeDivide(approved, total);
  const rejectedRate = safeDivide(rejected, total);
  return `
    <div class="grid gap-4 md:grid-cols-3">
      <div class="rounded-lg bg-blue-500/90 text-white p-4">
        <p class="text-xs uppercase tracking-wide text-white/70">Offertes</p>
        <p class="text-2xl font-bold" data-sales-drill="all">${formatNumber(total)}</p>
        <p class="text-xs text-white/70" data-sales-drill="all">100%</p>
      </div>
      <div class="rounded-lg bg-emerald-500/90 text-white p-4">
        <p class="text-xs uppercase tracking-wide text-white/70">Goedgekeurd</p>
        <p class="text-2xl font-bold" data-sales-drill="won">${formatNumber(approved)}</p>
        <p class="text-xs text-white/70" data-sales-drill="won">${formatPercent(approvedRate, 1)}</p>
      </div>
      <div class="rounded-lg bg-rose-500/90 text-white p-4">
        <p class="text-xs uppercase tracking-wide text-white/70">Afgekeurd</p>
        <p class="text-2xl font-bold" data-sales-drill="lost">${formatNumber(rejected)}</p>
        <p class="text-xs text-white/70" data-sales-drill="lost">${formatPercent(rejectedRate, 1)}</p>
      </div>
    </div>
  `;
};
const buildSellerRows = (sellers, options = {}) => {
  const appointmentsSupported = options.appointmentsSupported !== false;
  if (!Array.isArray(sellers) || sellers.length === 0) {
    return `
      <tr class="border-b">
        <td colspan="8" class="p-4 text-sm text-muted-foreground">Geen verkopersdata gevonden.</td>
      </tr>
    `;
  }
  return sellers
    .map((seller, index) => {
      const conversion = formatPercent(seller.conversion, 1);
      const avgCycle = seller.avgCycle ? formatDays(seller.avgCycle, 1) : '--';
      const revenue = seller.revenue ? formatCurrency(seller.revenue, 0) : '--';
      const sellerId = escapeHtml(String(seller.id || ''));
      const sellerName = escapeHtml(seller.name);
      const sellerAttrs = `data-sales-drill="all" data-sales-seller-id="${sellerId}" data-sales-seller-name="${sellerName}"`;
      const pendingAppointments = Number(seller.appointmentsPending) || 0;
      const knownAppointments = formatNumber(seller.appointments || 0);
      const appointmentLabel = pendingAppointments > 0 ? `${knownAppointments}+` : knownAppointments;
      const appointmentsCell = !appointmentsSupported
        ? `
            <span class="inline-flex items-center justify-center text-xs text-muted-foreground" title="Afspraken zijn niet beschikbaar omdat teamleader_deals.had_appointment_phase ontbreekt (migratie nog niet gedeployed).">
              --
            </span>
          `
        : pendingAppointments > 0
          ? `
              <div class="inline-flex items-center justify-center gap-2" title="Afspraken worden nog berekend voor ${pendingAppointments} deal(s). Teamleader phase history wordt op de achtergrond gesynct.">
                <span class="font-medium" ${sellerAttrs}>${appointmentLabel}</span>
                <span class="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <span class="inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin"></span>
                  <span>nog ${formatNumber(pendingAppointments)}</span>
                </span>
              </div>
            `
          : `<span class="font-medium" ${sellerAttrs}>${appointmentLabel}</span>`;
      return `
        <tr class="border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50">
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0">${index + 1}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-sm font-semibold text-primary">${escapeHtml(seller.initials)}</span>
              </div>
              <span class="font-medium">${sellerName}</span>
            </div>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">${appointmentsCell}</td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center"><span ${sellerAttrs}>${formatNumber(seller.deals)}</span></td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
            <span class="font-semibold text-primary" ${sellerAttrs}>${formatNumber(seller.won)}</span>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
            <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent hover:bg-secondary/80 bg-muted text-foreground" ${sellerAttrs}>${conversion}</div>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-center">
            <span class="text-sm text-muted-foreground" ${sellerAttrs}>${avgCycle}</span>
          </td>
          <td class="p-4 align-middle [&:has([role=checkbox])]:pr-0 text-right font-semibold"><span ${sellerAttrs}>${revenue}</span></td>
        </tr>
      `;
    })
    .join('');
};
const SALES_DRILLDOWN_CONFIG = {
  quotes_created: { filter: 'all', label: 'Offertes' },
  quotes_subtext: { filter: 'all', label: 'Offertes' },
  avg_quote_time: { filter: 'all', label: 'Deals' },
  approved_quotes: { filter: 'won', label: 'Goedgekeurde deals' },
  approval_rate: { filter: 'won', label: 'Goedgekeurde deals' },
  deal_ratio: { filter: 'won', label: 'Goedgekeurde deals' },
  avg_sales_cycle: { filter: 'won', label: 'Goedgekeurde deals' },
  open_quotes: { filter: 'open', label: 'Open deals' },
  open_value: { filter: 'open', label: 'Open deals' },
  rejected_quotes: { filter: 'lost', label: 'Afgekeurde deals' },
  rejection_rate: { filter: 'lost', label: 'Afgekeurde deals' },
  cost_per_customer: { filter: 'won', label: 'Goedgekeurde deals' },
  open_total_value: { filter: 'open', label: 'Open deals' },
  deals_this_month: { filter: 'month', label: 'Deals deze maand' },
  deals_target: { filter: 'month', label: 'Deals deze maand' },
  deals_target_percent: { filter: 'month', label: 'Deals deze maand' },
  deals_target_remaining: { filter: 'month', label: 'Deals deze maand' },
  deals_target_progress: { filter: 'month', label: 'Deals deze maand' },
  summary_won_deals: { filter: 'won', label: 'Goedgekeurde deals' },
  summary_revenue: { filter: 'won', label: 'Goedgekeurde deals' },
  summary_conversion: { filter: 'all', label: 'Deals' },
  summary_cycle: { filter: 'won', label: 'Goedgekeurde deals' },
  seller_count: { filter: 'all', label: 'Deals' }
};

const SALES_FILTER_LABELS = {
  all: 'Deals',
  won: 'Goedgekeurde deals',
  lost: 'Afgekeurde deals',
  open: 'Open deals',
  month: 'Deals deze maand'
};

const normalizeSalesKey = (value) => (value ? String(value).trim().toLowerCase() : '');

const getSalesRecordsForFilter = (records, filter, options = {}) => {
  if (!Array.isArray(records)) return [];

  let rows = records;
  const effectiveFilter = filter || 'all';

  if (effectiveFilter === 'month') {
    const monthKey = toMonthKey(new Date());
    rows = rows.filter((record) => record.monthKey === monthKey);
  } else if (effectiveFilter !== 'all') {
    rows = rows.filter((record) => record.statusType === effectiveFilter);
  }

  if (options.sellerId) {
    const sellerId = String(options.sellerId);
    rows = rows.filter((record) => String(record.seller_id || '') === sellerId);
  }

  if (options.recordId) {
    const recordId = String(options.recordId);
    rows = rows.filter((record) => String(record.record_id || '') === recordId);
  }

  if (options.lossReason) {
    const target = normalizeSalesKey(options.lossReason);
    rows = rows.filter((record) => normalizeSalesKey(record.loss_reason) === target);
  }

  return rows;
};

const openSalesDrilldownByFilter = (filter, options = {}) => {
  if (!salesState.data?.records) return;
  const effectiveFilter = filter || 'all';
  const rows = getSalesRecordsForFilter(salesState.data.records, effectiveFilter, options);

  let title = options.label || SALES_FILTER_LABELS[effectiveFilter] || 'Deals';
  if (options.recordLabel) {
    title = `Deal - ${options.recordLabel}`;
  } else if (options.sellerName) {
    title = `Deals - ${options.sellerName}`;
  } else if (options.lossReason) {
    title = `Verliesreden - ${options.lossReason}`;
  }

  drilldownState.open = true;
  drilldownState.status = 'ready';
  drilldownState.kind = `sales_${effectiveFilter}`;
  drilldownState.source = null;
  drilldownState.title = title;
  drilldownState.errorMessage = '';
  drilldownState.rows = rows;
  drilldownState.range = { ...dateRange };
  renderApp();
};

const openSalesDrilldown = (key) => {
  const config = SALES_DRILLDOWN_CONFIG[key] || { filter: 'all', label: 'Deals' };
  openSalesDrilldownByFilter(config.filter, { label: config.label });
};

const bindSalesClicks = () => {
  const elements = document.querySelectorAll('[data-sales-kpi], [data-sales-drill]');
  if (!elements.length) return;
  elements.forEach((element) => {
    if (element.dataset.salesClickBound === 'true') return;
    element.dataset.salesClickBound = 'true';
    element.classList.add('cursor-pointer', 'transition-colors', 'hover:underline');
    element.addEventListener('click', () => {
      const filter = element.getAttribute('data-sales-drill');
      if (filter) {
        openSalesDrilldownByFilter(filter, {
          label: element.getAttribute('data-sales-drill-label'),
          sellerId: element.getAttribute('data-sales-seller-id'),
          sellerName: element.getAttribute('data-sales-seller-name'),
          recordId: element.getAttribute('data-sales-record-id'),
          recordLabel: element.getAttribute('data-sales-record-label'),
          lossReason: element.getAttribute('data-sales-loss-reason')
        });
        return;
      }

      const key = element.getAttribute('data-sales-kpi');
      if (!key) return;
      openSalesDrilldown(key);
    });
  });
};

const applySalesInfoTooltips = (data) => {
  if (!data?.totals) return;
  const totals = data.totals;

  const quoteCount = Number(totals.quotes) || 0;
  const totalDeals = Number(totals.allDeals) || 0;
  const wonCount = Number(totals.won) || 0;
  const lostCount = Number(totals.lost) || 0;
  const openCount = Number(totals.open) || 0;
  const openValue = Number(totals.openValue) || 0;
  const spendTotal = Number(totals.spendTotal) || 0;
  const avgQuoteTimeCount = Number(totals.avgQuoteTimeCount) || 0;
  const quotePhaseName =
    typeof totals.quotePhaseName === 'string' && totals.quotePhaseName.trim() ? totals.quotePhaseName.trim() : null;
  const quotePhaseTimingSupported = totals.quotePhaseTimingSupported === true;
  const avgSalesCycleCount = Number(totals.avgSalesCycleCount) || 0;

  const avgQuoteTimeTooltip =
    quotePhaseName && quotePhaseTimingSupported
      ? `Gem. tijd tot offerte = gemiddelde van (eerste keer fase "${quotePhaseName}" bereikt - created_at) in dagen. Nu: ${formatDays(
          totals.avgQuoteTimeDays
        )} over ${formatNumber(avgQuoteTimeCount)} deals met gekende fase-timestamp (totaal offertes: ${formatNumber(quoteCount)}).`
      : `Gem. tijd tot offerte = gemiddelde van (updated_at - created_at) in dagen over alle offertes. Nu: ${formatDays(
          totals.avgQuoteTimeDays
        )} over ${formatNumber(avgQuoteTimeCount || quoteCount)} offertes.`;

  const tooltips = {
    quotes_created: `Offertes gemaakt = aantal deals in de periode die als offerte tellen. Nu: ${formatNumber(quoteCount)} van ${formatNumber(totalDeals)} totale deals.`,
    avg_quote_time: avgQuoteTimeTooltip,
    approved_quotes: `Goedgekeurde offertes = aantal offertes met status WON. Formule: ${formatNumber(wonCount)} / ${formatNumber(quoteCount)} = ${formatPercent(
      totals.approvalRate,
      1
    )}.`,
    deal_ratio: `Deal ratio = goedgekeurde offertes / totale offertes. Formule: ${formatNumber(wonCount)} / ${formatNumber(
      quoteCount
    )} = ${formatPercent(totals.dealRatio, 1)}.`,
    avg_sales_cycle: `Gem. sales cycle = gemiddelde van (closed_at - created_at) in dagen voor gewonnen deals met closed_at. Nu: ${formatDays(
      totals.avgSalesCycleDays
    )} over ${formatNumber(avgSalesCycleCount)} deals met closed_at (totaal gewonnen: ${formatNumber(wonCount)}).`,
    open_quotes: `Hangende offertes = offertes - goedgekeurd - afgekeurd. Formule: ${formatNumber(
      quoteCount
    )} - ${formatNumber(wonCount)} - ${formatNumber(lostCount)} = ${formatNumber(
      openCount
    )}. Open waarde = som estimated_value van open deals (${formatCurrency(openValue, 0)}).`,
    rejected_quotes: `Afgekeurde offertes = aantal offertes met status LOST. Formule: ${formatNumber(lostCount)} / ${formatNumber(
      quoteCount
    )} = ${formatPercent(totals.rejectionRate, 1)}.`,
    cost_per_customer: wonCount
      ? `Kost per klant = totale spend / gewonnen deals. Formule: ${formatCurrency(spendTotal, 0)} / ${formatNumber(
          wonCount
        )} = ${formatCurrency(totals.costPerCustomer, 0)}.`
      : 'Kost per klant = totale spend / gewonnen deals. Nog niet berekend omdat er 0 gewonnen deals zijn in deze periode.'
  };

  Object.entries(tooltips).forEach(([key, text]) => {
    const valueNode = document.querySelector(`[data-sales-kpi="${key}"]`);
    const card = valueNode?.closest('.kpi-card');
    const infoIcon = card?.querySelector('.lucide-info');
    if (card) {
      card.setAttribute('title', text);
      card.setAttribute('aria-label', text);
    }
    if (!infoIcon) return;

    infoIcon.setAttribute('title', text);
    infoIcon.setAttribute('aria-label', text);

    const existingTitleNode = infoIcon.querySelector('title');
    if (existingTitleNode) {
      existingTitleNode.textContent = text;
    } else {
      const titleNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      titleNode.textContent = text;
      infoIcon.prepend(titleNode);
    }
  });
};

const applySalesData = (data) => {
  if (!data) return;

  const setKpi = (key, value) => {
    const element = document.querySelector(`[data-sales-kpi="${key}"]`);
    if (element) element.textContent = value;
  };

  setKpi('quotes_created', formatNumber(data.totals.quotes));
  setKpi('quotes_subtext', `Van ${formatNumber(data.totals.allDeals)} deals`);
  setKpi('avg_quote_time', formatDays(data.totals.avgQuoteTimeDays));
  const quotePhaseName =
    typeof data.totals.quotePhaseName === 'string' && data.totals.quotePhaseName.trim()
      ? data.totals.quotePhaseName.trim()
      : '';
  const quotePhaseTimingSupported = data.totals.quotePhaseTimingSupported === true;
  setKpi(
    'avg_quote_time_subtext',
    quotePhaseName
      ? quotePhaseTimingSupported
        ? `Tot fase "${quotePhaseName}"`
        : `Tot fase "${quotePhaseName}" (fallback)`
      : 'Tot offertefase'
  );
  setKpi('approved_quotes', formatNumber(data.totals.won));
  setKpi('approval_rate', `${formatPercent(data.totals.approvalRate, 1)} approval rate`);
  setKpi('deal_ratio', formatPercent(data.totals.dealRatio, 1));
  setKpi('avg_sales_cycle', formatDays(data.totals.avgSalesCycleDays));
  setKpi('open_quotes', formatNumber(data.totals.open));
  setKpi('open_value', data.totals.openValue ? `${formatCurrency(data.totals.openValue, 0)} waarde` : '--');
  setKpi('rejected_quotes', formatNumber(data.totals.lost));
  setKpi('rejection_rate', `${formatPercent(data.totals.rejectionRate, 1)} rejection rate`);
  setKpi(
    'cost_per_customer',
    Number.isFinite(data.totals.costPerCustomer) ? formatCurrency(data.totals.costPerCustomer, 0) : '--'
  );
  setKpi('open_total_value', data.totals.openValue ? `${formatCurrency(data.totals.openValue, 0)} totaal` : '--');
  applySalesInfoTooltips(data);

  setKpi('deals_this_month', formatNumber(data.target.current));
  setKpi('deals_target', formatNumber(data.target.target));
  setKpi('deals_target_percent', formatPercent(data.target.percent, 0));
  setKpi('deals_target_remaining', `${formatNumber(data.target.remainingPercent * 100, 0)}% te gaan`);

  const progress = document.querySelector('[data-sales-kpi="deals_target_progress"]');
  if (progress) {
    progress.style.transform = `translateX(-${formatNumber(data.target.remainingPercent * 100, 0)}%)`;
  }

  const trend = document.querySelector('[data-sales-trend]');
  if (trend) trend.innerHTML = buildTrendMarkup(data.monthly);

  const reasons = document.querySelector('[data-sales-loss-reasons]');
  if (reasons) reasons.innerHTML = buildLossReasonsMarkup(data.lossReasons);

  const openDeals = document.querySelector('[data-sales-open-deals]');
  if (openDeals) openDeals.innerHTML = buildOpenDealsRows(data.openDeals);

  const funnel = document.querySelector('[data-sales-funnel]');
  if (funnel) funnel.innerHTML = buildFunnelMarkup(data.funnel);

  const sellers = document.querySelector('[data-sales-seller-rows]');
  if (sellers) sellers.innerHTML = buildSellerRows(data.sellers, { appointmentsSupported: data.appointmentsSupported });
  setKpi('seller_count', `${formatNumber(data.sellers.length)} verkopers`);

  setKpi('summary_won_deals', formatNumber(data.summary.wonDeals));
  setKpi('summary_revenue', data.summary.revenue ? formatCurrency(data.summary.revenue, 0) : '--');
  setKpi('summary_conversion', formatPercent(data.summary.conversion, 1));
  setKpi('summary_cycle', data.summary.avgCycleDays ? `${formatNumber(data.summary.avgCycleDays, 1)} d` : '--');

  bindSalesClicks();
  updateSalesStatus(data.totals.allDeals > 0 ? 'ready' : 'empty', data.totals.allDeals > 0 ? 'Live data' : 'Nog geen data');
};

const renderSalesDateControls = () => {
  const controls = document.querySelector('[data-sales-date-controls]');
  if (!controls) return;

  const startLabel = controls.querySelector('[data-sales-date-start]');
  const endLabel = controls.querySelector('[data-sales-date-end]');
  if (startLabel) startLabel.textContent = formatDisplayDate(dateRange.start);
  if (endLabel) endLabel.textContent = formatDisplayDate(dateRange.end);

  const startButton = controls.querySelector('[data-date-trigger="start"]');
  const endButton = controls.querySelector('[data-date-trigger="end"]');
  if (startButton) {
    startButton.classList.toggle('active', pickerState.open && pickerState.selecting === 'start');
  }
  if (endButton) {
    endButton.classList.toggle('active', pickerState.open && pickerState.selecting === 'end');
  }

  const pickerContainer = controls.querySelector('[data-sales-date-picker]');
  if (pickerContainer) {
    pickerContainer.innerHTML = renderDatePicker(dateRange);
  }
};

const ensureSalesData = async () => {
  if (!supabase) return;
  const activeLocationId = configState.locationId || ghlLocationId;
  if (!activeLocationId) {
    if (configState.status === 'idle') {
      loadLocationConfig();
    }
    if (configState.status === 'loading') {
      updateSalesStatus('loading', 'Dashboard config laden...');
    } else if (configState.status === 'error') {
      updateSalesStatus('error', configState.errorMessage || 'Location ID ontbreekt.');
    }
    return;
  }

  const key = buildRangeKey(dateRange);
  if (salesState.rangeKey === key && salesState.status === 'ready') {
    applySalesData(salesState.data);
    return;
  }
  if (salesState.inFlight) return;

  if (salesState.rangeKey !== key) {
    salesState.status = 'idle';
    salesState.data = null;
  }

  salesState.status = 'loading';
  salesState.inFlight = true;
  salesState.errorMessage = '';
  salesState.rangeKey = key;
  updateSalesStatus('loading', 'Syncen...');

  const range = getSalesRange(dateRange);
  const startIso = range.start.toISOString();
  const endIso = range.end.toISOString();
  const spendStart = range.start.toISOString().slice(0, 10);
  const spendEnd = range.end.toISOString().slice(0, 10);

  try {
    const dealsSelectBase =
      'id,title,location_id,created_at,updated_at,closed_at,status,customer_type,customer_id,responsible_user_id,phase_id,estimated_value,estimated_value_currency,raw_data';
    const quotePhaseSelect =
      'quote_phase_marker_phase_id,quote_phase_first_started_at,quote_phase_last_checked_at';
    const dealsSelectWithAllOptional = `${dealsSelectBase},had_appointment_phase,${quotePhaseSelect}`;
    const dealsSelectWithoutAppointments = `${dealsSelectBase},${quotePhaseSelect}`;
    const dealsSelectWithoutQuotePhase = `${dealsSelectBase},had_appointment_phase`;
    let appointmentsSupported = true;
    let quotePhaseTimingSupported = true;

    const buildDealsQuery = (selectClause) => () =>
      supabase
        .from('teamleader_deals')
        .select(selectClause)
        .eq('location_id', activeLocationId)
        .gte('created_at', startIso)
        .lte('created_at', endIso);

    const dealsPromise = (async () => {
      const attempts = [
        { selectClause: dealsSelectWithAllOptional, appointments: true, quoteTiming: true },
        { selectClause: dealsSelectWithoutAppointments, appointments: false, quoteTiming: true },
        { selectClause: dealsSelectWithoutQuotePhase, appointments: true, quoteTiming: false },
        { selectClause: dealsSelectBase, appointments: false, quoteTiming: false }
      ];

      let lastMissingColumnError = null;
      for (const attempt of attempts) {
        try {
          const rows = await fetchAllRows(buildDealsQuery(attempt.selectClause));
          appointmentsSupported = attempt.appointments;
          quotePhaseTimingSupported = attempt.quoteTiming;
          return rows;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          if (!message.includes('does not exist')) throw error;
          lastMissingColumnError = error;
        }
      }

      throw lastMissingColumnError || new Error('Kon teamleader_deals niet laden.');
    })();

    const buildUsersQuery = () =>
      supabase
        .from('teamleader_users')
        .select('id,first_name,last_name,email,phone')
        .eq('location_id', activeLocationId);

    const buildCompaniesQuery = () =>
      supabase.from('teamleader_companies').select('id,name,email').eq('location_id', activeLocationId);

    const buildContactsQuery = () =>
      supabase
        .from('teamleader_contacts')
        .select('id,first_name,last_name,email,phone')
        .eq('location_id', activeLocationId);

    const buildPhasesQuery = (selectClause) => () =>
      supabase
        .from('teamleader_deal_phases')
        .select(selectClause)
        .eq('location_id', activeLocationId);

    const phasesPromise = (async () => {
      try {
        return await fetchAllRows(buildPhasesQuery('id,name,probability,sort_order'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes('sort_order') && message.includes('does not exist')) {
          console.warn('teamleader_deal_phases.sort_order ontbreekt nog; fallback op probability-gebaseerde fasefiltering.');
          return await fetchAllRows(buildPhasesQuery('id,name,probability'));
        }
        throw error;
      }
    })();

      const [
        deals,
        users,
        companies,
        contacts,
        phases,
        spendRows,
        lostReasonsLookup
      ] = await Promise.all([
        dealsPromise,
        fetchAllRows(buildUsersQuery),
        fetchAllRows(buildCompaniesQuery),
        fetchAllRows(buildContactsQuery),
        phasesPromise,
        supabase
          .from('marketing_spend_daily')
          .select('spend,date')
          .eq('location_id', activeLocationId)
          .gte('date', spendStart)
          .lte('date', spendEnd)
          .then(({ data, error }) => {
            if (error) throw error;
            return data || [];
          }),
        supabase
          .from('teamleader_lost_reasons')
          .select('id,name')
          .eq('location_id', activeLocationId)
          .then(({ data, error }) => {
            if (error) {
              console.warn('Unable to load Teamleader lost reasons lookup', error);
              return [];
            }
            return data || [];
          })
      ]);

    if (!appointmentsSupported) {
      console.warn('teamleader_deals.had_appointment_phase ontbreekt nog; afspraken KPI gebruikt fallback.');
    }
    if (!quotePhaseTimingSupported && configState.salesQuotesFromPhaseId) {
      console.warn('teamleader_deals.quote_phase_* ontbreekt nog; Gem. Tijd tot Offerte gebruikt fallback op updated_at.');
    }

    const data = buildSalesMetrics(
      dateRange,
      deals,
      users,
      companies,
      contacts,
      phases,
      spendRows,
      lostReasonsLookup,
      configState.salesMonthlyDealsTarget,
      configState.salesMonthlyDealsTargets,
      appointmentsSupported,
      configState.salesQuotesFromPhaseId,
      quotePhaseTimingSupported
    );
    salesState.status = 'ready';
    salesState.data = data;
    salesState.inFlight = false;
    applySalesData(data);
  } catch (error) {
    salesState.status = 'error';
    salesState.errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    salesState.inFlight = false;
    updateSalesStatus('error', 'Fout bij sync');
    console.error('Sales sync failed', error);
  }
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
  if (!settingsEnabled) return '';

  const loggedIn = Boolean(authSession);
  const userEmail = authSession?.user?.email || '';
  const kpiOnlyMode = settingsModeEnabled && !adminModeEnabled;
  const canManageKpi = loggedIn || kpiOnlyMode;
  const modalTitle = settingsButtonLabel;
  const modalSubtitle = adminModeEnabled
    ? 'Beheer GHL integratie, kostattributie en KPI targets.'
    : 'Stel Sales KPI targets in voor dit dashboard.';
  const signOutButtonMarkup = loggedIn
    ? '<button type="button" class="admin-ghost" data-admin-signout>Uitloggen</button>'
    : '';
  const adminBusy = adminState.loading || adminState.status === 'saving';
  const mappingBusy = adminState.mapping.loading || adminState.mapping.saving;
  const mappingStatusClass = adminState.mapping.status === 'error' ? 'error' : 'success';
  const kpiBusy = adminState.kpi.loading || adminState.kpi.saving;
  const kpiStatusClass = adminState.kpi.status === 'error' ? 'error' : 'success';
  const monthlyDealsTargetValue =
    adminState.kpi.monthlyDealsTarget ||
    String(
      Number.isFinite(configState.salesMonthlyDealsTarget) && configState.salesMonthlyDealsTarget > 0
        ? Math.round(configState.salesMonthlyDealsTarget)
        : SALES_TARGET_MONTHLY_DEALS
    );
  const kpiYearRaw = Number(adminState.kpi.year);
  const kpiYear = Number.isFinite(kpiYearRaw) ? kpiYearRaw : new Date().getFullYear();
  const monthOverrides =
    adminState.kpi.monthlyDealsTargets &&
    typeof adminState.kpi.monthlyDealsTargets === 'object' &&
    !Array.isArray(adminState.kpi.monthlyDealsTargets)
      ? adminState.kpi.monthlyDealsTargets
      : {};
  const monthRowsMarkup = Array.from({ length: 12 })
    .map((_, idx) => {
      const month = idx + 1;
      const monthKey = `${kpiYear}-${pad2(month)}`;
      const label = `${MONTH_LABELS_NL[idx]} ${kpiYear}`;
      const value = monthOverrides[monthKey] ?? '';
      return `
        <tr>
          <td>${escapeHtml(label)}</td>
          <td>
            <input
              type="number"
              class="admin-input admin-mapping-input"
              value="${escapeHtml(String(value))}"
              placeholder="${escapeHtml(monthlyDealsTargetValue)}"
              min="1"
              step="1"
              data-kpi-month="${escapeHtml(monthKey)}"
              ${kpiBusy ? 'disabled' : ''}
            />
          </td>
        </tr>
      `;
    })
    .join('');

  const quotesFromPhaseIdValue = String(
    adminState.kpi.quotesFromPhaseId ?? configState.salesQuotesFromPhaseId ?? ''
  ).trim();
  const normalizeProbability = (value) => {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return null;
    const normalized = raw > 1 ? raw / 100 : raw;
    return Math.max(0, Math.min(1, normalized));
  };
  const normalizeSortOrder = (value) => {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return null;
    return Math.max(0, Math.round(raw));
  };
  const quotePhaseRows = (Array.isArray(adminState.kpi.quotesPhaseOptions) ? adminState.kpi.quotesPhaseOptions : [])
    .filter((row) => row && row.id && row.name)
    .map((row) => {
      const id = String(row.id);
      const name = String(row.name);
      const prob = normalizeProbability(row.probability);
      const sortOrder = normalizeSortOrder(row.sort_order);
      return { id, name, prob, sortOrder };
    })
    .sort((a, b) => {
      if (a.sortOrder !== null && b.sortOrder !== null && a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      const aProb = a.prob ?? 2;
      const bProb = b.prob ?? 2;
      if (aProb !== bProb) return aProb - bProb;
      return a.name.localeCompare(b.name);
    });
  const quotePhaseOptionsMarkup = [
    `<option value=""${quotesFromPhaseIdValue ? '' : ' selected'}>Alle deals (geen fase-filter)</option>`,
    ...quotePhaseRows.map((row) => {
      const orderLabel = row.sortOrder !== null ? `#${row.sortOrder + 1}` : null;
      const probLabel = row.prob !== null ? `${Math.round(row.prob * 100)}%` : null;
      const suffixParts = [orderLabel, probLabel].filter(Boolean);
      const suffix = suffixParts.length ? ` (${suffixParts.join(' · ')})` : '';
      const label = `${row.name}${suffix}`;
      const selected = row.id === quotesFromPhaseIdValue ? ' selected' : '';
      return `<option value="${escapeHtml(row.id)}"${selected}>${escapeHtml(label)}</option>`;
    })
  ].join('');

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
      <div class="admin-panel" role="dialog" aria-label="${escapeHtml(modalTitle)}">
        <div class="admin-header">
          <div>
            <h3 class="admin-title">${escapeHtml(modalTitle)}</h3>
            <p class="admin-subtitle">${escapeHtml(modalSubtitle)}</p>
          </div>
          <div class="admin-header-actions">
            ${signOutButtonMarkup}
            <button type="button" class="admin-close" data-admin-close>Sluit</button>
          </div>
        </div>
        ${
          canManageKpi
            ? `<div class="admin-meta">${
                loggedIn
                  ? `Ingelogd als ${escapeHtml(userEmail)}`
                  : 'Je hoeft niet in te loggen om KPI targets aan te passen.'
              }</div>
               ${
                 adminModeEnabled && loggedIn && adminState.loading
                   ? '<div class="admin-meta">Integratie wordt geladen...</div>'
                   : ''
               }
               ${
                 adminModeEnabled && loggedIn
                   ? `<form class="admin-form" data-admin-form>
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
                      </form>`
                   : ''
               }
                <div class="admin-section">
                  <div class="admin-section-header">
                    <div>
                      <h4 class="admin-section-title">Sales KPI</h4>
                      <p class="admin-section-subtitle">
                        Stel je default target in en override per maand. Leeg laten bij een maand = default.
                      </p>
                    </div>
                    <div class="admin-mapping-toolbar">
                      <button type="button" class="admin-submit" data-kpi-save ${kpiBusy ? 'disabled' : ''}>
                        ${adminState.kpi.saving ? 'Opslaan...' : 'Opslaan'}
                      </button>
                    </div>
                  </div>
                  ${
                    adminState.kpi.message
                      ? `<div class="admin-message ${kpiStatusClass}">${adminState.kpi.message}</div>`
                      : ''
                  }
                  ${adminState.kpi.loading ? '<div class="admin-meta">KPI wordt geladen...</div>' : ''}
                   <div class="admin-form">
                     <label class="admin-label">
                       Default maandtarget (deals)
                       <input type="number" class="admin-input" value="${escapeHtml(monthlyDealsTargetValue)}" min="1" step="1" data-kpi-monthly-deals-target ${kpiBusy ? 'disabled' : ''} />
                     </label>
                     <div class="admin-meta">Gebruikt in de \"Deals deze maand\" target card.</div>
                     <label class="admin-label">
                       Offertes tellen vanaf fase
                       <select class="admin-input" data-kpi-quotes-from-phase ${kpiBusy ? 'disabled' : ''}>
                         ${quotePhaseOptionsMarkup}
                       </select>
                     </label>
                     <div class="admin-meta">
                       Kies de Teamleader fase die overeenkomt met \"Offerte verzonden klant\". Leeg = alle deals tellen als offerte.
                     </div>
                     ${quotePhaseRows.length ? '' : '<div class="admin-meta">Geen Teamleader fases gevonden. Run eerst teamleader-sync.</div>'}
                   </div>
                  <div class="admin-mapping-block">
                    <div class="admin-mapping-toolbar">
                      <button type="button" class="admin-ghost" data-kpi-year-prev ${kpiBusy ? 'disabled' : ''}>Vorige jaar</button>
                      <div class="admin-meta">Jaar: ${kpiYear}</div>
                      <button type="button" class="admin-ghost" data-kpi-year-next ${kpiBusy ? 'disabled' : ''}>Volgende jaar</button>
                    </div>
                    <div class="admin-mapping-table-wrapper">
                      <table class="admin-mapping-table">
                        <thead>
                          <tr>
                            <th>Maand</th>
                            <th>Deals target (override)</th>
                          </tr>
                        </thead>
                        <tbody>${monthRowsMarkup}</tbody>
                      </table>
                    </div>
                    <div class="admin-meta">Leeg = gebruikt default target (placeholder).</div>
                  </div>
                </div>
                ${
                  adminModeEnabled && loggedIn
                    ? `<div class="admin-section">
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
                    : ''
                }`
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
const renderNavLinks = (activeId, tabs = ALL_DASHBOARD_TABS) =>
  tabs
    .map((item) => {
      const isActive = item.id === activeId;
      const label = escapeHtml(item.label);
      return `<li>
      <a class="nav-link${isActive ? ' active' : ''}" href="${item.href}"${isActive ? ' aria-current="page"' : ''}>
        ${item.icon}
        <span>${label}</span>
      </a>
    </li>`;
    })
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

const renderDrilldownRows = (rows, options = {}) =>
  rows
    .map((row) => {
      const occurred = formatDateTime(row.occurred_at);
      const contactName = row.contact_name ? escapeHtml(row.contact_name) : '--';
      const contactEmail = row.contact_email ? escapeHtml(row.contact_email) : '--';
      const source = row.source ? escapeHtml(row.source) : 'Onbekend';
      const status = row.status ? escapeHtml(row.status) : '--';
      const type = row.record_type ? escapeHtml(row.record_type) : 'record';
      const teamleaderUrl = options.showTeamleader
        ? row.record_url || buildTeamleaderDealUrl(row.record_id)
        : "";
      const teamleaderCell = options.showTeamleader
        ? `<td class="px-3 py-2 text-sm text-foreground">${
            teamleaderUrl
              ? `<a class="text-primary hover:underline" href="${escapeHtml(teamleaderUrl)}" target="_blank" rel="noreferrer">Open</a>`
              : '--'
          }</td>`
        : "";

      return `<tr class="border-b last:border-0">
          <td class="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">${type}</td>
          <td class="px-3 py-2 text-sm text-foreground">${occurred}</td>
          <td class="px-3 py-2 text-sm text-foreground">${contactName}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${contactEmail}</td>
          <td class="px-3 py-2 text-sm text-foreground">${source}</td>
          <td class="px-3 py-2 text-sm text-muted-foreground">${status}</td>
          ${teamleaderCell}
        </tr>`;
    })
    .join('');
const renderDrilldownModal = () => {
  if (!drilldownState.open) return '';

  const range = drilldownState.range;
  const rangeLabel = range ? `${formatDisplayDate(range.start)} -> ${formatDisplayDate(range.end)}` : '';
  const sourceLabel = getDrilldownFilterLabel(drilldownState.kind, drilldownState.source);
  const subtitle = [rangeLabel, sourceLabel].filter(Boolean).join(' | ');
  const showTeamleaderLink = String(drilldownState.kind || '').startsWith('sales_');

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
              ${showTeamleaderLink ? '<th>Teamleader</th>' : ''}
              
            </tr>
          </thead>
          <tbody>
            ${renderDrilldownRows(drilldownState.rows, { showTeamleader: showTeamleaderLink })}
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

const resolveLayoutSections = (layoutOverride) => {
  const rawLayout = layoutOverride ?? configState.dashboardLayout;
  let sections = null;
  if (Array.isArray(rawLayout)) {
    sections = rawLayout;
  } else if (rawLayout && Array.isArray(rawLayout.sections)) {
    sections = rawLayout.sections;
  }

  const normalized = (sections || []).filter((section) => section && typeof section === 'object');
  return normalized.length ? normalized : DEFAULT_LAYOUT;
};

const resolveDashboardTabs = (layoutOverride) => {
  const rawLayout = layoutOverride ?? configState.dashboardLayout;
  const rawTabs = rawLayout && Array.isArray(rawLayout.dashboards) ? rawLayout.dashboards : null;
  if (!rawTabs) return ALL_DASHBOARD_TABS;

  const normalized = rawTabs
    .map((entry) => {
      if (typeof entry === 'string') {
        const base = DASHBOARD_LOOKUP.get(entry);
        return base ? { ...base } : null;
      }
      if (!entry || typeof entry !== 'object') return null;
      const id = entry.id || entry.key || '';
      const base = DASHBOARD_LOOKUP.get(id);
      if (!base) return null;
      const enabled = entry.enabled !== false && entry.hidden !== true;
      if (!enabled) return null;
      const label = typeof entry.label === 'string' && entry.label.trim() ? entry.label.trim() : base.label;
      return { ...base, label };
    })
    .filter(Boolean);

  return normalized.length ? normalized : ALL_DASHBOARD_TABS;
};

const resolveBranding = () => {
  const title = configState.dashboardTitle || DEFAULT_BRANDING.title;
  const headerSubtitle = configState.dashboardSubtitle || DEFAULT_BRANDING.headerSubtitle;
  const pageSubtitle = configState.dashboardSubtitle || DEFAULT_BRANDING.pageSubtitle;
  const logoUrl = configState.dashboardLogoUrl || DEFAULT_BRANDING.logoUrl;
  const logoAlt = title ? `${title} logo` : DEFAULT_BRANDING.logoAlt;

  return {
    title: escapeHtml(title),
    headerSubtitle: escapeHtml(headerSubtitle),
    pageSubtitle: escapeHtml(pageSubtitle),
    logoUrl: escapeHtml(logoUrl),
    logoAlt: escapeHtml(logoAlt)
  };
};

const resolveSectionText = (value, fallback) => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

const resolveSectionLabels = (section) => {
  if (!section) return null;
  if (Array.isArray(section.metric_labels)) return section.metric_labels;
  if (Array.isArray(section.metricLabels)) return section.metricLabels;
  return null;
};

const filterCardsByLabels = (cards, labels) => {
  if (!Array.isArray(cards)) return [];
  if (!Array.isArray(labels) || labels.length === 0) return cards;
  const lookup = new Map(cards.map((card) => [card.label, card]));
  return labels.map((label) => lookup.get(label)).filter(Boolean);
};

const isSectionEnabled = (section) => section?.enabled !== false && section?.hidden !== true;

const renderFunnelSection = (section, metrics) => {
  const cards = filterCardsByLabels(metrics.funnelMetrics, resolveSectionLabels(section));
  if (!cards.length) return '';
  const title = escapeHtml(resolveSectionText(section?.title, 'Funnel Metrics'));
  const description = resolveSectionText(section?.description, 'Overzicht van leads en afspraken');
  const descriptionMarkup = description ? `<p class="text-sm text-gray-500 mb-4">${escapeHtml(description)}</p>` : '';
  const columns =
    typeof section?.columns === 'string' && section.columns.trim()
      ? section.columns.trim()
      : 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3';
  const showBadge = cards.some((card) => card.isMock !== false);

  return `
    <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        ${icons.users('lucide lucide-users w-5 h-5 text-primary')}
        ${title}
        ${showBadge ? mockBadge : ''}
      </h2>
      ${descriptionMarkup}
      <div class="${columns}">
        ${renderKpiCards(cards)}
      </div>
    </section>
  `;
};

const renderFinanceSection = (section, metrics) => {
  const cards = filterCardsByLabels(metrics.financeMetrics, resolveSectionLabels(section));
  if (!cards.length) return '';
  const title = escapeHtml(resolveSectionText(section?.title, 'Financiele Metrics'));
  const description = resolveSectionText(section?.description, 'Totale leadkosten en kost per lead');
  const descriptionMarkup = description ? `<p class="text-sm text-gray-500 mb-4">${escapeHtml(description)}</p>` : '';
  const columns =
    typeof section?.columns === 'string' && section.columns.trim()
      ? section.columns.trim()
      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4';
  const showBadge = !cards.some((card) => card.isMock === false);

  return `
    <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        ${icons.dollar('lucide lucide-dollar-sign w-5 h-5 text-primary')}
        ${title}
        ${showBadge ? mockBadge : ''}
      </h2>
      ${descriptionMarkup}
      <div class="${columns}">
        ${renderKpiCards(cards)}
      </div>
    </section>
  `;
};

const renderSourceBreakdownSection = (section, metrics) => {
  const title = escapeHtml(resolveSectionText(section?.title, 'Source Breakdown'));
  const description = resolveSectionText(
    section?.description,
    'Prestaties per leadgenerator - Leads = opportunities in periode - extra kolom = afspraken zonder lead in periode'
  );
  const descriptionMarkup = description ? `<p class="text-sm text-gray-500 mb-4">${escapeHtml(description)}</p>` : '';

  return `
    <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        ${icons.chartColumn('lucide lucide-chart-column w-5 h-5 text-primary')}
        ${title}
        ${metrics.sourceRowsLive ? '' : mockBadge}
      </h2>
      ${descriptionMarkup}
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
  `;
};

const renderHookPerformanceSection = (section, metrics) => {
  const title = escapeHtml(resolveSectionText(section?.title, 'Ad Hook Performance'));
  const description = resolveSectionText(section?.description, 'Vergelijk de prestaties van je advertentie hooks');
  const descriptionMarkup = description ? `<p class="text-sm text-gray-500 mb-4">${escapeHtml(description)}</p>` : '';

  return `
    <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        ${icons.chartColumn('lucide lucide-chart-column w-5 h-5 text-primary')}
        ${title}
        ${metrics.hookPerformanceLive ? '' : mockBadge}
      </h2>
      ${descriptionMarkup}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${renderHookHighlights(metrics.hookHighlights.best, metrics.hookHighlights.worst)}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${renderHookCards(metrics.hookCards, metrics.hookPerformanceLive)}
      </div>
    </section>
  `;
};

const renderLostReasonsSection = (section, metrics) => {
  const title = escapeHtml(resolveSectionText(section?.title, 'Analyse & Inzichten'));
  const description = resolveSectionText(section?.description, 'Verloren leads en verdeling per reden');
  const descriptionMarkup = description ? `<p class="text-sm text-gray-500 mb-4">${escapeHtml(description)}</p>` : '';

  return `
    <section class="bg-white/50 rounded-2xl p-6 shadow-sm border border-gray-200">
      <h2 class="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
        ${icons.triangleAlert('lucide lucide-triangle-alert w-5 h-5 text-orange-500')}
        ${title}
        ${metrics.lostReasonsLive ? '' : mockBadge}
      </h2>
      ${descriptionMarkup}
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
  `;
};

const renderDashboardSections = (layoutOverride, metrics) => {
  const sections = resolveLayoutSections(layoutOverride);
  return sections
    .filter(isSectionEnabled)
    .map((section) => {
      const kind = String(section?.kind || section?.type || '').trim();
      if (!kind) return '';
      if (kind === 'funnel_metrics') return renderFunnelSection(section, metrics);
      if (kind === 'source_breakdown') return renderSourceBreakdownSection(section, metrics);
      if (kind === 'finance_metrics') return renderFinanceSection(section, metrics);
      if (kind === 'hook_performance') return renderHookPerformanceSection(section, metrics);
      if (kind === 'lost_reasons') return renderLostReasonsSection(section, metrics);
      return '';
    })
    .filter(Boolean)
    .join('');
};

const getRequiredLiveData = (layoutOverride) => {
  const required = {
    opportunities: false,
    appointments: false,
    sourceBreakdown: false,
    hookPerformance: false,
    finance: false,
    spendBySource: false,
    lostReasons: false
  };

  const sections = resolveLayoutSections(layoutOverride);
  sections.forEach((section) => {
    if (!isSectionEnabled(section)) return;
    const kind = String(section?.kind || section?.type || '').trim();
    if (kind === 'funnel_metrics') {
      required.opportunities = true;
      required.appointments = true;
    } else if (kind === 'source_breakdown') {
      required.sourceBreakdown = true;
      required.spendBySource = true;
    } else if (kind === 'finance_metrics') {
      required.finance = true;
    } else if (kind === 'hook_performance') {
      required.hookPerformance = true;
      required.spendBySource = true;
    } else if (kind === 'lost_reasons') {
      required.lostReasons = true;
    }
  });

  return required;
};

const root = document.getElementById('root');

const buildMarkup = (range, layoutOverride, routeId = 'lead', dashboardTabs = ALL_DASHBOARD_TABS) => {
  const metrics = applyLiveOverrides(computeMetrics(range), range);
  const debugInfo = getOpportunityDebug(range);
  const layout = resolveLayoutSections(layoutOverride);
  const requiredLive = getRequiredLiveData(layout);
  const branding = resolveBranding();
  const sidebarFooter = configState.dashboardTitle ? `${branding.title} Dashboard` : 'Dashboard Template';
  const activeRoute = routeId || 'lead';

  const rangeKey = buildRangeKey(range);
  const isDoneForKey = (state) =>
    state?.rangeKey === rangeKey && (state?.status === 'ready' || state?.status === 'error');

  const wantsHookPerformance =
    requiredLive.hookPerformance && Boolean(configState.hookFieldId || configState.campaignFieldId);

  const liveDone =
    (!requiredLive.opportunities || isDoneForKey(liveState.opportunities)) &&
    (!requiredLive.appointments || isDoneForKey(liveState.appointments)) &&
    (!requiredLive.sourceBreakdown || isDoneForKey(liveState.sourceBreakdown)) &&
    (!requiredLive.finance || isDoneForKey(liveState.finance)) &&
    (!requiredLive.spendBySource || isDoneForKey(liveState.spendBySource)) &&
    (!wantsHookPerformance || isDoneForKey(liveState.hookPerformance)) &&
    (!requiredLive.lostReasons || isDoneForKey(liveState.lostReasons));

  // Prevent a flash of placeholder/mock values: show a loader overlay until required live data is ready (or errored).
  const showLoadingOverlay = Boolean(supabase) && configState.status !== 'error' && (!liveDone || configState.status !== 'ready');
  const loadingOverlayMarkup = showLoadingOverlay
    ? `
      <div class="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-start justify-center">
        <div class="mt-16 sm:mt-24 flex flex-col items-center gap-3 px-6 py-4 rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <div class="h-10 w-10 rounded-full border-4 border-muted-foreground/20 border-t-primary animate-spin"></div>
          <p class="text-sm font-semibold text-muted-foreground">Data laden...</p>
        </div>
      </div>
    `
    : '';

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
              <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-9 w-auto object-contain" />
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
              ${renderNavLinks(activeRoute, dashboardTabs)}
            </ul>
          </div>
        </nav>
        <div class="p-4 border-t border-sidebar-border">
          <p class="text-xs text-sidebar-foreground/60 text-center">${sidebarFooter}</p>
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
                <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-10 w-auto object-contain" />
              </div>
              <div class="hidden sm:block">
                <div class="text-lg font-bold text-primary tracking-tight">${branding.title}</div>
                <p class="text-xs text-muted-foreground -mt-0.5">${branding.headerSubtitle}</p>
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
              settingsEnabled
                ? `<button class="admin-trigger" type="button" data-admin-open>${settingsButtonLabel}</button>`
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
              <h1 class="text-2xl font-bold text-foreground tracking-tight">${branding.title}</h1>
              <p class="text-sm text-muted-foreground">${branding.pageSubtitle}</p>
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
           <div class="mt-6 relative">
             ${loadingOverlayMarkup}
            <div class="space-y-8${showLoadingOverlay ? ' opacity-0 pointer-events-none select-none' : ''}">
              ${renderDashboardSections(layout, metrics)}
            </div>
           </div>
         </main>
        <footer class="h-12 border-t border-border bg-card/50 flex items-center justify-center px-6">
          <p class="text-xs text-muted-foreground font-medium">(c) 2026 ${branding.title} - ${branding.headerSubtitle}</p>
        </footer>
      </div>
    </div>
    ${renderDrilldownModal()}
    ${renderAdminModal()}
  `;
};

const buildSalesMarkup = (dashboardTabs = ALL_DASHBOARD_TABS) => {
  const branding = resolveBranding();
  const sidebarFooter = configState.dashboardTitle ? `${branding.title} Dashboard` : 'Dashboard Template';
  const salesKey = buildRangeKey(dateRange);
  const showLoadingOverlay = Boolean(supabase) && (salesState.status !== 'ready' || salesState.rangeKey !== salesKey);
  const initialDealCount = salesState?.data?.totals?.deals;
  const salesStatus = MOCK_ENABLED
    ? {
        label: 'Mock data',
        className: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
        dotClass: 'bg-amber-500'
      }
    : showLoadingOverlay
      ? {
          label: 'Data laden...',
          className: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
          dotClass: 'bg-amber-500'
        }
      : initialDealCount > 0
        ? {
            label: 'Live data',
            className: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700',
            dotClass: 'bg-emerald-500'
          }
        : {
            label: 'Nog geen data',
            className: 'bg-muted/60 border-border text-muted-foreground',
            dotClass: 'bg-muted-foreground/60'
          };

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
            <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-8 w-auto" />
          </div>
          <button class="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground hidden lg:flex" data-sidebar-toggle>
            ${icons.chevronLeft('lucide lucide-chevron-left w-4 h-4 transition-transform')}
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-4 px-3">
          <div class="mb-6">
            <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Dashboards</h3>
            <ul class="space-y-1">
              ${renderNavLinks('sales', dashboardTabs)}
            </ul>
          </div>
        </nav>
        <div class="p-4 border-t border-sidebar-border">
          <p class="text-xs text-muted-foreground text-center">${sidebarFooter}</p>
        </div>
      </aside>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-16 border-b border-border bg-gradient-to-r from-card via-card to-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
          <div class="flex items-center gap-4">
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 lg:hidden hover:bg-secondary" aria-label="Sluit menu" data-sidebar-toggle>
              ${icons.menu('lucide lucide-menu h-5 w-5')}
            </button>
            <div class="flex items-center gap-3">
              <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-10 w-auto object-contain" />
              <div class="hidden sm:block">
                <div class="text-lg font-bold text-foreground tracking-tight">${branding.title}</div>
                <p class="text-xs text-muted-foreground -mt-0.5">${branding.headerSubtitle}</p>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${salesStatus.className}" data-sales-status>
              <div class="w-2 h-2 rounded-full ${salesStatus.dotClass}" data-sales-status-dot></div>
              <span class="text-xs font-medium" data-sales-status-label>${salesStatus.label}</span>
            </div>
            ${
              settingsEnabled
                ? `<button class="admin-trigger" type="button" data-admin-open>${settingsButtonLabel}</button>`
                : ''
            }
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 hover:bg-secondary" title="Herlaad pagina" data-action="refresh">
              ${icons.refresh('lucide lucide-refresh-cw h-4 w-4')}
            </button>
          </div>
        </header>
        <main class="flex-1 p-6 overflow-auto relative">
          <div class="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm flex items-start justify-center${
            showLoadingOverlay ? '' : ' hidden'
          }" data-sales-loading-overlay>
            <div class="mt-16 sm:mt-24 flex flex-col items-center gap-3 px-6 py-4 rounded-2xl border border-border/60 bg-card/80 shadow-sm" data-sales-loading-panel>
              <div class="h-10 w-10 rounded-full border-4 border-muted-foreground/20 border-t-primary animate-spin" data-sales-loading-spinner></div>
              <p class="text-sm font-semibold text-muted-foreground" data-sales-loading-message>Data laden...</p>
            </div>
          </div>
          <div class="${showLoadingOverlay ? 'opacity-0 pointer-events-none select-none' : ''}" data-sales-loading-content>
            ${SALES_MAIN_MARKUP}
          </div>
        </main>
        <footer class="h-12 border-t border-border bg-card/30 flex items-center justify-center px-6">
          <p class="text-xs text-muted-foreground font-medium">(c) 2026 ${branding.title} - ${branding.headerSubtitle}</p>
        </footer>
      </div>
    </div>
    ${renderDrilldownModal()}
    ${renderAdminModal()}
  `;
};

const buildCallCenterMarkup = (dashboardTabs = ALL_DASHBOARD_TABS) => {
  const branding = resolveBranding();
  const sidebarFooter = configState.dashboardTitle ? `${branding.title} Dashboard` : 'Dashboard Template';

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
              <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-9 w-auto object-contain" />
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
              ${renderNavLinks('call-center', dashboardTabs)}
            </ul>
          </div>
        </nav>
        <div class="p-4 border-t border-sidebar-border">
          <p class="text-xs text-sidebar-foreground/60 text-center">${sidebarFooter}</p>
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
                <img src="${branding.logoUrl}" alt="${branding.logoAlt}" class="h-10 w-auto object-contain" />
              </div>
              <div class="hidden sm:block">
                <div class="text-lg font-bold text-primary tracking-tight">${branding.title}</div>
                <p class="text-xs text-muted-foreground -mt-0.5">${branding.headerSubtitle}</p>
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
              settingsEnabled
                ? `<button class="admin-trigger" type="button" data-admin-open>${settingsButtonLabel}</button>`
                : ''
            }
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground h-10 w-10 hover:bg-accent" title="Herlaad pagina" data-action="refresh">
              ${icons.refresh('lucide lucide-refresh-cw h-4 w-4')}
            </button>
          </div>
        </header>
        <main class="flex-1 p-6 overflow-auto">
          <div class="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 class="text-2xl font-bold text-foreground tracking-tight">Call Center</h1>
              <p class="text-sm text-muted-foreground">Binnenkort beschikbaar. We vullen dit zodra de Teamleader data klaarstaat.</p>
            </div>
          </div>
          <div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <p class="text-sm text-muted-foreground">
              Hier komen de call center KPI's, agent performance en kwaliteitsscores. Zodra we de datafeed hebben, bouwen we dit verder uit.
            </p>
          </div>
        </main>
        <footer class="h-12 border-t border-border bg-card/50 flex items-center justify-center px-6">
          <p class="text-xs text-muted-foreground font-medium">(c) 2026 ${branding.title} - ${branding.headerSubtitle}</p>
        </footer>
      </div>
    </div>
    ${renderDrilldownModal()}
    ${renderAdminModal()}
  `;
};

const renderApp = () => {
  if (!root) return;
  const dashboardTabs = resolveDashboardTabs();
  const routeId = getRouteId(dashboardTabs);
  if (routeId === 'sales') {
    root.innerHTML = buildSalesMarkup(dashboardTabs);
    renderSalesDateControls();
    bindInteractions();
    bindSalesClicks();
    ensureSalesData();
    return;
  }
  if (routeId === 'call-center') {
    root.innerHTML = buildCallCenterMarkup(dashboardTabs);
    bindInteractions();
    ensureLatestSync();
    return;
  }

  const layout = resolveLayoutSections();
  const required = getRequiredLiveData(layout);
  root.innerHTML = buildMarkup(dateRange, layout, routeId, dashboardTabs);
  bindInteractions();
  if (required.opportunities) ensureOpportunityCount(dateRange);
  if (required.appointments) ensureAppointmentCounts(dateRange);
  ensureLatestSync();
  if (required.sourceBreakdown) ensureSourceBreakdown(dateRange);
  if (required.hookPerformance) ensureHookPerformance(dateRange);
  if (required.finance) ensureFinanceSummary(dateRange);
  if (required.spendBySource) ensureSpendBySource(dateRange);
  if (required.lostReasons) ensureLostReasons(dateRange);
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

  if (settingsEnabled) {
    document.querySelectorAll('[data-admin-open]').forEach((button) => {
      button.addEventListener('click', () => {
        adminState.open = true;
        adminState.status = 'idle';
        adminState.message = '';
        adminState.auth.message = '';
        adminState.auth.status = 'idle';
        adminState.loading = false;
        adminState.kpi.message = '';
        renderApp();
        if (authSession) {
          if (adminModeEnabled) {
            loadAdminIntegration();
            loadSpendMapping();
          }
          loadKpiSettings();
        } else if (settingsModeEnabled && !adminModeEnabled) {
          loadKpiSettings();
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
        resetKpiState();
        resetBillingState();
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

    const kpiMonthlyDealsTarget = document.querySelector('[data-kpi-monthly-deals-target]');
    if (kpiMonthlyDealsTarget) {
      kpiMonthlyDealsTarget.addEventListener('input', (event) => {
        adminState.kpi.monthlyDealsTarget = event.target.value;
        adminState.kpi.hasChanges = true;
      });
    }

    const kpiQuotesFromPhase = document.querySelector('[data-kpi-quotes-from-phase]');
    if (kpiQuotesFromPhase) {
      kpiQuotesFromPhase.addEventListener('change', (event) => {
        adminState.kpi.quotesFromPhaseId = event.target.value;
        adminState.kpi.hasChanges = true;
      });
    }

    const kpiYearPrev = document.querySelector('[data-kpi-year-prev]');
    if (kpiYearPrev) {
      kpiYearPrev.addEventListener('click', () => {
        const current = Number(adminState.kpi.year);
        adminState.kpi.year = Number.isFinite(current) ? current - 1 : new Date().getFullYear() - 1;
        renderApp();
      });
    }

    const kpiYearNext = document.querySelector('[data-kpi-year-next]');
    if (kpiYearNext) {
      kpiYearNext.addEventListener('click', () => {
        const current = Number(adminState.kpi.year);
        adminState.kpi.year = Number.isFinite(current) ? current + 1 : new Date().getFullYear() + 1;
        renderApp();
      });
    }

    document.querySelectorAll('[data-kpi-month]').forEach((input) => {
      input.addEventListener('input', (event) => {
        const key = input.getAttribute('data-kpi-month');
        if (!key) return;
        const value = String(event.target.value ?? '').trim();
        if (!adminState.kpi.monthlyDealsTargets || typeof adminState.kpi.monthlyDealsTargets !== 'object') {
          adminState.kpi.monthlyDealsTargets = {};
        }
        if (!value) {
          delete adminState.kpi.monthlyDealsTargets[key];
        } else {
          adminState.kpi.monthlyDealsTargets[key] = value;
        }
        adminState.kpi.hasChanges = true;
      });
    });

    const kpiSave = document.querySelector('[data-kpi-save]');
    if (kpiSave) {
      kpiSave.addEventListener('click', () => {
        saveKpiSettings();
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






