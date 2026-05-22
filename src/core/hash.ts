import { toHex } from './encoding';

export async function doubleSha256(data: Uint8Array): Promise<Uint8Array> {
  const firstHash = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const secondHash = await crypto.subtle.digest('SHA-256', firstHash);
  return new Uint8Array(secondHash);
}

export async function doubleSha256Hex(data: Uint8Array): Promise<string> {
  return toHex(await doubleSha256(data));
}
