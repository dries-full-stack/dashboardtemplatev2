import { supabase } from '../clients/supabaseClient.js';

export type SyncState = {
  entity: string;
  location_id: string;
  cursor: Record<string, unknown> | null;
  last_synced_at: string | null;
  updated_at: string | null;
};

export const getSyncState = async (entity: string, locationId: string): Promise<SyncState | null> => {
  const { data, error } = await supabase
    .from('sync_state')
    .select('*')
    .eq('entity', entity)
    .eq('location_id', locationId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

export const saveSyncState = async (
  entity: string,
  locationId: string,
  cursor: Record<string, unknown> | null,
  lastSyncedAt: string
) => {
  const payload = {
    entity,
    location_id: locationId,
    cursor,
    last_synced_at: lastSyncedAt,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('sync_state')
    .upsert(payload, { onConflict: 'entity,location_id' });

  if (error) throw error;
};
