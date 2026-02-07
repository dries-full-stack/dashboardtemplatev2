import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const required = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const parseNumber = (key: string, fallback: number) => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  const value = Number(raw);
  if (Number.isNaN(value)) throw new Error(`Invalid number for env var ${key}: ${raw}`);
  return value;
};

const parseBoolean = (key: string, fallback = false) => {
  const raw = Deno.env.get(key);
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
};

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
  STRIPE_WEBHOOK_TOLERANCE_SECONDS: parseNumber('STRIPE_WEBHOOK_TOLERANCE_SECONDS', 300),
  STRIPE_WEBHOOK_ALLOW_UNSIGNED: parseBoolean('STRIPE_WEBHOOK_ALLOW_UNSIGNED', false)
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

type JsonObject = Record<string, unknown>;
type BillingCustomerRow = {
  id: number;
  slug: string;
  metadata: JsonObject | null;
};

type BillingPatch = {
  slug?: string;
  company?: string | null;
  contact_email?: string | null;
  stripe_payment_link_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  subscription_status?: string | null;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: string | null;
  last_checkout_session_id?: string | null;
  last_checkout_completed_at?: string | null;
  last_invoice_id?: string | null;
  last_invoice_status?: string | null;
  last_invoice_paid_at?: string | null;
  last_invoice_failed_at?: string | null;
  last_event_id?: string | null;
  last_event_type?: string | null;
  last_event_at?: string | null;
  metadata?: JsonObject;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

const isObject = (value: unknown): value is JsonObject => Boolean(value && typeof value === 'object' && !Array.isArray(value));

const asObject = (value: unknown): JsonObject | null => (isObject(value) ? value : null);

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const asBoolean = (value: unknown): boolean | null => (typeof value === 'boolean' ? value : null);

const normalizeSlug = (value: string | null) => {
  if (!value) return null;
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || null;
};

const unixToIso = (value: unknown) => {
  const unix = asNumber(value);
  if (!Number.isFinite(unix)) return null;
  return new Date(unix * 1000).toISOString();
};

const readId = (value: unknown): string | null => {
  const direct = asString(value);
  if (direct) return direct;
  const object = asObject(value);
  return asString(object?.id);
};

const pickFirst = (...values: Array<string | null>) => values.find((value) => Boolean(value)) ?? null;

const compactPatch = <T extends Record<string, unknown>>(patch: T) =>
  Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Record<string, unknown>;

const fallbackSlug = (values: Array<string | null>) => {
  const base = values.find((value) => Boolean(value)) ?? crypto.randomUUID();
  return normalizeSlug(`stripe-${base}`) ?? `stripe-${Date.now()}`;
};

const parseStripeSignature = (header: string) => {
  const pairs = header.split(',').map((part) => part.trim()).filter(Boolean);
  const timestampPart = pairs.find((part) => part.startsWith('t='));
  const signatureParts = pairs.filter((part) => part.startsWith('v1='));
  const timestamp = timestampPart ? Number(timestampPart.slice(2)) : NaN;
  const signatures = signatureParts.map((part) => part.slice(3)).filter(Boolean);
  return { timestamp, signatures };
};

const toHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const computeHmacHex = async (secret: string, payload: string) => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toHex(new Uint8Array(signature));
};

const secureEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
};

const verifyStripeSignature = async (body: string, stripeSignatureHeader: string | null) => {
  if (env.STRIPE_WEBHOOK_ALLOW_UNSIGNED) return;
  if (!env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
  }
  if (!stripeSignatureHeader) {
    throw new Error('Missing Stripe-Signature header.');
  }

  const parsed = parseStripeSignature(stripeSignatureHeader);
  if (!Number.isFinite(parsed.timestamp) || !parsed.signatures.length) {
    throw new Error('Invalid Stripe-Signature header format.');
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - parsed.timestamp);
  if (ageSeconds > env.STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error('Stripe webhook timestamp outside tolerance window.');
  }

  const signedPayload = `${parsed.timestamp}.${body}`;
  const expected = await computeHmacHex(env.STRIPE_WEBHOOK_SECRET, signedPayload);
  const isValid = parsed.signatures.some((candidate) => secureEqual(candidate.toLowerCase(), expected));

  if (!isValid) {
    throw new Error('Invalid Stripe webhook signature.');
  }
};

const isDuplicateError = (error: unknown) => {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('duplicate key') || message.includes('already exists');
};

const findCustomerByField = async (field: string, value: string | null): Promise<BillingCustomerRow | null> => {
  if (!value) return null;
  const { data, error } = await supabase
    .from('billing_customers')
    .select('id,slug,metadata')
    .eq(field, value)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as BillingCustomerRow | null) ?? null;
};

const findExistingCustomer = async (input: {
  slug?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_link_id?: string | null;
}) => {
  const normalizedSlug = normalizeSlug(input.slug ?? null);
  const bySlug = await findCustomerByField('slug', normalizedSlug);
  if (bySlug) return bySlug;

  const bySubscription = await findCustomerByField('stripe_subscription_id', input.stripe_subscription_id ?? null);
  if (bySubscription) return bySubscription;

  const byCustomer = await findCustomerByField('stripe_customer_id', input.stripe_customer_id ?? null);
  if (byCustomer) return byCustomer;

  const byPaymentLink = await findCustomerByField('stripe_payment_link_id', input.stripe_payment_link_id ?? null);
  if (byPaymentLink) return byPaymentLink;

  return null;
};

const upsertCustomer = async (patch: BillingPatch, lookup: {
  slug?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_link_id?: string | null;
}) => {
  const now = new Date().toISOString();
  const incomingSlug = normalizeSlug(patch.slug ?? lookup.slug ?? null);
  const existing = await findExistingCustomer({
    slug: incomingSlug,
    stripe_subscription_id: lookup.stripe_subscription_id,
    stripe_customer_id: lookup.stripe_customer_id,
    stripe_payment_link_id: lookup.stripe_payment_link_id
  });

  if (existing) {
    const updatePayload = compactPatch({
      ...patch,
      slug: incomingSlug ?? existing.slug,
      updated_at: now
    });
    const { data, error } = await supabase
      .from('billing_customers')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('id,slug,metadata')
      .single();
    if (error) throw error;
    return data as BillingCustomerRow;
  }

  const newSlug = incomingSlug ?? fallbackSlug([
    lookup.slug ?? null,
    lookup.stripe_customer_id ?? null,
    lookup.stripe_subscription_id ?? null,
    lookup.stripe_payment_link_id ?? null
  ]);

  const insertPayload = compactPatch({
    ...patch,
    slug: newSlug,
    updated_at: now
  });

  const { data, error } = await supabase
    .from('billing_customers')
    .insert(insertPayload)
    .select('id,slug,metadata')
    .single();

  if (!error) return data as BillingCustomerRow;

  if (isDuplicateError(error)) {
    const fallbackExisting = await findExistingCustomer({
      slug: newSlug,
      stripe_subscription_id: lookup.stripe_subscription_id,
      stripe_customer_id: lookup.stripe_customer_id,
      stripe_payment_link_id: lookup.stripe_payment_link_id
    });
    if (!fallbackExisting) throw error;
    const { data: merged, error: mergeError } = await supabase
      .from('billing_customers')
      .update(compactPatch({ ...patch, updated_at: now }))
      .eq('id', fallbackExisting.id)
      .select('id,slug,metadata')
      .single();
    if (mergeError) throw mergeError;
    return merged as BillingCustomerRow;
  }

  throw error;
};

const extractGenericRefs = (eventType: string, payload: JsonObject) => {
  const customerId = readId(payload.customer);
  const subscriptionId = readId(payload.subscription);
  const paymentLinkId = readId(payload.payment_link);
  const clientReferenceId = normalizeSlug(asString(payload.client_reference_id));
  const checkoutSessionId = eventType.startsWith('checkout.session') ? asString(payload.id) : null;
  return { customerId, subscriptionId, paymentLinkId, clientReferenceId, checkoutSessionId };
};

const processCheckoutSessionEvent = async (eventId: string, eventType: string, eventCreatedAt: string | null, payload: JsonObject) => {
  const refs = extractGenericRefs(eventType, payload);
  const details = asObject(payload.customer_details);
  const metadata = asObject(payload.metadata);
  const metadataSlug = normalizeSlug(asString(metadata?.customer_slug));
  const slug = pickFirst(metadataSlug, refs.clientReferenceId);
  const checkoutCreatedAt = unixToIso(payload.created) ?? eventCreatedAt ?? new Date().toISOString();
  const paymentStatus = asString(payload.payment_status);
  const statusFromCheckout =
    eventType === 'checkout.session.async_payment_failed'
      ? 'incomplete'
      : paymentStatus === 'paid'
        ? 'active'
        : 'pending';

  const row = await upsertCustomer(
    {
      slug: slug ?? undefined,
      company: asString(details?.name),
      contact_email: pickFirst(asString(details?.email), asString(payload.customer_email)),
      stripe_payment_link_id: refs.paymentLinkId,
      stripe_customer_id: refs.customerId,
      stripe_subscription_id: refs.subscriptionId,
      subscription_status: statusFromCheckout,
      last_checkout_session_id: refs.checkoutSessionId,
      last_checkout_completed_at: checkoutCreatedAt,
      last_event_id: eventId,
      last_event_type: eventType,
      last_event_at: eventCreatedAt,
      metadata: metadata ?? undefined
    },
    {
      slug,
      stripe_subscription_id: refs.subscriptionId,
      stripe_customer_id: refs.customerId,
      stripe_payment_link_id: refs.paymentLinkId
    }
  );

  return row.slug;
};

const processSubscriptionEvent = async (eventId: string, eventType: string, eventCreatedAt: string | null, payload: JsonObject) => {
  const subscriptionId = asString(payload.id);
  const customerId = readId(payload.customer);
  const metadata = asObject(payload.metadata);
  const metadataSlug = normalizeSlug(asString(metadata?.customer_slug));

  const row = await upsertCustomer(
    {
      slug: metadataSlug ?? undefined,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status: asString(payload.status),
      current_period_start: unixToIso(payload.current_period_start),
      current_period_end: unixToIso(payload.current_period_end),
      cancel_at_period_end: asBoolean(payload.cancel_at_period_end) ?? false,
      canceled_at: unixToIso(payload.canceled_at),
      last_event_id: eventId,
      last_event_type: eventType,
      last_event_at: eventCreatedAt,
      metadata: metadata ?? undefined
    },
    {
      slug: metadataSlug,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId
    }
  );

  return row.slug;
};

const processInvoiceEvent = async (eventId: string, eventType: string, eventCreatedAt: string | null, payload: JsonObject) => {
  const invoiceId = asString(payload.id);
  const customerId = readId(payload.customer);
  const subscriptionId = readId(payload.subscription);
  const status = asString(payload.status);
  const statusTransitions = asObject(payload.status_transitions);

  const invoicePaidAt = eventType === 'invoice.paid'
    ? unixToIso(statusTransitions?.paid_at) ?? eventCreatedAt ?? new Date().toISOString()
    : undefined;
  const invoiceFailedAt = eventType === 'invoice.payment_failed'
    ? eventCreatedAt ?? new Date().toISOString()
    : undefined;

  const row = await upsertCustomer(
    {
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_status:
        eventType === 'invoice.payment_failed'
          ? 'past_due'
          : eventType === 'invoice.paid'
            ? 'active'
            : undefined,
      last_invoice_id: invoiceId,
      last_invoice_status: status,
      last_invoice_paid_at: invoicePaidAt,
      last_invoice_failed_at: invoiceFailedAt,
      last_event_id: eventId,
      last_event_type: eventType,
      last_event_at: eventCreatedAt
    },
    {
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId
    }
  );

  return row.slug;
};

const processStripeEvent = async (event: JsonObject) => {
  const eventId = asString(event.id);
  const eventType = asString(event.type);
  const eventCreatedAt = unixToIso(event.created);
  const data = asObject(event.data);
  const payload = asObject(data?.object);

  if (!eventId || !eventType || !payload) {
    throw new Error('Invalid Stripe event payload.');
  }

  const refs = extractGenericRefs(eventType, payload);

  const { error: eventInsertError } = await supabase.from('billing_webhook_events').insert({
    event_id: eventId,
    event_type: eventType,
    livemode: asBoolean(event.livemode),
    created_unix: asNumber(event.created),
    event_created_at: eventCreatedAt,
    customer_id: refs.customerId,
    subscription_id: refs.subscriptionId,
    checkout_session_id: refs.checkoutSessionId,
    payment_link_id: refs.paymentLinkId,
    client_reference_id: refs.clientReferenceId,
    payload: event
  });

  if (eventInsertError) {
    if (isDuplicateError(eventInsertError)) {
      return { duplicate: true };
    }
    throw eventInsertError;
  }

  let customerSlug: string | null = null;
  if (
    eventType === 'checkout.session.completed' ||
    eventType === 'checkout.session.async_payment_succeeded' ||
    eventType === 'checkout.session.async_payment_failed'
  ) {
    customerSlug = await processCheckoutSessionEvent(eventId, eventType, eventCreatedAt, payload);
  } else if (
    eventType === 'customer.subscription.created' ||
    eventType === 'customer.subscription.updated' ||
    eventType === 'customer.subscription.deleted'
  ) {
    customerSlug = await processSubscriptionEvent(eventId, eventType, eventCreatedAt, payload);
  } else if (eventType === 'invoice.paid' || eventType === 'invoice.payment_failed') {
    customerSlug = await processInvoiceEvent(eventId, eventType, eventCreatedAt, payload);
  }

  if (customerSlug) {
    const { error: eventUpdateError } = await supabase
      .from('billing_webhook_events')
      .update({ customer_slug: customerSlug })
      .eq('event_id', eventId);
    if (eventUpdateError) throw eventUpdateError;
  }

  return { duplicate: false, eventId, eventType, customerSlug };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return jsonResponse(200, { ok: true, service: 'stripe-webhook' });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const body = await req.text();
    await verifyStripeSignature(body, req.headers.get('stripe-signature'));
    const event = JSON.parse(body) as JsonObject;
    const result = await processStripeEvent(event);
    return jsonResponse(200, { ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('stripe-webhook error', message);
    return jsonResponse(400, { ok: false, error: message });
  }
});
