import { fromHex, toBytesBigEndian } from '../core/encoding';

const UINT64_MAX = (1n << 64n) - 1n;

export function uuidField(value: string, fieldName: string): Uint8Array {
  const clean = stringField(value, fieldName).replace(/-/g, '');
  if (!/^[0-9a-fA-F]{32}$/.test(clean)) {
    throw new Error(`${fieldName} must be a 16-byte UUID hex string`);
  }
  return fromHex(clean, 16);
}

export function pubkeyField(value: string, fieldName: string): Uint8Array {
  const clean = stripHexPrefix(stringField(value, fieldName));
  if (!/^[0-9a-fA-F]{66}$/.test(clean)) {
    throw new Error(`${fieldName} must be a 33-byte compressed public key hex string`);
  }
  const prefix = clean.slice(0, 2).toLowerCase();
  if (prefix !== '02' && prefix !== '03') {
    throw new Error(`${fieldName} must be a 33-byte compressed public key hex string`);
  }
  return fromHex(clean, 33);
}

export function signatureField(value: string, fieldName: string): Uint8Array {
  const clean = stripHexPrefix(stringField(value, fieldName));
  if (!/^[0-9a-fA-F]{128}$/.test(clean)) {
    throw new Error(`${fieldName} must be a 64-byte hex signature`);
  }
  return fromHex(clean, 64);
}

export function optionalSignatureField(value: string | undefined, fieldName: string): Uint8Array {
  return value === undefined ? new Uint8Array(64) : signatureField(value, fieldName);
}

export function nBitsField(value: string, fieldName: string): Uint8Array {
  const clean = stripHexPrefix(stringField(value, fieldName));
  if (!/^[0-9a-fA-F]{8}$/.test(clean)) {
    throw new Error(`${fieldName} must be a 4-byte hex string`);
  }
  return fromHex(clean, 4);
}

export function uintNumberField(value: number, byteLength: 2 | 4, fieldName: string): Uint8Array {
  const max = 2 ** (byteLength * 8) - 1;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) {
    throw new Error(`${fieldName} must be an unsigned ${byteLength}-byte integer`);
  }
  return toBytesBigEndian(value, byteLength);
}

export function uint64BigIntField(value: bigint, fieldName: string): Uint8Array {
  if (typeof value !== 'bigint' || value < 0n || value > UINT64_MAX) {
    throw new Error(`${fieldName} must be a bigint unsigned 8-byte integer`);
  }
  return toBytesBigEndian(value, 8);
}

export function optionalUint64BigIntField(value: bigint | undefined, fieldName: string): Uint8Array {
  return value === undefined ? new Uint8Array(8) : uint64BigIntField(value, fieldName);
}

function stringField(value: string, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a hex string`);
  }
  return value;
}

function stripHexPrefix(value: string): string {
  return value.replace(/^0x/i, '');
}
