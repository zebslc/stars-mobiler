#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const outputPath = resolve('.angular/template-check');
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const args = [
  'ng',
  'build',
  '--configuration',
  'development',
  '--no-progress',
  '--output-path',
  outputPath,
  '--build-optimizer=false',
  '--named-chunks=false',
  '--vendor-chunk=false',
  '--common-chunk=false'
];

// Run Angular build to trigger template type checking without producing a distributable bundle.
const result = spawnSync(cmd, args, { stdio: 'inherit' });

if (result.status === 0) {
  rmSync(outputPath, { recursive: true, force: true });
}

process.exit(result.status ?? 1);
