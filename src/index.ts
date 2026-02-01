import { syncContacts } from './sync/syncContacts.js';
import { syncOpportunities } from './sync/syncOpportunities.js';
import { syncAppointments } from './sync/syncAppointments.js';
import { logger } from './utils/logger.js';
import { loadGhlContext } from './config/ghlContext.js';
import { env } from './config/env.js';

const args = new Set(process.argv.slice(2).map((arg) => arg.replace(/^--/, '').toLowerCase()));
const runAll = args.size === 0 || args.has('all');
const runOnce = args.has('once') || env.RUN_ONCE || env.SYNC_INTERVAL_MINUTES <= 0;

const shouldRun = (name: string) => runAll || args.has(name);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runOnceSync = async () => {
  const startedAt = new Date();
  logger.info(`Starting sync at ${startedAt.toISOString()}`);

  const context = await loadGhlContext();
  logger.info(`Using GHL config source: ${context.source}.`);

  if (shouldRun('contacts')) {
    await syncContacts(context);
  }

  if (shouldRun('opportunities')) {
    await syncOpportunities(context);
  }

  if (shouldRun('appointments')) {
    await syncAppointments(context);
  }

  const finishedAt = new Date();
  logger.info(`Sync finished at ${finishedAt.toISOString()}`);
};

const run = async () => {
  do {
    try {
      await runOnceSync();
    } catch (error) {
      logger.error('Sync failed.', error);
      if (runOnce) throw error;
    }

    if (runOnce) break;

    logger.info(`Next sync in ${env.SYNC_INTERVAL_MINUTES} minutes.`);
    await sleep(env.SYNC_INTERVAL_MINUTES * 60 * 1000);
  } while (true);
};

run().catch(() => process.exit(1));
