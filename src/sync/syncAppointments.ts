import { env } from '../config/env.js';
import { supabase } from '../clients/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { chunkArray, toIsoDate } from './utils.js';
import { getSyncState, saveSyncState } from './syncState.js';
import type { GhlContext } from '../config/ghlContext.js';

type CalendarRecord = Record<string, unknown> & { id?: string };

type CalendarEventRecord = Record<string, unknown> & {
  id?: string;
  locationId?: string;
  calendarId?: string;
  contactId?: string;
  appointmentStatus?: string;
  assignedUserId?: string;
  title?: string;
  startTime?: unknown;
  endTime?: unknown;
  dateAdded?: unknown;
  dateUpdated?: unknown;
};

const UPSERT_BATCH_SIZE = 500;

export const syncAppointments = async (context: GhlContext) => {
  const { locationId, client } = context;
  const now = Date.now();
  const state = await getSyncState('appointments', locationId);
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

  const lookbackMs = env.APPOINTMENTS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  const lookaheadMs = env.APPOINTMENTS_LOOKAHEAD_DAYS * 24 * 60 * 60 * 1000;

  let startTime = now - lookbackMs;
  if (!isFullSync && state?.last_synced_at) {
    const lastSynced = Date.parse(state.last_synced_at);
    if (!Number.isNaN(lastSynced)) {
      startTime = lastSynced - lookbackMs;
    }
  }
  const endTime = now + lookaheadMs;

  if (isFullSync && state && !env.FULL_SYNC) {
    logger.info('Full sync triggered by interval or missing last full sync.');
  }

  logger.info('Syncing appointments...');

  const calendarsResponse = await client.getCalendars({
    locationId,
    showDrafted: true
  });

  const calendars = (calendarsResponse.calendars ?? []) as CalendarRecord[];
  if (calendars.length === 0) {
    logger.warn('No calendars found. Skipping appointments sync.');
    return;
  }

  let total = 0;

  for (const calendar of calendars) {
    if (!calendar.id) continue;

    const eventsResponse = await client.getCalendarEvents({
      locationId,
      calendarId: calendar.id,
      startTime,
      endTime
    });

    const events = (eventsResponse.events ?? []) as CalendarEventRecord[];
    if (events.length === 0) continue;

    const rows = events.map((event) => {
      const createdAt = toIsoDate(event.dateAdded ?? (event as Record<string, unknown>).createdAt);
      const updatedAt = toIsoDate(
        event.dateUpdated ?? (event as Record<string, unknown>).updatedAt ?? createdAt
      );

      return {
        id: event.id,
        location_id: event.locationId ?? locationId,
        calendar_id: event.calendarId ?? calendar.id,
        contact_id: event.contactId ?? null,
        appointment_status: event.appointmentStatus ?? null,
        assigned_user_id: event.assignedUserId ?? null,
        title: event.title ?? null,
        start_time: toIsoDate(event.startTime) ?? null,
        end_time: toIsoDate(event.endTime) ?? null,
        created_at: createdAt,
        updated_at: updatedAt,
        raw_data: event,
        synced_at: syncStartedAt
      };
    });

    for (const chunk of chunkArray(rows, UPSERT_BATCH_SIZE)) {
      const { error } = await supabase.from('appointments').upsert(chunk, {
        onConflict: 'id,location_id'
      });
      if (error) throw error;
    }

    total += events.length;
    logger.info(`Appointments synced for calendar ${calendar.id}: ${events.length} records.`);
  }

  await saveSyncState('appointments', locationId, {
    lastFullSyncAt: isFullSync ? syncStartedAt : lastFullSyncAt
  }, new Date().toISOString());

  logger.info(`Appointments sync complete. Total records: ${total}.`);

  if (isFullSync && env.PRUNE_ON_FULL_SYNC) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('location_id', locationId)
      .lt('synced_at', syncStartedAt);

    if (error) throw error;
    logger.info('Appointments prune complete (removed records not present in full sync).');
  }
};
