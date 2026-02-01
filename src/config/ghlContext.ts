import { createGhlClient, GhlClient } from '../clients/ghlClient.js';
import { loadGhlIntegration } from './ghlIntegration.js';

export type GhlContext = {
  locationId: string;
  client: GhlClient;
  source: 'env' | 'supabase';
};

export const loadGhlContext = async (): Promise<GhlContext> => {
  const integration = await loadGhlIntegration();
  return {
    locationId: integration.locationId,
    client: createGhlClient(integration.token),
    source: integration.source
  };
};
