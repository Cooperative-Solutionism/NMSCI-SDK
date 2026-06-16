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
});
