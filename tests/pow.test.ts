import { describe, expect, it } from 'vitest';
import { calculateTargetFromNBits, compareHex, doubleSha256Hex, mineNonce } from '../src';

describe('PoW utilities', () => {
  it('calculates compact nBits targets', () => {
    expect(calculateTargetFromNBits('1d00ffff')).toBe(
      '00000000ffff0000000000000000000000000000000000000000000000000000',
    );
    expect(calculateTargetFromNBits('0x1effffff')).toBe(
      '0000ffffff000000000000000000000000000000000000000000000000000000',
    );
  });

  it('compares hex strings as big-endian integers', () => {
    expect(compareHex('0f', '10')).toBe(-1);
    expect(compareHex('0010', '10')).toBe(0);
    expect(compareHex('11', '10')).toBe(1);
  });

  it('calculates double SHA-256 hashes', async () => {
    await expect(doubleSha256Hex(new Uint8Array())).resolves.toBe(
      '5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456',
    );
  });

  it('mines nonce zero when target is above any possible hash', async () => {
    await expect(mineNonce(new Uint8Array([1]), new Uint8Array([2]), 'ff'.repeat(32))).resolves.toBe(0);
  });
});
