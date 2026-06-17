import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  fromHex,
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
  const vectorPayload = new Uint8Array([1, 2, 3, 4]);
  const expectedLowSSignature =
    '5ace0f3eb575dab1957f51ac25ad130f44fb5ce29df7714121c7c973cb7a304f' +
    '2dd1ed0e62947262e4e63dea29e17f77db5c98084bc9ead21e370972e4ec7d96';
  const equivalentHighSSignature =
    '5ace0f3eb575dab1957f51ac25ad130f44fb5ce29df7714121c7c973cb7a304f' +
    'd22e12f19d6b8d9d1b19c215d61e8086df5244de637eb569a19b5519eb49c3ab';

  it('derives the canonical compressed public key for private key 1', () => {
    expect(publicKey).toBe(expectedPublicKey);
  });

  it('signs canonical Low-S signatures and verifies them', async () => {
    const signature = await signData(vectorPayload, privateKey);

    expect(signature).toHaveLength(64);
    expect(validatePrivateKey(privateKey)).toBe(true);
    expect(publicKey).toBe(expectedPublicKey);
    expect(validatePublicKey(publicKey)).toEqual({ isValid: true });
    expect(validateSignatureLowS(toHex(signature))).toEqual({ isValid: true });
    await expect(verifySignature(vectorPayload, signature, publicKey)).resolves.toBe(true);
  });

  it('keeps a deterministic compact signature vector stable', async () => {
    await expect(signData(vectorPayload, privateKey).then(toHex)).resolves.toBe(expectedLowSSignature);
  });

  it('rejects tampered signatures, payloads, and public keys', async () => {
    const payload = vectorPayload;
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

  it('keeps high-S verification compatibility while local policy rejects it', async () => {
    expect(validateSignatureLowS(equivalentHighSSignature)).toMatchObject({ isValid: false });
    await expect(verifySignature(vectorPayload, fromHex(equivalentHighSSignature, 64), publicKey)).resolves.toBe(true);
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
