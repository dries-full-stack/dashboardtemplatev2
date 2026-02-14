#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function spawnChild(label, args) {
  const child = spawn(npmCmd, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error(`[dev] Failed to start ${label}:`, err);
  });

  return child;
}

const onboard = spawnChild('onboarding', ['run', 'onboard']);
const dashboard = spawnChild('dashboard', ['--prefix', 'dashboard', 'run', 'dev']);

let isShuttingDown = false;

function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  // Best-effort: stop both child processes when the parent is interrupted.
  try {
    onboard.kill(signal);
  } catch {
    // ignore
  }

  try {
    dashboard.kill(signal);
  } catch {
    // ignore
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

function onExit(which, code, signal) {
  if (!isShuttingDown) shutdown('SIGTERM');
  if (signal) process.exit(1);
  process.exit(code ?? 1);
}

onboard.on('exit', (code, signal) => onExit('onboarding', code, signal));
dashboard.on('exit', (code, signal) => onExit('dashboard', code, signal));
