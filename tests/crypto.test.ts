import { describe, expect, it } from 'vitest';
import {
  getPublicKeyFromPrivate,
  signData,
  toHex,
  validatePrivateKey,
  validatePublicKey,
  validateSignatureLowS,
  verifySignature,
} from '../src';

describe('secp256k1 signing', () => {
  const privateKey = '01'.padStart(64, '0');
  const publicKey = getPublicKeyFromPrivate(privateKey);

  it('signs canonical Low-S signatures and verifies them', async () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    const signature = await signData(payload, privateKey);

    expect(signature).toHaveLength(64);
    expect(validatePrivateKey(privateKey)).toBe(true);
    expect(validatePublicKey(publicKey)).toEqual({ isValid: true });
    expect(validateSignatureLowS(toHex(signature))).toEqual({ isValid: true });
    await expect(verifySignature(payload, signature, publicKey)).resolves.toBe(true);
  });

  it('rejects non-canonical high-S signatures locally', () => {
    const highS = `${'00'.repeat(32)}${'ff'.repeat(32)}`;

    expect(validateSignatureLowS(highS)).toMatchObject({
      isValid: false,
      error: 'Signature S value is not canonical Low-S',
    });
  });
});
