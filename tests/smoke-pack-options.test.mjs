import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { parseSmokePackArgs } from '../scripts/smoke-pack.mjs';

describe('smoke-pack CLI options', () => {
  it('builds by default', () => {
    expect(parseSmokePackArgs([])).toEqual({ skipBuild: false });
  });

  it('can skip the build when dist has already been prepared', () => {
    expect(parseSmokePackArgs(['--skip-build'])).toEqual({ skipBuild: true });
  });

  it('rejects unknown options', () => {
    expect(() => parseSmokePackArgs(['--unknown'])).toThrow('Unknown smoke-pack option: --unknown');
  });

  it('can import the parser outside npm-run context', () => {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'npm_execpath'),
    );

    const output = execFileSync(process.execPath, [
      '--input-type=module',
      '-e',
      "import { parseSmokePackArgs } from './scripts/smoke-pack.mjs'; process.stdout.write(JSON.stringify(parseSmokePackArgs(['--skip-build'])));",
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env,
    });

    expect(output).toBe('{"skipBuild":true}');
  });
});
