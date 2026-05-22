import { ec as EC } from 'elliptic';
import { toHex, fromHex, pubkeyToBytes, signatureToBytes } from './encoding';

const ec = new EC('secp256k1');
const CURVE_ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

export function generateKeyPair(): { privateKey: string; publicKey: string } {
  for (;;) {
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    const pkBigInt = BigInt('0x' + toHex(privateKeyBytes));
    if (pkBigInt < CURVE_ORDER && pkBigInt !== 0n) {
      const privateKeyHex = toHex(privateKeyBytes);
      const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');
      return { privateKey: privateKeyHex, publicKey: keyPair.getPublic(true, 'hex') };
    }
  }
}

export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const clean = privateKeyHex.replace(/^0x/, '');
  const keyPair = ec.keyFromPrivate(clean, 'hex');
  return keyPair.getPublic(true, 'hex');
}

export function validatePublicKey(publicKeyHex: string): { isValid: boolean; error?: string } {
  try {
    if (!publicKeyHex || typeof publicKeyHex !== 'string') {
      return { isValid: false, error: 'Public key must be a string' };
    }
    const clean = toHex(pubkeyToBytes(publicKeyHex));
    const keyPair = ec.keyFromPublic(clean, 'hex');
    if (!keyPair.getPublic().validate()) {
      return { isValid: false, error: 'Public key is not on secp256k1 curve' };
    }
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

export async function doubleSha256(data: Uint8Array): Promise<Uint8Array> {
  const firstHash = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const secondHash = await crypto.subtle.digest('SHA-256', firstHash);
  return new Uint8Array(secondHash);
}

export async function doubleSha256Hex(data: Uint8Array): Promise<string> {
  return toHex(await doubleSha256(data));
}

export async function signData(data: Uint8Array, privateKeyHex: string): Promise<Uint8Array> {
  const cleanHex = privateKeyHex.replace(/^0x/, '');
  if (cleanHex.length !== 64) {
    throw new Error(`Private key must be 64 hex chars, got ${cleanHex.length}`);
  }

  const hashedData = await doubleSha256(data);

  const keyPair = ec.keyFromPrivate(cleanHex, 'hex');
  const signature = keyPair.sign(hashedData, { canonical: true });

  let finalS = signature.s;
  const halfCurveOrder = ec.curve.n.shrn(1);
  if (finalS.gt(halfCurveOrder)) {
    finalS = ec.curve.n.sub(finalS);
  }

  const rBytes = new Uint8Array(signature.r.toArray('be', 32));
  const sBytes = new Uint8Array(finalS.toArray('be', 32));

  const rsSignature = new Uint8Array(64);
  rsSignature.set(rBytes, 0);
  rsSignature.set(sBytes, 32);
  return rsSignature;
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

    const r = signature.slice(0, 32);
    const s = signature.slice(32, 64);
    const rHex = toHex(r);
    const sHex = toHex(s);

    const cleanPubkey = publicKeyHex.replace(/^0x/, '');
    const keyPair = ec.keyFromPublic(cleanPubkey, 'hex');
    return keyPair.verify(hashedData, { r: rHex, s: sHex });
  } catch {
    return false;
  }
}
