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
  SUPABASE_SECRET_KEY: Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
};

if (!env.SUPABASE_SECRET_KEY) {
  throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in function env.');
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false }
});

type Payload = {
  location_id?: string;
  private_integration_token?: string;
  active?: boolean;
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  });

const requireUser = async (req: Request) => {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (!token) {
    return { error: jsonResponse(401, { error: 'Missing Authorization header' }) };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return { error: jsonResponse(401, { error: 'Invalid user session' }) };
  }

  return { user: data.user };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await requireUser(req);
  if ('error' in auth) {
    return auth.error;
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('ghl_integrations')
      .select('location_id, active, updated_at, private_integration_token')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    const record = data?.[0];
    return jsonResponse(200, {
      location_id: record?.location_id ?? null,
      active: record?.active ?? null,
      updated_at: record?.updated_at ?? null,
      has_token: Boolean(record?.private_integration_token)
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload: Payload = {};
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const locationId = payload.location_id?.trim();
  const active = payload.active ?? true;
  let token = payload.private_integration_token?.trim();

  if (!locationId) {
    return jsonResponse(400, { error: 'location_id is required' });
  }

  if (!token) {
    const { data: existing, error } = await supabase
      .from('ghl_integrations')
      .select('private_integration_token')
      .eq('location_id', locationId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      return jsonResponse(500, { error: error.message });
    }

    token = existing?.[0]?.private_integration_token;
  }

  if (!token) {
    return jsonResponse(400, { error: 'private_integration_token is required for new locations' });
  }

  const { error } = await supabase
    .from('ghl_integrations')
    .upsert(
      {
        location_id: locationId,
        private_integration_token: token,
        active,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'location_id' }
    );

  if (error) {
    return jsonResponse(500, { error: error.message });
  }

  const { error: configError } = await supabase
    .from('dashboard_config')
    .upsert(
      {
        id: 1,
        location_id: locationId,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );

  if (configError) {
    return jsonResponse(500, { error: configError.message });
  }

  return jsonResponse(200, { ok: true });
});
