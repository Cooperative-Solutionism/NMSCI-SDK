import type { PaginationQuery } from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_PATTERN = /^(?:[0-9a-f]{2})*$/i;
const COMPRESSED_PUBKEY_PATTERN = /^0[23][0-9a-f]{64}$/i;

export type SelectorMode = 'id' | 'pubkey' | 'none';

export function validatePageQuery(query: PaginationQuery | undefined, context: string): void {
  if (query?.page !== undefined && (!Number.isInteger(query.page) || query.page < 0)) {
    throw new Error(`${context}.page must be an integer >= 0`);
  }

  if (query?.size !== undefined && (!Number.isInteger(query.size) || query.size < 1 || query.size > 200)) {
    throw new Error(`${context}.size must be an integer between 1 and 200`);
  }
}

export function validateUuid(value: string | undefined, fieldName: string): void {
  if (value !== undefined && !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a UUID string`);
  }
}

export function validateRequiredUuid(value: string | undefined, fieldName: string): void {
  if (value === undefined || !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a UUID string`);
  }
}

export function validateHexString(value: string | undefined, fieldName: string, expectedBytes?: number): void {
  if (value === undefined) {
    return;
  }

  if (expectedBytes !== undefined && value.length !== expectedBytes * 2) {
    throw new Error(`${fieldName} must be a ${expectedBytes}-byte hex string`);
  }

  if (value.length === 0 || !HEX_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a hex string`);
  }
}

export function validateRequiredHexString(
  value: string | undefined,
  fieldName: string,
  expectedBytes?: number,
): void {
  if (value === undefined) {
    if (expectedBytes !== undefined) {
      throw new Error(`${fieldName} must be a ${expectedBytes}-byte hex string`);
    }
    throw new Error(`${fieldName} must be a hex string`);
  }

  validateHexString(value, fieldName, expectedBytes);
}

export function validateNonNegativeInteger(value: number | undefined, fieldName: string): void {
  if (value === undefined || !Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be an integer >= 0`);
  }
}

export function validateCompressedPubkey(value: string | undefined, fieldName: string): void {
  if (value !== undefined && !COMPRESSED_PUBKEY_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a 33-byte compressed public key hex string`);
  }
}

export function validateRequiredCompressedPubkey(value: string | undefined, fieldName: string): void {
  if (value === undefined || !COMPRESSED_PUBKEY_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a 33-byte compressed public key hex string`);
  }
}

export function validateRequiredParams<T>(
  params: T | undefined | null,
  context: string,
): asserts params is NonNullable<T> {
  if (params === undefined || params === null) {
    throw new Error(`${context} parameters are required`);
  }
}

export function validateTimeRange(
  startTime: number | undefined,
  endTime: number | undefined,
  context: string,
): void {
  if (startTime !== undefined && (!Number.isInteger(startTime) || startTime < 0)) {
    throw new Error(`${context}.startTime must be an integer >= 0`);
  }

  if (endTime !== undefined && (!Number.isInteger(endTime) || endTime < 0)) {
    throw new Error(`${context}.endTime must be an integer >= 0`);
  }

  if (startTime !== undefined && endTime !== undefined && endTime < startTime) {
    throw new Error(`${context}.endTime must be >= startTime`);
  }
}

export function validateNoIdPubkeyMix(
  params: Record<string, unknown> | undefined,
  idKeys: readonly string[],
  pubkeyKeys: readonly string[],
  context: string,
): SelectorMode {
  if (!params) {
    return 'none';
  }

  const hasId = idKeys.some(key => params[key] !== undefined);
  const hasPubkey = pubkeyKeys.some(key => params[key] !== undefined);
  if (hasId && hasPubkey) {
    throw new Error(`${context} cannot mix id and pubkey query parameters`);
  }

  if (hasId) {
    return 'id';
  }
  if (hasPubkey) {
    return 'pubkey';
  }
  return 'none';
}

export function validateRequiredTargetMode(
  params: Record<string, unknown>,
  context: string,
): SelectorMode {
  const mode = validateNoIdPubkeyMix(
    params,
    ['targetId', 'sourceId'],
    ['targetPubkey', 'sourcePubkey'],
    context,
  );
  if (params.targetId === undefined && params.targetPubkey === undefined) {
    throw new Error(`${context} requires targetId or targetPubkey`);
  }
  return mode;
}
