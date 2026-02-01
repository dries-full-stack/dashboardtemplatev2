import { env } from '../config/env.js';
import { supabase } from '../clients/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { chunkArray, toEpochMs, toIsoDate } from './utils.js';
import { getSyncState, saveSyncState } from './syncState.js';
import type { GhlContext } from '../config/ghlContext.js';

type OpportunityRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  name?: string;
  status?: string;
  pipelineId?: string;
  pipelineStageId?: string;
  monetaryValue?: number;
  assignedTo?: string;
  contactId?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
};

const UPSERT_BATCH_SIZE = 500;

export const syncOpportunities = async (context: GhlContext) => {
  const { locationId, client } = context;
  const state = await getSyncState('opportunities', locationId);
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
  } else if (env.OPPORTUNITIES_REFRESH_DAYS > 0) {
    const refreshStart = now - env.OPPORTUNITIES_REFRESH_DAYS * 24 * 60 * 60 * 1000;
    if (!startAfter || startAfter > refreshStart) {
      startAfter = refreshStart;
      startAfterId = null;
    }
  }

  if (isFullSync && state && !env.FULL_SYNC) {
    logger.info('Full sync triggered by interval or missing last full sync.');
  }

  logger.info('Syncing opportunities...');

  let total = 0;
  while (true) {
    const response = await client.searchOpportunities({
      locationId,
      limit: env.SYNC_BATCH_SIZE,
      startAfter: startAfter ?? undefined,
      startAfterId: startAfterId ?? undefined,
      status: 'all',
      order: 'added_asc'
    });

    const opportunities = (response.opportunities ?? []) as OpportunityRecord[];
    if (opportunities.length === 0) break;

    const rows = opportunities.map((opportunity) => {
      const createdAt = toIsoDate(opportunity.createdAt ?? (opportunity as Record<string, unknown>).created_at);
      const updatedAt = toIsoDate(
        opportunity.updatedAt ?? (opportunity as Record<string, unknown>).updated_at ?? createdAt
      );

      return {
        id: opportunity.id,
        location_id: opportunity.locationId ?? locationId,
        name: opportunity.name ?? null,
        status: opportunity.status ?? null,
        pipeline_id: opportunity.pipelineId ?? null,
        pipeline_stage_id: opportunity.pipelineStageId ?? null,
        monetary_value: opportunity.monetaryValue ?? null,
        assigned_to: opportunity.assignedTo ?? null,
        contact_id: opportunity.contactId ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: opportunity,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await supabase.from('opportunities').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += opportunities.length;

    const meta = response.meta as Record<string, unknown> | undefined;
    const metaStartAfter = typeof meta?.startAfter === 'number' ? (meta.startAfter as number) : null;
    const metaStartAfterId = typeof meta?.startAfterId === 'string' ? (meta.startAfterId as string) : null;

    if (metaStartAfter) {
      startAfter = metaStartAfter;
      startAfterId = metaStartAfterId ?? startAfterId;
    } else {
      const last = opportunities[opportunities.length - 1];
      const lastTimestamp = toEpochMs(last.createdAt ?? last.updatedAt);
      if (lastTimestamp) startAfter = lastTimestamp;
      if (last.id) startAfterId = last.id;
    }

    await saveSyncState(
      'opportunities',
      locationId,
      {
        startAfter: startAfter ?? null,
        startAfterId: startAfterId ?? null,
        lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
      },
      new Date().toISOString()
    );

    logger.info(`Opportunities page synced: ${opportunities.length} records (total ${total}).`);

    if (opportunities.length < env.SYNC_BATCH_SIZE) break;
  }

  logger.info(`Opportunities sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    logger.info('Opportunities prune complete (removed records not present in full sync).');
  }
};
