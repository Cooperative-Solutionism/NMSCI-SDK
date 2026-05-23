/**
 * Big-endian byte encoding utilities.
 * All integer conversions use big-endian per the NMSCI protocol spec.
 */

export function toBytesBigEndian(value: number | bigint, byteLength: number): Uint8Array {
  const bigintValue = BigInt(value);
  const max = (1n << BigInt(byteLength * 8)) - 1n;
  if (bigintValue < 0n || bigintValue > max) {
    throw new Error(`Unsigned ${byteLength}-byte integer out of range: ${value.toString()}`);
  }

  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  if (byteLength === 2) {
    view.setUint16(0, Number(bigintValue), false);
  } else if (byteLength === 4) {
    view.setUint32(0, Number(bigintValue), false);
  } else if (byteLength === 8) {
    view.setBigUint64(0, bigintValue, false);
  } else {
    throw new Error(`Unsupported byte length: ${byteLength}`);
  }
  return new Uint8Array(buffer);
}

export function uuidToBytes(uuid: string): Uint8Array {
  const clean = uuid.replace(/-/g, '');
  if (clean.length !== 32) {
    throw new Error(`Invalid UUID: expected 32 hex chars, got ${clean.length}`);
  }
  return fromHex(clean, 16);
}

export function bytesToUuid(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new Error(`Expected 16 bytes for UUID, got ${bytes.length}`);
  }
  return toHex(bytes);
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex: string, expectedBytes?: number): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  if (clean.length % 2 !== 0) {
    throw new Error(`Invalid hex string: odd length (${clean.length})`);
  }
  if (!/^[0-9a-fA-F]*$/.test(clean)) {
    throw new Error('Invalid hex string: contains non-hex characters');
  }
  if (expectedBytes != null && clean.length !== expectedBytes * 2) {
    throw new Error(`Invalid hex length: expected ${expectedBytes} bytes, got ${clean.length / 2}`);
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

export function pubkeyToBytes(pubkey: string): Uint8Array {
  const clean = pubkey.replace(/^0x/, '');
  if (clean.length !== 66) {
    throw new Error(`Compressed public key must be 33 bytes, got ${clean.length / 2}`);
  }
  const prefix = clean.slice(0, 2).toLowerCase();
  if (prefix !== '02' && prefix !== '03') {
    throw new Error('Compressed public key must start with 02 or 03');
  }
  return fromHex(clean, 33);
}

export function signatureToBytes(signature: string): Uint8Array {
  return fromHex(signature, 64);
}

export function nBitsToBytes(nBits: string): Uint8Array {
  return fromHex(nBits.replace(/^0x/, '').padStart(8, '0'), 4);
}

export function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function bytesToUint16(bytes: Uint8Array): number {
  if (bytes.length !== 2) throw new Error(`Expected 2 bytes, got ${bytes.length}`);
  return new DataView(bytes.buffer, bytes.byteOffset, 2).getUint16(0, false);
}

export function bytesToUint32(bytes: Uint8Array): number {
  if (bytes.length !== 4) throw new Error(`Expected 4 bytes, got ${bytes.length}`);
  return new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0, false);
}

export function bytesToBigUint64(bytes: Uint8Array): bigint {
  if (bytes.length !== 8) throw new Error(`Expected 8 bytes, got ${bytes.length}`);
  return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0, false);
}

export function bytesToBigInt64(bytes: Uint8Array): bigint {
  if (bytes.length !== 8) throw new Error(`Expected 8 bytes, got ${bytes.length}`);
  return new DataView(bytes.buffer, bytes.byteOffset, 8).getBigInt64(0, false);
}
