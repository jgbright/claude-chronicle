#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const localVitestEntrypoint = path.resolve('node_modules/vitest/vitest.mjs');

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit' });
  if (typeof result.status === 'number') {
    process.exit(result.status);
  }
  process.exit(1);
}

if (existsSync(localVitestEntrypoint)) {
  run(process.execPath, [localVitestEntrypoint, ...args]);
}

console.warn('[chronicle] Local vitest was not found; falling back to `npm exec vitest`.');
run('npm', ['exec', '--yes', 'vitest', '--', ...args]);
