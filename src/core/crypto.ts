import { etc, getPublicKey as derivePublicKey, Point, signAsync, verify } from '@noble/secp256k1';
import { concat, fromHex, toHex, pubkeyToBytes, signatureToBytes } from './encoding';
import { doubleSha256, doubleSha256Hex, getSubtleCrypto } from './hash';

const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

etc.hmacSha256Async = async (key, ...msgs) => {
  const subtle = await getSubtleCrypto();
  const cryptoKey = await subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  return new Uint8Array(await subtle.sign('HMAC', cryptoKey, concat(...msgs) as BufferSource));
};

function privateKeyToBytes(privateKeyHex: string, requireFullLength = true): Uint8Array {
  const clean = privateKeyHex.replace(/^0x/, '');
  if (requireFullLength && clean.length !== 64) {
    throw new Error(`Private key must be 64 hex chars, got ${clean.length}`);
  }
  return fromHex(clean.padStart(64, '0'), 32);
}

export function generateKeyPair(): { privateKey: string; publicKey: string } {
  for (;;) {
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    const pkBigInt = BigInt('0x' + toHex(privateKeyBytes));
    if (pkBigInt < CURVE_ORDER && pkBigInt !== 0n) {
      const privateKeyHex = toHex(privateKeyBytes);
      return { privateKey: privateKeyHex, publicKey: toHex(derivePublicKey(privateKeyBytes, true)) };
    }
  }
}

export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  return toHex(derivePublicKey(privateKeyToBytes(privateKeyHex, false), true));
}

export function validatePublicKey(publicKeyHex: string): { isValid: boolean; error?: string } {
  try {
    if (!publicKeyHex || typeof publicKeyHex !== 'string') {
      return { isValid: false, error: 'Public key must be a string' };
    }
    const clean = pubkeyToBytes(publicKeyHex);
    Point.fromBytes(clean).assertValidity();
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: `Validation failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export function validatePrivateKey(privateKeyHex: string): boolean {
  try {
    const clean = privateKeyHex.replace(/^0x/, '');
    if (clean.length !== 64) return false;
    if (!/^[0-9a-fA-F]+$/.test(clean)) return false;
    const pkBigInt = BigInt('0x' + clean);
    if (pkBigInt >= CURVE_ORDER || pkBigInt === 0n) return false;
    return true;
  } catch {
    return false;
  }
}

export { doubleSha256, doubleSha256Hex };

export async function signData(data: Uint8Array, privateKeyHex: string): Promise<Uint8Array> {
  const cleanHex = privateKeyHex.replace(/^0x/, '');
  if (cleanHex.length !== 64) {
    throw new Error(`Private key must be 64 hex chars, got ${cleanHex.length}`);
  }
  if (!validatePrivateKey(cleanHex)) {
    throw new Error('Private key must be a valid secp256k1 scalar');
  }

  const hashedData = await doubleSha256(data);
  const signature = await signAsync(hashedData, privateKeyToBytes(cleanHex), { lowS: true, extraEntropy: false });
  return signature.toCompactRawBytes();
}

export function validateSignatureLowS(signatureHex: string): { isValid: boolean; error?: string } {
  try {
    const signature = signatureToBytes(signatureHex);
    const sHex = toHex(signature.slice(32, 64));
    const s = BigInt('0x' + sHex);
    if (s > CURVE_ORDER / 2n) {
      return { isValid: false, error: 'Signature S value is not canonical Low-S' };
    }
    return { isValid: true };
  } catch (e) {
    return { isValid: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function verifySignature(
  data: Uint8Array,
  signature: Uint8Array,
  publicKeyHex: string,
): Promise<boolean> {
  try {
    if (signature.length !== 64) {
      throw new Error(`Signature must be 64 bytes, got ${signature.length}`);
    }

    const hashedData = await doubleSha256(data);
    return verify(signature, hashedData, pubkeyToBytes(publicKeyHex), { lowS: false });
  } catch {
    return false;
  }
}
