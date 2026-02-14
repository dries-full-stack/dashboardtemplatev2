import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-admin-token',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

const requiredEnv = (key: string, fallback = '') => {
  const value = Deno.env.get(key) ?? fallback;
  if (!value) {
    throw new Error(`Missing ${key} in function env.`);
  }
  return value;
};

const getStripeSecretKey = () => requiredEnv('STRIPE_SECRET_KEY');
const getStripeWebhookSecret = () => requiredEnv('STRIPE_WEBHOOK_SECRET');
const getStripeSalesPriceId = () => Deno.env.get('STRIPE_SALES_PRICE_ID') ?? '';
const getBillingAdminToken = () => Deno.env.get('BILLING_ADMIN_TOKEN') ?? '';
const getStripeSetupCurrency = () => (Deno.env.get('STRIPE_SETUP_CURRENCY') ?? 'eur').toLowerCase();

let cachedSupabase: ReturnType<typeof createClient> | null = null;
const getSupabase = () => {
  if (cachedSupabase) return cachedSupabase;
  const url = requiredEnv('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '';
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in function env.');
  }
  cachedSupabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false }
  });
  return cachedSupabase;
};

type Json = Record<string, unknown>;

const jsonResponse = (status: number, body: Json) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

const readText = (value: unknown) => {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return text;
};

const normalizeSlug = (value: unknown) =>
  readText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const parsePositiveInt = (value: unknown, fallback = 1) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(1, Math.floor(number));
};

const parseDashboardSelection = (value: unknown) => {
  const allowed = new Set(['lead', 'sales', 'call-center']);
  const source = Array.isArray(value) ? value : readText(value).split(',');
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of source) {
    const normalized = normalizeSlug(raw);
    if (!normalized || !allowed.has(normalized) || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

const parseJsonBody = async (req: Request): Promise<Json> => {
  try {
    const body = (await req.json()) as Json;
    return body && typeof body === 'object' ? body : {};
  } catch (_error) {
    return {};
  }
};

const isAllowedRedirectUrl = (candidate: string) => {
  try {
    const url = new URL(candidate);
    if (url.protocol === 'https:') return true;
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) return true;
    return false;
  } catch (_error) {
    return false;
  }
};

const toStripeBody = (values: Record<string, string | number | boolean | null | undefined>) => {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;
    form.set(key, String(value));
  }
  return form;
};

const stripeRequest = async (path: string, method: 'GET' | 'POST' = 'GET', body?: URLSearchParams) => {
  const stripeSecretKey = getStripeSecretKey();
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {})
    },
    body: method === 'POST' ? body : undefined
  });

  const text = await response.text();
  let json: Json = {};
  try {
    json = text ? (JSON.parse(text) as Json) : {};
  } catch (_error) {
    json = {};
  }

  if (!response.ok) {
    const message = readText((json.error as Json | undefined)?.message) || text || 'Stripe API request failed';
    throw new Error(message);
  }

  return json;
};

const parseStripeTimestamp = (value: unknown) => {
  const unix = Number(value);
  if (!Number.isFinite(unix) || unix <= 0) return null;
  return new Date(unix * 1000).toISOString();
};

const mergeMetadata = (base: unknown, patch: Record<string, unknown>) => {
  const current = base && typeof base === 'object' ? (base as Record<string, unknown>) : {};
  return {
    ...current,
    ...patch
  };
};

const getBillingCustomerBySlug = async (slug: string) => {
  const { data, error } = await getSupabase().from('billing_customers').select('*').eq('slug', slug).maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown> | null;
};

const getBillingCustomerByStripeCustomer = async (stripeCustomerId: string) => {
  const { data, error } = await getSupabase()
    .from('billing_customers')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown> | null;
};

const getBillingCustomerByStripeSubscription = async (stripeSubscriptionId: string) => {
  const { data, error } = await getSupabase()
    .from('billing_customers')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown> | null;
};

const upsertBillingCustomerBySlug = async (slug: string, patch: Record<string, unknown>, metadataPatch: Record<string, unknown> = {}) => {
  const existing = await getBillingCustomerBySlug(slug);
  const payload = {
    slug,
    ...patch,
    metadata: mergeMetadata(existing?.metadata, metadataPatch),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await getSupabase()
    .from('billing_customers')
    .upsert(payload, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown>;
};

const updateBillingCustomerByStripeCustomer = async (
  stripeCustomerId: string,
  patch: Record<string, unknown>,
  metadataPatch: Record<string, unknown> = {}
) => {
  const existing = await getBillingCustomerByStripeCustomer(stripeCustomerId);
  if (!existing) return null;
  const payload = {
    ...patch,
    metadata: mergeMetadata(existing.metadata, metadataPatch),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await getSupabase()
    .from('billing_customers')
    .update(payload)
    .eq('id', existing.id as number)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as Record<string, unknown>;
};

const ensureDefaultPaymentMethod = async (stripeCustomerId: string) => {
  const customer = await stripeRequest(`customers/${encodeURIComponent(stripeCustomerId)}?expand[]=invoice_settings.default_payment_method`);
  const invoiceSettings = (customer.invoice_settings as Record<string, unknown> | undefined) ?? {};
  const currentDefault = invoiceSettings.default_payment_method;

  if (typeof currentDefault === 'string' && currentDefault) {
    return currentDefault;
  }
  if (currentDefault && typeof currentDefault === 'object') {
    const id = readText((currentDefault as Record<string, unknown>).id);
    if (id) return id;
  }

  const paymentMethods = await stripeRequest(
    `customers/${encodeURIComponent(stripeCustomerId)}/payment_methods?type=card&limit=1`
  );
  const first = Array.isArray(paymentMethods.data) ? (paymentMethods.data[0] as Record<string, unknown> | undefined) : undefined;
  const paymentMethodId = readText(first?.id);
  if (!paymentMethodId) return '';

  await stripeRequest(
    `customers/${encodeURIComponent(stripeCustomerId)}`,
    'POST',
    toStripeBody({
      'invoice_settings[default_payment_method]': paymentMethodId
    })
  );
  return paymentMethodId;
};

const createSetupSession = async (payload: Json) => {
  const slug = normalizeSlug(payload.slug ?? payload.client ?? payload.customer_slug);
  const seats = parsePositiveInt(payload.seats, 1);
  const requestedDashboards = parseDashboardSelection(payload.requested_dashboards ?? payload.dashboards);
  const dashboardsCsv = requestedDashboards.join(',');
  const salesRequested = requestedDashboards.includes('sales');
  const salesSeats = salesRequested ? parsePositiveInt(payload.sales_seats, seats) : null;
  const email = readText(payload.email);
  const company = readText(payload.company);
  const successUrl = readText(payload.success_url);
  const cancelUrl = readText(payload.cancel_url);
  const setupCurrency = (readText(payload.currency) || getStripeSetupCurrency()).toLowerCase();

  if (!slug) {
    return jsonResponse(400, { error: 'slug is verplicht' });
  }
  if (!/^[a-z]{3}$/.test(setupCurrency)) {
    return jsonResponse(400, { error: 'currency moet een ISO code met 3 letters zijn (bv. eur)' });
  }
  if (!successUrl || !isAllowedRedirectUrl(successUrl)) {
    return jsonResponse(400, { error: 'success_url ontbreekt of is ongeldig' });
  }
  if (!cancelUrl || !isAllowedRedirectUrl(cancelUrl)) {
    return jsonResponse(400, { error: 'cancel_url ontbreekt of is ongeldig' });
  }

  const existing = await getBillingCustomerBySlug(slug);
  let stripeCustomerId = readText(existing?.stripe_customer_id);

  if (!stripeCustomerId) {
    const customerBody: Record<string, string | number | boolean | null | undefined> = {
      email: email || undefined,
      name: company || undefined,
      'metadata[customer_slug]': slug,
      'metadata[source]': 'dashboard-seats-setup'
    };
    if (dashboardsCsv) customerBody['metadata[requested_dashboards]'] = dashboardsCsv;
    if (salesSeats) customerBody['metadata[sales_seats]'] = salesSeats;
    const customer = await stripeRequest('customers', 'POST', toStripeBody(customerBody));
    stripeCustomerId = readText(customer.id);
  }

  const session = await stripeRequest(
    'checkout/sessions',
    'POST',
    toStripeBody({
      mode: 'setup',
      customer: stripeCustomerId,
      currency: setupCurrency,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'auto',
      'payment_method_types[0]': 'card',
      'metadata[customer_slug]': slug,
      'metadata[pending_seats]': seats,
      'metadata[source]': 'dashboard-seats-setup',
      ...(dashboardsCsv ? { 'metadata[requested_dashboards]': dashboardsCsv } : {}),
      ...(salesSeats ? { 'metadata[sales_seats]': salesSeats } : {})
    })
  );

  await upsertBillingCustomerBySlug(
    slug,
    {
      company: company || (existing?.company as string | null) || null,
      contact_email: email || (existing?.contact_email as string | null) || null,
      stripe_customer_id: stripeCustomerId,
      subscription_status: 'setup_pending',
      last_checkout_session_id: readText(session.id) || null
    },
    {
      pending_seats: seats,
      requested_dashboards: requestedDashboards,
      requested_dashboards_csv: dashboardsCsv || null,
      sales_seats: salesSeats,
      pending_source: 'precheckout',
      last_setup_session_created_at: new Date().toISOString()
    }
  );

  return jsonResponse(200, {
    ok: true,
    url: readText(session.url),
    session_id: readText(session.id),
    stripe_customer_id: stripeCustomerId,
    requested_dashboards: requestedDashboards
  });
};

const requireAdminToken = (req: Request) => {
  const adminToken = getBillingAdminToken();
  if (!adminToken) {
    return { error: jsonResponse(500, { error: 'BILLING_ADMIN_TOKEN ontbreekt in function env' }) };
  }

  const provided = readText(req.headers.get('x-admin-token'));
  if (!provided || provided !== adminToken) {
    return { error: jsonResponse(401, { error: 'Ongeldige admin token' }) };
  }
  return { ok: true as const };
};

const finalizeSubscription = async (req: Request, payload: Json) => {
  const auth = requireAdminToken(req);
  if ('error' in auth) return auth.error;

  const slug = normalizeSlug(payload.slug ?? payload.client ?? payload.customer_slug);
  const seats = parsePositiveInt(payload.seats, 1);
  const priceId = readText(payload.price_id) || getStripeSalesPriceId();
  const contactEmail = readText(payload.email);

  if (!slug) {
    return jsonResponse(400, { error: 'slug is verplicht' });
  }
  if (!priceId) {
    return jsonResponse(400, { error: 'price_id ontbreekt (of zet STRIPE_SALES_PRICE_ID in env)' });
  }

  const customerRow = await getBillingCustomerBySlug(slug);
  if (!customerRow) {
    return jsonResponse(404, { error: `Geen billing_customers record voor slug "${slug}"` });
  }

  const stripeCustomerId = readText(payload.customer_id) || readText(customerRow.stripe_customer_id);
  if (!stripeCustomerId) {
    return jsonResponse(400, { error: 'Geen stripe_customer_id beschikbaar. Laat eerst kaart koppelen.' });
  }

  const defaultPaymentMethod = await ensureDefaultPaymentMethod(stripeCustomerId);
  if (!defaultPaymentMethod) {
    return jsonResponse(400, { error: 'Geen kaart gevonden op customer. Laat eerst kaart koppelen via setup checkout.' });
  }

  let stripeSubscriptionId = readText(customerRow.stripe_subscription_id);
  let subscription: Json | null = null;

  if (stripeSubscriptionId) {
    try {
      subscription = await stripeRequest(`subscriptions/${encodeURIComponent(stripeSubscriptionId)}`);
      const status = readText(subscription.status);
      const updatable = ['active', 'trialing', 'past_due', 'unpaid', 'incomplete'].includes(status);

      if (updatable) {
        const items = (subscription.items as Record<string, unknown> | undefined)?.data;
        const firstItem = Array.isArray(items) ? (items[0] as Record<string, unknown> | undefined) : undefined;
        const itemId = readText(firstItem?.id);
        if (!itemId) {
          return jsonResponse(500, { error: 'Bestaande subscription heeft geen item om te updaten' });
        }

        subscription = await stripeRequest(
          `subscriptions/${encodeURIComponent(stripeSubscriptionId)}`,
          'POST',
          toStripeBody({
            [`items[0][id]`]: itemId,
            [`items[0][price]`]: priceId,
            [`items[0][quantity]`]: seats,
            default_payment_method: defaultPaymentMethod,
            proration_behavior: 'create_prorations',
            'metadata[customer_slug]': slug,
            'metadata[active_seats]': seats
          })
        );
      } else {
        stripeSubscriptionId = '';
      }
    } catch (_error) {
      stripeSubscriptionId = '';
    }
  }

  if (!stripeSubscriptionId) {
    subscription = await stripeRequest(
      'subscriptions',
      'POST',
      toStripeBody({
        customer: stripeCustomerId,
        'items[0][price]': priceId,
        'items[0][quantity]': seats,
        default_payment_method: defaultPaymentMethod,
        collection_method: 'charge_automatically',
        'metadata[customer_slug]': slug,
        'metadata[active_seats]': seats
      })
    );
    stripeSubscriptionId = readText(subscription.id);
  }

  const status = readText(subscription?.status) || 'unknown';
  const periodStart = parseStripeTimestamp((subscription as Json).current_period_start);
  const periodEnd = parseStripeTimestamp((subscription as Json).current_period_end);
  const cancelAtPeriodEnd = Boolean((subscription as Json).cancel_at_period_end === true);
  const canceledAt = parseStripeTimestamp((subscription as Json).canceled_at);

  const updated = await upsertBillingCustomerBySlug(
    slug,
    {
      company: readText(payload.company) || (customerRow.company as string | null) || null,
      contact_email: contactEmail || (customerRow.contact_email as string | null) || null,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      subscription_status: status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: canceledAt,
      last_event_type: 'admin.finalize_subscription',
      last_event_at: new Date().toISOString()
    },
    {
      pending_seats: null,
      active_seats: seats,
      last_finalized_at: new Date().toISOString(),
      last_default_payment_method: defaultPaymentMethod
    }
  );

  return jsonResponse(200, {
    ok: true,
    slug,
    seats,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    subscription_status: status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    billing_customer_id: updated.id
  });
};

const toIsoOrNull = (value: unknown) => {
  const text = readText(value);
  return text || null;
};

const getMetadataInt = (metadata: unknown, key: string) => {
  const source = metadata && typeof metadata === 'object' ? (metadata as Record<string, unknown>) : {};
  const raw = source[key];
  if (raw === null || raw === undefined) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
};

const toBillingOverviewRow = (row: Record<string, unknown>) => {
  const metadata = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {};
  return {
    id: Number(row.id) || null,
    slug: readText(row.slug) || null,
    company: readText(row.company) || null,
    contact_email: readText(row.contact_email) || null,
    stripe_customer_id: readText(row.stripe_customer_id) || null,
    stripe_subscription_id: readText(row.stripe_subscription_id) || null,
    subscription_status: readText(row.subscription_status) || 'unknown',
    current_period_start: toIsoOrNull(row.current_period_start),
    current_period_end: toIsoOrNull(row.current_period_end),
    cancel_at_period_end: row.cancel_at_period_end === true,
    canceled_at: toIsoOrNull(row.canceled_at),
    last_invoice_status: readText(row.last_invoice_status) || null,
    last_invoice_paid_at: toIsoOrNull(row.last_invoice_paid_at),
    last_invoice_failed_at: toIsoOrNull(row.last_invoice_failed_at),
    last_checkout_completed_at: toIsoOrNull(row.last_checkout_completed_at),
    active_seats: getMetadataInt(metadata, 'active_seats'),
    pending_seats: getMetadataInt(metadata, 'pending_seats'),
    updated_at: toIsoOrNull(row.updated_at)
  };
};

const adminOverview = async (req: Request, payload: Json) => {
  const auth = requireAdminToken(req);
  if ('error' in auth) return auth.error;

  const slugFilter = normalizeSlug(payload.slug ?? payload.client ?? payload.customer_slug);
  const requestedLimit = parsePositiveInt(payload.limit, 200);
  const limit = Math.min(500, requestedLimit);

  let query = getSupabase()
    .from('billing_customers')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (slugFilter) {
    query = query.eq('slug', slugFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = Array.isArray(data) ? data.map((item) => toBillingOverviewRow(item as Record<string, unknown>)) : [];
  const activeLikeStatuses = new Set(['active', 'trialing', 'past_due', 'unpaid']);
  const withSubscription = rows.filter((item) => Boolean(item.stripe_subscription_id));
  const activeLike = rows.filter((item) => activeLikeStatuses.has(readText(item.subscription_status)));

  return jsonResponse(200, {
    ok: true,
    count: rows.length,
    summary: {
      total_customers: rows.length,
      with_subscription: withSubscription.length,
      active_like_subscriptions: activeLike.length
    },
    customers: rows
  });
};

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};

const verifyStripeSignature = async (rawBody: string, signatureHeader: string, secret: string) => {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) ?? '';
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > 300) return false;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payload = encoder.encode(`${timestamp}.${rawBody}`);

  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payload);
  const digest = toHex(new Uint8Array(signature));

  return signatures.some((candidate) => timingSafeEqual(candidate, digest));
};

const updateFromSubscriptionObject = async (subscription: Json, event: Json) => {
  const subscriptionId = readText(subscription.id);
  const customerId = readText(subscription.customer);
  if (!subscriptionId && !customerId) return;

  let row: Record<string, unknown> | null = null;
  if (customerId) row = await getBillingCustomerByStripeCustomer(customerId);
  if (!row && subscriptionId) row = await getBillingCustomerByStripeSubscription(subscriptionId);
  if (!row) return;

  const payload = {
    stripe_customer_id: customerId || (row.stripe_customer_id as string | null) || null,
    stripe_subscription_id: subscriptionId || (row.stripe_subscription_id as string | null) || null,
    subscription_status: readText(subscription.status) || 'unknown',
    current_period_start: parseStripeTimestamp(subscription.current_period_start),
    current_period_end: parseStripeTimestamp(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end === true,
    canceled_at: parseStripeTimestamp(subscription.canceled_at),
    last_event_id: readText(event.id) || null,
    last_event_type: readText(event.type) || null,
    last_event_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await getSupabase().from('billing_customers').update(payload).eq('id', row.id as number);
  if (error) {
    throw new Error(error.message);
  }
};

const updateFromInvoiceObject = async (invoice: Json, event: Json) => {
  const customerId = readText(invoice.customer);
  if (!customerId) return;
  const row = await getBillingCustomerByStripeCustomer(customerId);
  if (!row) return;

  const status = readText(invoice.status) || null;
  const paidAt = parseStripeTimestamp(invoice.status_transitions && (invoice.status_transitions as Json).paid_at);
  const transitions = (invoice.status_transitions as Json | undefined) ?? {};
  const failedAt =
    parseStripeTimestamp(transitions.marked_uncollectible_at) ||
    parseStripeTimestamp(transitions.finalized_at) ||
    parseStripeTimestamp(event.created) ||
    parseStripeTimestamp(invoice.created);

  const payload = {
    last_invoice_id: readText(invoice.id) || null,
    last_invoice_status: status,
    last_invoice_paid_at: paidAt,
    last_invoice_failed_at: status === 'open' || status === 'uncollectible' ? failedAt : null,
    last_event_id: readText(event.id) || null,
    last_event_type: readText(event.type) || null,
    last_event_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await getSupabase().from('billing_customers').update(payload).eq('id', row.id as number);
  if (error) {
    throw new Error(error.message);
  }
};

const updateFromSetupCheckout = async (session: Json, event: Json) => {
  const customerId = readText(session.customer);
  const slugFromMeta = normalizeSlug((session.metadata as Json | undefined)?.customer_slug);
  const pendingSeats = parsePositiveInt((session.metadata as Json | undefined)?.pending_seats, 1);
  const checkoutSessionId = readText(session.id);
  const completedAt = new Date().toISOString();

  if (readText(session.mode) !== 'setup') return;
  if (!customerId && !slugFromMeta) return;

  const setupIntentId = readText(session.setup_intent);
  let paymentMethodId = '';
  if (setupIntentId) {
    const setupIntent = await stripeRequest(`setup_intents/${encodeURIComponent(setupIntentId)}`);
    paymentMethodId = readText(setupIntent.payment_method);
  }

  if (customerId && paymentMethodId) {
    await stripeRequest(
      `customers/${encodeURIComponent(customerId)}`,
      'POST',
      toStripeBody({
        'invoice_settings[default_payment_method]': paymentMethodId
      })
    );
  }

  if (customerId) {
    const byCustomer = await updateBillingCustomerByStripeCustomer(
      customerId,
      {
        stripe_customer_id: customerId,
        subscription_status: 'setup_completed',
        last_checkout_session_id: checkoutSessionId || null,
        last_checkout_completed_at: completedAt,
        last_event_id: readText(event.id) || null,
        last_event_type: readText(event.type) || null,
        last_event_at: completedAt
      },
      {
        pending_seats: pendingSeats,
        card_setup_completed_at: completedAt,
        default_payment_method: paymentMethodId || null
      }
    );
    if (byCustomer) return;
  }

  if (slugFromMeta) {
    await upsertBillingCustomerBySlug(
      slugFromMeta,
      {
        stripe_customer_id: customerId || null,
        subscription_status: 'setup_completed',
        last_checkout_session_id: checkoutSessionId || null,
        last_checkout_completed_at: completedAt,
        last_event_id: readText(event.id) || null,
        last_event_type: readText(event.type) || null,
        last_event_at: completedAt
      },
      {
        pending_seats: pendingSeats,
        card_setup_completed_at: completedAt,
        default_payment_method: paymentMethodId || null
      }
    );
  }
};

const storeWebhookEvent = async (event: Json) => {
  const object = ((event.data as Json | undefined)?.object as Json | undefined) ?? {};
  const payload = {
    event_id: readText(event.id),
    event_type: readText(event.type) || 'unknown',
    livemode: event.livemode === true,
    created_unix: Number(event.created) || null,
    event_created_at: parseStripeTimestamp(event.created),
    customer_id: readText(object.customer) || null,
    subscription_id: readText(object.subscription) || (readText(object.object) === 'subscription' ? readText(object.id) : null),
    checkout_session_id: readText(object.object) === 'checkout.session' ? readText(object.id) : null,
    payment_link_id: readText(object.payment_link) || null,
    client_reference_id: readText(object.client_reference_id) || null,
    customer_slug: normalizeSlug((object.metadata as Json | undefined)?.customer_slug) || null,
    payload: event,
    received_at: new Date().toISOString()
  };

  const { error } = await getSupabase().from('billing_webhook_events').upsert(payload, { onConflict: 'event_id' });
  if (error) {
    throw new Error(error.message);
  }
};

const handleWebhook = async (req: Request) => {
  const stripeWebhookSecret = getStripeWebhookSecret();
  if (!stripeWebhookSecret) {
    return jsonResponse(500, { error: 'STRIPE_WEBHOOK_SECRET ontbreekt in function env' });
  }

  const signature = readText(req.headers.get('stripe-signature'));
  if (!signature) {
    return jsonResponse(400, { error: 'Missing Stripe-Signature header' });
  }

  const rawBody = await req.text();
  const valid = await verifyStripeSignature(rawBody, signature, stripeWebhookSecret);
  if (!valid) {
    return jsonResponse(400, { error: 'Invalid Stripe webhook signature' });
  }

  let event: Json = {};
  try {
    event = rawBody ? (JSON.parse(rawBody) as Json) : {};
  } catch (_error) {
    return jsonResponse(400, { error: 'Invalid JSON webhook body' });
  }

  await storeWebhookEvent(event);

  const type = readText(event.type);
  const object = ((event.data as Json | undefined)?.object as Json | undefined) ?? {};

  if (type === 'checkout.session.completed') {
    await updateFromSetupCheckout(object, event);
  }
  if (type === 'customer.subscription.created' || type === 'customer.subscription.updated' || type === 'customer.subscription.deleted') {
    await updateFromSubscriptionObject(object, event);
  }
  if (type === 'invoice.payment_succeeded' || type === 'invoice.payment_failed') {
    await updateFromInvoiceObject(object, event);
  }

  return jsonResponse(200, { ok: true });
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const isStripeWebhook = Boolean(readText(req.headers.get('stripe-signature')));
    if (isStripeWebhook) {
      return await handleWebhook(req);
    }

    const payload = await parseJsonBody(req);
    const action = readText(payload.action) || 'create_setup_session';

    if (action === 'create_setup_session') {
      return await createSetupSession(payload);
    }
    if (action === 'finalize_subscription') {
      return await finalizeSubscription(req, payload);
    }
    if (action === 'admin_overview') {
      return await adminOverview(req, payload);
    }

    return jsonResponse(400, { error: `Unsupported action "${action}"` });
  } catch (error) {
    return jsonResponse(500, { error: error instanceof Error ? error.message : 'Onbekende fout' });
  }
});
