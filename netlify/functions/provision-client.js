const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, x-admin-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(body)
});

const read = (value) => String(value ?? '').trim();

const slugify = (value) =>
  read(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const normalizeDomain = (value) =>
  read(value)
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');

const parseJson = (value) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  const normalized = read(value).toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
};

const VALID_MODES = new Set(['dry_run', 'live_write']);
const VALID_RETRY_STEPS = new Set([
  'netlify_internal_site_check',
  'netlify_customer_site_check',
  'supabase_project_check',
  'stripe_price_check',
  'supabase_function_health',
  'netlify_customer_site_write',
  'supabase_secrets_write'
]);
const WRITE_STEPS = new Set(['netlify_customer_site_write', 'supabase_secrets_write']);
const isWriteStep = (stepName) => WRITE_STEPS.has(stepName);

const randomJobId = () => `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const safeError = (error) => {
  if (error instanceof Error) return error.message;
  return String(error ?? 'Unknown error');
};

const netlifyApiRequest = async (path, token, options = {}) => {
  const method = options.method || 'GET';
  const body = options.body;
  const response = await fetch(`https://api.netlify.com/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = {};
  }

  if (!response.ok) {
    const message = read(data?.message) || text || `Netlify API error ${response.status}`;
    throw new Error(message);
  }
  return data;
};

const supabaseApiRequest = async (path, token, options = {}) => {
  const method = options.method || 'GET';
  const body = options.body;
  const response = await fetch(`https://api.supabase.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = {};
  }

  if (!response.ok) {
    const message = read(data?.msg) || read(data?.message) || text || `Supabase API error ${response.status}`;
    throw new Error(message);
  }
  return data;
};

const stripeRequest = async (path, secretKey) => {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = {};
  }

  if (!response.ok) {
    const message = read(data?.error?.message) || text || `Stripe API error ${response.status}`;
    throw new Error(message);
  }
  return data;
};

const asStep = (name, status, message, details = null, elapsed_ms = null) => ({
  name,
  status,
  message,
  ...(details ? { details } : {}),
  ...(Number.isFinite(elapsed_ms) ? { elapsed_ms } : {})
});

const withStep = async (steps, name, runner) => {
  const started = Date.now();
  try {
    const result = await runner();
    const message = read(result?.message) || 'OK';
    const details = result?.details ?? null;
    steps.push(asStep(name, 'ok', message, details, Date.now() - started));
    return result;
  } catch (error) {
    steps.push(asStep(name, 'error', safeError(error), null, Date.now() - started));
    return null;
  }
};

const withOptionalStep = async (steps, name, shouldRun, runner, skippedMessage) => {
  if (!shouldRun) {
    steps.push(asStep(name, 'skipped', skippedMessage));
    return null;
  }
  return withStep(steps, name, runner);
};

const buildSupabaseSecretEntries = (body, stripePriceId, setupCurrency) => {
  const source = body?.supabaseSecrets && typeof body.supabaseSecrets === 'object' ? body.supabaseSecrets : {};

  const entries = [
    ['STRIPE_SECRET_KEY', read(source.STRIPE_SECRET_KEY || body.stripeSecretKey)],
    ['STRIPE_WEBHOOK_SECRET', read(source.STRIPE_WEBHOOK_SECRET || body.stripeWebhookSecret)],
    ['STRIPE_SALES_PRICE_ID', read(source.STRIPE_SALES_PRICE_ID || stripePriceId)],
    ['STRIPE_SETUP_CURRENCY', read(source.STRIPE_SETUP_CURRENCY || setupCurrency || 'eur').toLowerCase()],
    ['BILLING_ADMIN_TOKEN', read(source.BILLING_ADMIN_TOKEN || body.billingAdminToken)]
  ];

  return entries
    .filter((entry) => read(entry[1]))
    .map(([name, value]) => ({ name, value: read(value) }));
};

const upsertSupabaseSecrets = async (projectRef, token, entries) => {
  if (!entries.length) {
    throw new Error('Geen secrets aangeleverd voor upsert.');
  }

  const attempts = [entries, { secrets: entries }];
  let lastError = null;

  for (const payload of attempts) {
    try {
      await supabaseApiRequest(`/projects/${encodeURIComponent(projectRef)}/secrets`, token, {
        method: 'POST',
        body: payload
      });
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`Supabase secrets upsert failed: ${safeError(lastError)}`);
};

const listSupabaseSecretNames = async (projectRef, token) => {
  const data = await supabaseApiRequest(`/projects/${encodeURIComponent(projectRef)}/secrets`, token, { method: 'GET' });
  const items = Array.isArray(data) ? data : Array.isArray(data?.secrets) ? data.secrets : [];
  return items.map((item) => read(item?.name || item?.key)).filter(Boolean);
};

const createOrUpdateCustomerSite = async ({ token, customerSiteId, customerSiteName, customerDomain, accountSlug }) => {
  let site = null;
  let created = false;

  if (customerSiteId) {
    site = await netlifyApiRequest(`/sites/${encodeURIComponent(customerSiteId)}`, token);
  } else {
    const payload = {
      name: customerSiteName || `dashboard-${Date.now()}`
    };
    if (accountSlug) payload.account_slug = accountSlug;
    site = await netlifyApiRequest('/sites', token, { method: 'POST', body: payload });
    created = true;
  }

  let domainUpdateError = '';
  const currentDomain = normalizeDomain(site?.custom_domain || site?.url);
  const shouldUpdateDomain = Boolean(customerDomain && currentDomain !== customerDomain);

  if (shouldUpdateDomain) {
    try {
      site = await netlifyApiRequest(`/sites/${encodeURIComponent(site.id)}`, token, {
        method: 'PATCH',
        body: { custom_domain: customerDomain }
      });
    } catch (error) {
      domainUpdateError = safeError(error);
    }
  }

  return {
    site,
    created,
    domainUpdateError
  };
};

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const adminToken = read(process.env.PROVISION_ADMIN_TOKEN || process.env.BILLING_ADMIN_TOKEN);
  const providedToken = read(event.headers?.['x-admin-token'] || event.headers?.['X-Admin-Token']);

  if (!adminToken) {
    return json(500, { error: 'PROVISION_ADMIN_TOKEN (of BILLING_ADMIN_TOKEN) ontbreekt in Netlify env.' });
  }
  if (!providedToken || providedToken !== adminToken) {
    return json(401, { error: 'Ongeldige admin token.' });
  }

  const body = parseJson(event.body);
  const company = read(body.company);
  const slug = slugify(body.slug || company);
  const clientKey = slugify(body.clientKey || `${slug}-sales`);
  const projectRef = read(body.projectRef);
  const supabaseUrl = read(body.supabaseUrl || (projectRef ? `https://${projectRef}.supabase.co` : ''));
  const customerDomain = normalizeDomain(body.customerDomain);
  const stripePriceId = read(body.stripePriceId);
  const setupCurrency = read(body.setupCurrency || 'eur').toLowerCase();
  const functionUrl =
    read(body.functionUrl) || (projectRef ? `https://${projectRef}.supabase.co/functions/v1/stripe-seats-billing` : '');

  const customerSiteId = read(body.customerSiteId || process.env.DEFAULT_CUSTOMER_NETLIFY_SITE_ID);
  const customerSiteName = slugify(body.customerSiteName || `dashboard-${slug}`);
  const internalSiteId = read(body.internalSiteId || process.env.INTERNAL_NETLIFY_SITE_ID);
  const netlifyAccountSlug = slugify(body.netlifyAccountSlug || process.env.NETLIFY_ACCOUNT_SLUG);

  const requestedMode = read(body.mode).toLowerCase();
  if (requestedMode && !VALID_MODES.has(requestedMode)) {
    return json(400, { error: `Ongeldige mode "${requestedMode}". Gebruik dry_run of live_write.` });
  }
  const mode = requestedMode || 'dry_run';

  const retryStep = read(body.retry_step || body.retryStep);
  if (retryStep && !VALID_RETRY_STEPS.has(retryStep)) {
    return json(400, { error: `Ongeldige retry_step "${retryStep}".` });
  }

  const actions = body.actions && typeof body.actions === 'object' ? body.actions : {};
  const createCustomerSiteRequested = parseBoolean(actions.create_customer_site ?? body.createCustomerSite);
  const writeSupabaseSecretsRequested = parseBoolean(actions.write_supabase_secrets ?? body.writeSupabaseSecrets);

  if (retryStep && isWriteStep(retryStep) && mode !== 'live_write') {
    return json(400, { error: 'retry_step voor write acties vereist mode=live_write.' });
  }

  let createCustomerSite = createCustomerSiteRequested;
  let writeSupabaseSecrets = writeSupabaseSecretsRequested;

  if (mode !== 'live_write') {
    createCustomerSite = false;
    writeSupabaseSecrets = false;
  }
  if (retryStep) {
    createCustomerSite = retryStep === 'netlify_customer_site_write';
    writeSupabaseSecrets = retryStep === 'supabase_secrets_write';
  }

  const liveConfirm = read(body.liveConfirm || body.live_confirm).toUpperCase();
  const hasWriteIntent = createCustomerSite || writeSupabaseSecrets;
  if (hasWriteIntent && liveConfirm !== 'LIVE') {
    return json(400, { error: 'Write acties vereisen bevestiging: stuur liveConfirm=LIVE.' });
  }

  const shouldRunStep = (stepName, defaultCondition = true) => {
    if (retryStep) return retryStep === stepName;
    return Boolean(defaultCondition);
  };
  const skipReason = (stepName, fallback) => {
    if (retryStep && retryStep !== stepName) {
      return `Overgeslagen (retry_step=${retryStep}).`;
    }
    return fallback;
  };

  const netlifyToken = read(process.env.NETLIFY_AUTH_TOKEN);
  const supabaseAccessToken = read(process.env.SUPABASE_ACCESS_TOKEN);
  const stripeSecretKey = read(process.env.STRIPE_SECRET_KEY);

  if (!company || !slug || !clientKey || !projectRef || !supabaseUrl || !customerDomain) {
    return json(400, {
      error:
        'Verplichte velden ontbreken. Vereist: company, slug/clientKey, projectRef, supabaseUrl, customerDomain.'
    });
  }

  const jobId = randomJobId();
  const startedAt = new Date().toISOString();
  const steps = [];

  steps.push(
    asStep('input_validation', 'ok', 'Input gevalideerd.', {
      company,
      slug,
      client_key: clientKey,
      project_ref: projectRef,
      customer_domain: customerDomain,
      mode,
      retry_step: retryStep || null,
      actions: {
        create_customer_site_requested: createCustomerSiteRequested,
        write_supabase_secrets_requested: writeSupabaseSecretsRequested,
        create_customer_site_effective: createCustomerSite,
        write_supabase_secrets_effective: writeSupabaseSecrets
      }
    })
  );

  await withOptionalStep(
    steps,
    'netlify_internal_site_check',
    shouldRunStep('netlify_internal_site_check', Boolean(netlifyToken && internalSiteId)),
    async () => {
      if (!netlifyToken) {
        throw new Error('NETLIFY_AUTH_TOKEN ontbreekt in Netlify function env.');
      }
      if (!internalSiteId) {
        throw new Error('INTERNAL_NETLIFY_SITE_ID ontbreekt.');
      }

      const site = await netlifyApiRequest(`/sites/${encodeURIComponent(internalSiteId)}`, netlifyToken);
      return {
        message: 'Interne Netlify site gevonden.',
        details: {
          site_id: site.id,
          site_name: site.name,
          url: site.url,
          custom_domain: site.custom_domain || null
        }
      };
    },
    skipReason('netlify_internal_site_check', 'Overgeslagen (NETLIFY_AUTH_TOKEN of INTERNAL_NETLIFY_SITE_ID ontbreekt).')
  );

  await withOptionalStep(
    steps,
    'netlify_customer_site_check',
    shouldRunStep('netlify_customer_site_check', Boolean(netlifyToken && customerSiteId)),
    async () => {
      if (!netlifyToken) {
        throw new Error('NETLIFY_AUTH_TOKEN ontbreekt in Netlify function env.');
      }
      if (!customerSiteId) {
        throw new Error('customerSiteId ontbreekt voor netlify_customer_site_check.');
      }

      const site = await netlifyApiRequest(`/sites/${encodeURIComponent(customerSiteId)}`, netlifyToken);
      const actualDomain = normalizeDomain(site.custom_domain || site.url);
      const domainMatch = actualDomain.includes(customerDomain);
      return {
        message: domainMatch ? 'Klant site + domein gevalideerd.' : 'Klant site gevonden, maar domein wijkt af.',
        details: {
          site_id: site.id,
          site_name: site.name,
          configured_domain: actualDomain,
          expected_domain: customerDomain,
          domain_match: domainMatch
        }
      };
    },
    skipReason('netlify_customer_site_check', 'Overgeslagen (NETLIFY_AUTH_TOKEN of customerSiteId ontbreekt).')
  );

  await withOptionalStep(
    steps,
    'supabase_project_check',
    shouldRunStep('supabase_project_check', Boolean(supabaseAccessToken && projectRef)),
    async () => {
      if (!supabaseAccessToken) {
        throw new Error('SUPABASE_ACCESS_TOKEN ontbreekt in Netlify function env.');
      }

      const project = await supabaseApiRequest(`/projects/${encodeURIComponent(projectRef)}`, supabaseAccessToken);
      const projectApiUrl = read(project.api_url);
      const urlMatch = !projectApiUrl || projectApiUrl === supabaseUrl;
      return {
        message: urlMatch ? 'Supabase project gevalideerd.' : 'Supabase project gevonden, URL mismatch gedetecteerd.',
        details: {
          project_ref: projectRef,
          name: project.name || null,
          api_url: projectApiUrl || null,
          expected_api_url: supabaseUrl,
          url_match: urlMatch
        }
      };
    },
    skipReason('supabase_project_check', 'Overgeslagen (SUPABASE_ACCESS_TOKEN ontbreekt).')
  );

  await withOptionalStep(
    steps,
    'stripe_price_check',
    shouldRunStep('stripe_price_check', Boolean(stripeSecretKey && stripePriceId)),
    async () => {
      if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY ontbreekt in Netlify function env.');
      }
      if (!stripePriceId) {
        throw new Error('stripePriceId ontbreekt voor stripe_price_check.');
      }

      const price = await stripeRequest(`prices/${encodeURIComponent(stripePriceId)}`, stripeSecretKey);
      return {
        message: 'Stripe price gevalideerd.',
        details: {
          price_id: price.id,
          currency: price.currency,
          unit_amount: price.unit_amount,
          recurring_interval: price.recurring?.interval || null,
          active: price.active === true
        }
      };
    },
    skipReason('stripe_price_check', 'Overgeslagen (STRIPE_SECRET_KEY of stripePriceId ontbreekt).')
  );

  await withOptionalStep(
    steps,
    'supabase_function_health',
    shouldRunStep('supabase_function_health', Boolean(functionUrl)),
    async () => {
      if (!functionUrl) {
        throw new Error('functionUrl ontbreekt voor supabase_function_health.');
      }

      const response = await fetch(functionUrl, { method: 'OPTIONS' });
      if (!response.ok) {
        throw new Error(`Function health check failed (${response.status})`);
      }
      return {
        message: 'Stripe seats function bereikbaar.',
        details: {
          function_url: functionUrl,
          status: response.status
        }
      };
    },
    skipReason('supabase_function_health', 'Overgeslagen (functionUrl ontbreekt).')
  );

  const customerSiteWrite = await withOptionalStep(
    steps,
    'netlify_customer_site_write',
    shouldRunStep('netlify_customer_site_write', createCustomerSite),
    async () => {
      if (!netlifyToken) {
        throw new Error('NETLIFY_AUTH_TOKEN ontbreekt in Netlify function env.');
      }

      const result = await createOrUpdateCustomerSite({
        token: netlifyToken,
        customerSiteId,
        customerSiteName,
        customerDomain,
        accountSlug: netlifyAccountSlug
      });

      const site = result.site || {};
      const baseMessage = result.created ? 'Klantsite aangemaakt.' : 'Klantsite geüpdatet.';
      const message = result.domainUpdateError
        ? `${baseMessage} Domein update faalde, manuele opvolging nodig.`
        : `${baseMessage} Domein geconfigureerd of reeds correct.`;

      return {
        message,
        details: {
          site_id: site.id || null,
          site_name: site.name || null,
          site_url: site.url || null,
          custom_domain: site.custom_domain || null,
          created: result.created,
          domain_update_error: result.domainUpdateError || null
        }
      };
    },
    skipReason(
      'netlify_customer_site_write',
      mode !== 'live_write' ? 'Overgeslagen (mode=dry_run).' : 'Overgeslagen (create_customer_site = false).'
    )
  );

  const supabaseSecretsWrite = await withOptionalStep(
    steps,
    'supabase_secrets_write',
    shouldRunStep('supabase_secrets_write', writeSupabaseSecrets),
    async () => {
      if (!supabaseAccessToken) {
        throw new Error('SUPABASE_ACCESS_TOKEN ontbreekt in Netlify function env.');
      }

      const entries = buildSupabaseSecretEntries(body, stripePriceId, setupCurrency);
      const requiredNames = new Set([
        'STRIPE_SECRET_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_SALES_PRICE_ID',
        'BILLING_ADMIN_TOKEN'
      ]);
      const presentNames = new Set(entries.map((entry) => entry.name));
      const missing = Array.from(requiredNames).filter((name) => !presentNames.has(name));

      if (missing.length > 0) {
        throw new Error(`Ontbrekende vereiste secrets: ${missing.join(', ')}`);
      }

      await upsertSupabaseSecrets(projectRef, supabaseAccessToken, entries);
      const names = await listSupabaseSecretNames(projectRef, supabaseAccessToken).catch(() => []);
      const updated = entries.map((entry) => entry.name);
      const confirmed = names.filter((name) => updated.includes(name));

      return {
        message: 'Supabase secrets geüpdatet.',
        details: {
          project_ref: projectRef,
          updated_secret_names: updated,
          confirmed_secret_names: confirmed
        }
      };
    },
    skipReason(
      'supabase_secrets_write',
      mode !== 'live_write' ? 'Overgeslagen (mode=dry_run).' : 'Overgeslagen (write_supabase_secrets = false).'
    )
  );

  const generated = {
    mode,
    retry_step: retryStep || null,
    billing_profile_key: clientKey,
    customer_setup_url: `https://${customerDomain}/billing-seats-setup.html?client=${encodeURIComponent(clientKey)}`,
    customer_entry_url: `https://${customerDomain}/billing-belivert.html`,
    internal_overview_url: 'https://app.profitpulse.be/billing-overview-admin.html',
    stripe_subscriptions_url: 'https://dashboard.stripe.com/subscriptions',
    onboarding_hub_url: 'https://app.profitpulse.be/onboarding-hub.html',
    customer_site_id: customerSiteWrite?.details?.site_id || customerSiteId || null,
    secrets_updated: Array.isArray(supabaseSecretsWrite?.details?.updated_secret_names)
      ? supabaseSecretsWrite.details.updated_secret_names
      : []
  };

  steps.push(asStep('generated_links', 'ok', 'Provisioning links gegenereerd.', generated));

  const hasErrors = steps.some((step) => step.status === 'error');
  const skipped = steps.filter((step) => step.status === 'skipped').length;

  return json(hasErrors ? 207 : 200, {
    ok: !hasErrors,
    job_id: jobId,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    summary: {
      total_steps: steps.length,
      errors: steps.filter((step) => step.status === 'error').length,
      skipped
    },
    steps,
    generated
  });
}
