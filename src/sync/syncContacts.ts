import { env } from '../config/env.js';
import { supabase } from '../clients/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { chunkArray, toEpochMs, toIsoDate } from './utils.js';
import { getSyncState, saveSyncState } from './syncState.js';
import type { GhlContext } from '../config/ghlContext.js';

type ContactRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  tags?: string[];
  dateAdded?: string | number;
  dateUpdated?: string | number;
  createdAt?: string | number;
  updatedAt?: string | number;
};

const UPSERT_BATCH_SIZE = 500;

export const syncContacts = async (context: GhlContext) => {
  const { locationId, client } = context;
  const state = await getSyncState('contacts', locationId);
  const now = Date.now();
  const syncStartedAt = new Date().toISOString();
  const lastFullSyncAt = state?.cursor && typeof state.cursor.lastFullSyncAt === 'string'
    ? (state.cursor.lastFullSyncAt as string)
    : null;
  const lastFullSyncMs = lastFullSyncAt ? Date.parse(lastFullSyncAt) : NaN;
  const fullSyncIntervalMs = env.FULL_SYNC_INTERVAL_HOURS * 60 * 60 * 1000;
  const shouldFullByInterval = env.FULL_SYNC_INTERVAL_HOURS > 0 && (
    !lastFullSyncAt || Number.isNaN(lastFullSyncMs) || now - lastFullSyncMs >= fullSyncIntervalMs
  );
  const isFullSync = env.FULL_SYNC || !state || shouldFullByInterval;

  let startAfter = state?.cursor && typeof state.cursor.startAfter === 'number'
    ? (state.cursor.startAfter as number)
    : null;
  let startAfterId = state?.cursor && typeof state.cursor.startAfterId === 'string'
    ? (state.cursor.startAfterId as string)
    : null;

  if (isFullSync) {
    startAfter = null;
    startAfterId = null;
  } else if (env.CONTACTS_REFRESH_DAYS > 0) {
    const refreshStart = now - env.CONTACTS_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  if (isFullSync && state && !env.FULL_SYNC) {
    logger.info('Full sync triggered by interval or missing last full sync.');
  }

  logger.info('Syncing contacts...');

  let total = 0;
  while (true) {
    const response = await client.getContacts({
      locationId,
      limit: env.SYNC_BATCH_SIZE,
      startAfter: startAfter ?? undefined,
      startAfterId: startAfterId ?? undefined
    });

    const contacts = (response.contacts ?? []) as ContactRecord[];
    if (contacts.length === 0) break;

    const rows = contacts.map((contact) => {
      const createdAt = toIsoDate(
        contact.dateAdded ?? contact.createdAt ?? (contact as Record<string, unknown>).created_at
      );
      const updatedAt = toIsoDate(
        contact.dateUpdated ?? contact.updatedAt ?? (contact as Record<string, unknown>).updated_at ?? createdAt
      );

      return {
        id: contact.id,
        location_id: contact.locationId ?? locationId,
        first_name: (contact as Record<string, unknown>).firstName ?? (contact as Record<string, unknown>).first_name ?? null,
        last_name: (contact as Record<string, unknown>).lastName ?? (contact as Record<string, unknown>).last_name ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        tags: contact.tags ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: contact,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await supabase.from('contacts').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += contacts.length;

    const last = contacts[contacts.length - 1];
    const lastTimestamp = toEpochMs(last.dateAdded ?? last.createdAt ?? last.dateUpdated ?? last.updatedAt);
    if (lastTimestamp) startAfter = lastTimestamp;
    if (last.id) startAfterId = last.id;

    await saveSyncState(
      'contacts',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
      },
      new Date().toISOString()
    );

    logger.info(`Contacts page synced: ${contacts.length} records (total ${total}).`);

    if (contacts.length < env.SYNC_BATCH_SIZE) break;
  }

  logger.info(`Contacts sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    logger.info('Contacts prune complete (removed records not present in full sync).');
  }
};
