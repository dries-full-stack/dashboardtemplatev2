import { supabase } from '../clients/supabaseClient.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export type GhlIntegration = {
  locationId: string;
  token: string;
  source: 'env' | 'supabase';
};

type IntegrationRow = {
  location_id: string;
  private_integration_token: string;
};

export const loadGhlIntegration = async (): Promise<GhlIntegration> => {
  const envLocation = env.GHL_LOCATION_ID?.trim();
  const envToken = env.GHL_PRIVATE_INTEGRATION_TOKEN?.trim();

  if (envLocation && envToken) {
    return {
      locationId: envLocation,
      token: envToken,
      source: 'env'
    };
  }

  try {
    const { data, error } = await supabase
      .from('ghl_integrations')
      .select('location_id, private_integration_token, active, updated_at')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(2);

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error(
        'No active GHL integration found in Supabase. Add one row to ghl_integrations or set GHL_LOCATION_ID and GHL_PRIVATE_INTEGRATION_TOKEN in .env.'
      );
    }

    if (data.length > 1) {
      logger.warn('Multiple active GHL integrations found. Using the most recently updated one.');
    }

    const integration = data[0] as IntegrationRow;

    return {
      locationId: integration.location_id,
      token: integration.private_integration_token,
      source: 'supabase'
    };
  } catch (error) {
    throw new Error(
      `Failed to load GHL integration from Supabase. Ensure ghl_integrations exists and has an active row. ${String(
        error
      )}`
    );
  }
};
