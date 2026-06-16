#!/usr/bin/env node
// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fallbackNpmCli = resolve(root, 'node_modules/npm/bin/npm-cli.js');
const npmCli = process.env.npm_execpath || (existsSync(fallbackNpmCli) ? fallbackNpmCli : undefined);

if (!npmCli) {
  throw new Error('Unable to locate npm CLI. Run this script through npm or install npm locally.');
}

export function parseSmokePackArgs(argv = process.argv.slice(2)) {
  const options = { skipBuild: false };

  for (const arg of argv) {
    if (arg === '--skip-build') {
      options.skipBuild = true;
    } else {
      throw new Error(`Unknown smoke-pack option: ${arg}`);
    }
  }

  return options;
}

const run = (cmd, args, options = {}) => {
  execFileSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
};

const capture = (cmd, args, options = {}) =>
  execFileSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });

const runNpm = (args, options = {}) => run(process.execPath, [npmCli, ...args], options);
const captureNpm = (args, options = {}) => capture(process.execPath, [npmCli, ...args], options);

export function runSmokePack(options = parseSmokePackArgs()) {
  const tempDir = mkdtempSync(join(tmpdir(), 'nmsci-sdk-pack-'));

  try {
    if (!options.skipBuild) {
      runNpm(['run', 'build']);
    }

    const packJson = captureNpm(['pack', '--json', '--pack-destination', tempDir]);
    const [{ filename }] = JSON.parse(packJson);
    const tarball = join(tempDir, filename);

    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'nmsci-sdk-pack-smoke',
      version: '1.0.0',
      private: true,
      type: 'module',
    }, null, 2));

    runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: tempDir });

    writeFileSync(join(tempDir, 'esm-smoke.mjs'), `
const entries = ['@nmsci/sdk', '@nmsci/sdk/api', '@nmsci/sdk/messages', '@nmsci/sdk/protocol'];
for (const entry of entries) {
  const mod = await import(entry);
  if (!mod || Object.keys(mod).length === 0) {
    throw new Error(\`ESM import produced an empty module for \${entry}\`);
  }
}
`);

    writeFileSync(join(tempDir, 'cjs-smoke.cjs'), `
const entries = ['@nmsci/sdk', '@nmsci/sdk/api', '@nmsci/sdk/messages', '@nmsci/sdk/protocol'];
for (const entry of entries) {
  const mod = require(entry);
  if (!mod || Object.keys(mod).length === 0) {
    throw new Error(\`CJS require produced an empty module for \${entry}\`);
  }
}
`);

    execFileSync(process.execPath, [join(tempDir, 'esm-smoke.mjs')], { cwd: tempDir, stdio: 'inherit' });
    execFileSync(process.execPath, [join(tempDir, 'cjs-smoke.cjs')], { cwd: tempDir, stdio: 'inherit' });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmokePack();
}
