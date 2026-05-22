import { describe, expect, it } from 'vitest';
import { fromHex, nBitsToBytes, pubkeyToBytes, signatureToBytes, toBytesBigEndian, uuidToBytes } from '../src';

describe('encoding validation', () => {
  it('rejects malformed hex', () => {
    expect(() => fromHex('0x0g')).toThrow(/non-hex/);
    expect(() => fromHex('abc')).toThrow(/odd length/);
    expect(() => fromHex('abcd', 1)).toThrow(/expected 1 bytes/);
  });

  it('validates fixed-width protocol encodings', () => {
    expect(uuidToBytes('550e8400-e29b-41d4-a716-446655440000')).toHaveLength(16);
    expect(pubkeyToBytes(`02${'00'.repeat(32)}`)).toHaveLength(33);
    expect(signatureToBytes('11'.repeat(64))).toHaveLength(64);
    expect(nBitsToBytes('0x1effffff')).toEqual(new Uint8Array([0x1e, 0xff, 0xff, 0xff]));
  });

  it('rejects unsigned integer overflow and negative values', () => {
    expect(() => toBytesBigEndian(-1, 4)).toThrow(/out of range/);
    expect(() => toBytesBigEndian(0x1_0000_0000, 4)).toThrow(/out of range/);
    expect(() => toBytesBigEndian(0x1_0000, 2)).toThrow(/out of range/);
  });
});
