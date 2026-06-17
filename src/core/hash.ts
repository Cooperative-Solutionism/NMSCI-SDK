import { toHex } from './encoding';

export async function getSubtleCrypto(): Promise<SubtleCrypto> {
  if (globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }

  const { webcrypto } = await import('node:crypto');
  if (webcrypto?.subtle) {
    return webcrypto.subtle as SubtleCrypto;
  }

  throw new Error('Web Crypto subtle digest is not available in this runtime');
}

export async function doubleSha256(data: Uint8Array): Promise<Uint8Array> {
  const subtle = await getSubtleCrypto();
  const firstHash = await subtle.digest('SHA-256', data as BufferSource);
  const secondHash = await subtle.digest('SHA-256', firstHash);
  return new Uint8Array(secondHash);
}

export async function doubleSha256Hex(data: Uint8Array): Promise<string> {
  return toHex(await doubleSha256(data));
}
