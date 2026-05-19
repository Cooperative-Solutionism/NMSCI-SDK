function fromHex(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${clean.length})`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function calculateTargetFromNBits(nBitsHex: string): string {
  const clean = nBitsHex.replace(/^0x/, '').padStart(8, '0');
  const bytes = fromHex(clean);
  const exponent = bytes[0];
  const mantissa = (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];

  const targetBytes = new Uint8Array(32);

  if (exponent <= 3) {
    const targetValue = mantissa >>> (8 * (3 - exponent));
    targetBytes[28] = (targetValue >>> 24) & 0xff;
    targetBytes[29] = (targetValue >>> 16) & 0xff;
    targetBytes[30] = (targetValue >>> 8) & 0xff;
    targetBytes[31] = targetValue & 0xff;
  } else {
    const startIndex = 32 - exponent;
    if (startIndex < 0) {
      throw new Error(`nBits exponent too large: ${exponent} (max 32)`);
    }
    targetBytes[startIndex] = (mantissa >>> 16) & 0xff;
    if (startIndex + 1 < 32) targetBytes[startIndex + 1] = (mantissa >>> 8) & 0xff;
    if (startIndex + 2 < 32) targetBytes[startIndex + 2] = mantissa & 0xff;
  }

  return toHex(targetBytes);
}

export function compareHex(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  const pa = a.toLowerCase().padStart(maxLen, '0');
  const pb = b.toLowerCase().padStart(maxLen, '0');
  for (let i = 0; i < maxLen; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

export async function doubleSha256Hex(data: Uint8Array): Promise<string> {
  const first = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const second = await crypto.subtle.digest('SHA-256', first);
  return toHex(new Uint8Array(second));
}

export async function doubleSha256(data: Uint8Array): Promise<Uint8Array> {
  const first = await crypto.subtle.digest('SHA-256', data as BufferSource);
  const second = await crypto.subtle.digest('SHA-256', first);
  return new Uint8Array(second);
}

export async function mineNonce(
  noncePrefix: Uint8Array,
  nonceSuffix: Uint8Array,
  targetHex: string,
  onProgress?: (attempts: number, hashHex: string, nonce: number) => void,
  maxNonce: number = 0x7fffffff,
): Promise<number> {
  const nonceBytes = new Uint8Array(4);
  for (let nonce = 0; nonce <= maxNonce; nonce++) {
    nonceBytes[0] = (nonce >>> 24) & 0xff;
    nonceBytes[1] = (nonce >>> 16) & 0xff;
    nonceBytes[2] = (nonce >>> 8) & 0xff;
    nonceBytes[3] = nonce & 0xff;

    const totalLen = noncePrefix.length + 4 + nonceSuffix.length;
    const data = new Uint8Array(totalLen);
    data.set(noncePrefix, 0);
    data.set(nonceBytes, noncePrefix.length);
    data.set(nonceSuffix, noncePrefix.length + 4);

    const hashHex = await doubleSha256Hex(data);

    if (compareHex(hashHex, targetHex) < 0) {
      return nonce;
    }

    if (onProgress && nonce % 1000 === 0) {
      onProgress(nonce, hashHex, nonce);
    }
  }
  throw new Error(`PoW mining exhausted: tried ${maxNonce} nonces without finding valid hash`);
}
