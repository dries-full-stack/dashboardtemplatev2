import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

const required = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Missing ${key} in function env.`);
  }
  return value;
};

const env = {
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '',
  TEAMLEADER_CLIENT_ID: required('TEAMLEADER_CLIENT_ID'),
  TEAMLEADER_CLIENT_SECRET: required('TEAMLEADER_CLIENT_SECRET'),
  TEAMLEADER_REDIRECT_URL: Deno.env.get('TEAMLEADER_REDIRECT_URL') ?? '',
  TEAMLEADER_SCOPES: Deno.env.get('TEAMLEADER_SCOPES') ?? ''
};

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

const htmlResponse = (status: number, body: string) =>
  new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });

const parseCookies = (cookieHeader: string | null) => {
  if (!cookieHeader) return {} as Record<string, string>;
  return cookieHeader.split(';').reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rest.join('='));
    return acc;
  }, {} as Record<string, string>);
};

const buildCallbackUrl = (reqUrl: URL) => {
  if (env.TEAMLEADER_REDIRECT_URL) return env.TEAMLEADER_REDIRECT_URL;
  return `${reqUrl.origin}${reqUrl.pathname.replace(/\/start$/, '/callback')}`;
};

const getLocationId = async (fallback?: string) => {
  if (fallback) return fallback;
  const { data, error } = await supabase.from('dashboard_config').select('location_id').eq('id', 1).maybeSingle();
  if (error || !data?.location_id) return '';
  return data.location_id;
};

const handleStart = async (req: Request) => {
  const url = new URL(req.url);
  const state = crypto.randomUUID();
  const locationId = url.searchParams.get('location_id') ?? '';
  const scopeParam = url.searchParams.get('scope') ?? '';
  const scope = scopeParam || env.TEAMLEADER_SCOPES;
  const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  const redirectUri = buildCallbackUrl(url);
  const authorizeUrl = new URL('https://app.teamleader.eu/oauth2/authorize');
  authorizeUrl.searchParams.set('client_id', env.TEAMLEADER_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('state', state);
  if (scope) {
    authorizeUrl.searchParams.set('scope', scope);
  }

  const headers = new Headers({ Location: authorizeUrl.toString() });
  const secureFlag = isLocal ? '' : '; Secure';
  headers.append('Set-Cookie', `teamleader_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`);
  if (locationId) {
    headers.append('Set-Cookie', `teamleader_oauth_location=${encodeURIComponent(locationId)}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`);
  }

  return new Response(null, { status: 302, headers });
};

const handleCallback = async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') ?? '';

  if (!code) {
    return jsonResponse(400, { error: 'Missing code parameter.' });
  }

  const cookies = parseCookies(req.headers.get('cookie'));
  if (cookies.teamleader_oauth_state && state && cookies.teamleader_oauth_state !== state) {
    return jsonResponse(400, { error: 'Invalid state parameter.' });
  }

  const locationId = await getLocationId(cookies.teamleader_oauth_location);
  if (!locationId) {
    return jsonResponse(400, { error: 'Missing location_id. Provide ?location_id=... on /start or set dashboard_config.' });
  }

  const redirectUri = env.TEAMLEADER_REDIRECT_URL || `${url.origin}${url.pathname}`;
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', env.TEAMLEADER_CLIENT_ID);
  body.set('client_secret', env.TEAMLEADER_CLIENT_SECRET);
  body.set('redirect_uri', redirectUri);
  body.set('code', code);

  const tokenResponse = await fetch('https://app.teamleader.eu/oauth2/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return jsonResponse(500, { error: 'Token exchange failed', details: errorText });
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number | string;
    token_type?: string;
    scope?: string;
  };

  if (!tokenData.access_token || !tokenData.refresh_token) {
    return jsonResponse(500, { error: 'Token response missing access_token or refresh_token.' });
  }

  const expiresIn = Number(tokenData.expires_in);
  const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

  const scopeValue = tokenData.scope || env.TEAMLEADER_SCOPES || null;
  const upsertPayload = {
    location_id: locationId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_type: tokenData.token_type ?? null,
    scope: scopeValue,
    expires_at: expiresAt
  };

  const { error } = await supabase.from('teamleader_integrations').upsert(upsertPayload, {
    onConflict: 'location_id'
  });

  if (error) {
    return jsonResponse(500, { error: 'Failed to store tokens', details: error.message });
  }

  return htmlResponse(
    200,
    `<html><body><h1>Teamleader gekoppeld</h1><p>Je kan dit venster sluiten.</p></body></html>`
  );
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  if (url.pathname.endsWith('/start')) {
    return await handleStart(req);
  }
  if (url.pathname.endsWith('/callback')) {
    return await handleCallback(req);
  }

  return jsonResponse(404, { error: 'Not found' });
});
