import { readFileSync } from 'node:fs';
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
  const expectedPublicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';

  it('derives the canonical compressed public key for private key 1', () => {
    expect(publicKey).toBe(expectedPublicKey);
  });

  it('signs canonical Low-S signatures and verifies them', async () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    const signature = await signData(payload, privateKey);

    expect(signature).toHaveLength(64);
    expect(validatePrivateKey(privateKey)).toBe(true);
    expect(publicKey).toBe(expectedPublicKey);
    expect(validatePublicKey(publicKey)).toEqual({ isValid: true });
    expect(validateSignatureLowS(toHex(signature))).toEqual({ isValid: true });
    await expect(verifySignature(payload, signature, publicKey)).resolves.toBe(true);
  });

  it('rejects tampered signatures, payloads, and public keys', async () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    const signature = await signData(payload, privateKey);
    const tamperedSignature = new Uint8Array(signature);
    tamperedSignature[0] ^= 0x01;

    await expect(verifySignature(new Uint8Array([1, 2, 3, 5]), signature, publicKey)).resolves.toBe(false);
    await expect(verifySignature(payload, tamperedSignature, publicKey)).resolves.toBe(false);
    await expect(
      verifySignature(payload, signature, getPublicKeyFromPrivate('02'.padStart(64, '0'))),
    ).resolves.toBe(false);
  });

  it('rejects non-canonical high-S signatures locally', () => {
    const highS = `${'00'.repeat(32)}${'ff'.repeat(32)}`;

    expect(validateSignatureLowS(highS)).toMatchObject({
      isValid: false,
      error: 'Signature S value is not canonical Low-S',
    });
  });
});

describe('secp256k1 dependency policy', () => {
  it('uses noble secp256k1 instead of elliptic', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
      dependencies?: Record<string, string>;
    };
    const source = readFileSync('src/core/crypto.ts', 'utf8');

    expect(pkg.dependencies).toHaveProperty('@noble/secp256k1');
    expect(pkg.dependencies ?? {}).not.toHaveProperty('elliptic');
    expect(source).toContain('@noble/secp256k1');
    expect(source).not.toContain('elliptic');
  });
});
