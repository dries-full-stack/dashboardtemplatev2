import { env } from '../config/env.js';

type Level = 'error' | 'warn' | 'info' | 'debug';

const levels: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = ((): Level => {
  const raw = env.LOG_LEVEL.toLowerCase();
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
    return raw;
  }
  return 'info';
})();

const shouldLog = (level: Level) => levels[level] <= levels[currentLevel];

const format = (level: Level, message: string) => `[${level.toUpperCase()}] ${message}`;

export const logger = {
  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) console.error(format('error', message), ...args);
  },
  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) console.warn(format('warn', message), ...args);
  },
  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) console.log(format('info', message), ...args);
  },
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) console.log(format('debug', message), ...args);
  }
};
