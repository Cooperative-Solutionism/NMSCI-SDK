import { describe, expect, it } from 'vitest';
import {
  validateCompressedPubkey,
  validateHexString,
  validatePageQuery,
  validateTimeRange,
  validateUuid,
} from '../src/api/query-validation';

describe('API query validation primitives', () => {
  it('validates page query bounds', () => {
    expect(() => validatePageQuery({ page: 0, size: 200 }, 'messages')).not.toThrow();

    expect(() => validatePageQuery({ page: -1 }, 'messages')).toThrow(
      'messages.page must be an integer >= 0',
    );
    expect(() => validatePageQuery({ page: 1.5 }, 'messages')).toThrow(
      'messages.page must be an integer >= 0',
    );
    expect(() => validatePageQuery({ size: 0 }, 'messages')).toThrow(
      'messages.size must be an integer between 1 and 200',
    );
    expect(() => validatePageQuery({ size: 1.5 }, 'messages')).toThrow(
      'messages.size must be an integer between 1 and 200',
    );
    expect(() => validatePageQuery({ size: 201 }, 'messages')).toThrow(
      'messages.size must be an integer between 1 and 200',
    );
  });

  it('validates UUID strings', () => {
    const validUuids = [
      '550e8400-e29b-11d4-8716-446655440000',
      '550e8400-e29b-21d4-9716-446655440000',
      '550e8400-e29b-31d4-a716-446655440000',
      '550e8400-e29b-41d4-b716-446655440000',
      '550e8400-e29b-51d4-8716-446655440000',
    ];

    for (const uuid of validUuids) {
      expect(() => validateUuid(uuid, 'id')).not.toThrow();
    }

    expect(() => validateUuid('not-a-uuid', 'id')).toThrow(/id must be a UUID string/);
  });

  it('validates compressed public keys', () => {
    expect(() => validateCompressedPubkey(`02${'a'.repeat(64)}`, 'flowNodePubkey')).not.toThrow();
    expect(() => validateCompressedPubkey(`03${'b'.repeat(64)}`, 'flowNodePubkey')).not.toThrow();

    expect(() => validateCompressedPubkey(`04${'a'.repeat(128)}`, 'flowNodePubkey')).toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
    expect(() => validateCompressedPubkey(`02${'g'.repeat(64)}`, 'flowNodePubkey')).toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
    expect(() => validateCompressedPubkey(`02${'a'.repeat(62)}`, 'flowNodePubkey')).toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
  });

  it('validates generic hex strings', () => {
    expect(() => validateHexString(undefined, 'hash')).not.toThrow();
    expect(() => validateHexString('00aaff', 'rawBytes')).not.toThrow();
    expect(() => validateHexString('00aaff', 'rawBytes', 3)).not.toThrow();

    expect(() => validateHexString('', 'hash')).toThrow(/hash must be a hex string/);
    expect(() => validateHexString('00zz', 'rawBytes')).toThrow(/rawBytes must be a hex string/);
    expect(() => validateHexString('abc', 'rawBytes')).toThrow(/rawBytes must be a hex string/);
    expect(() => validateHexString('00aaff', 'rawBytes', 32)).toThrow(
      /rawBytes must be a 32-byte hex string/,
    );
  });

  it('validates time ranges', () => {
    expect(() => validateTimeRange(undefined, undefined, 'edges')).not.toThrow();
    expect(() => validateTimeRange(0, undefined, 'edges')).not.toThrow();
    expect(() => validateTimeRange(undefined, 10, 'edges')).not.toThrow();
    expect(() => validateTimeRange(0, 10, 'edges')).not.toThrow();

    expect(() => validateTimeRange(-1, 10, 'edges')).toThrow(
      'edges.startTime must be an integer >= 0',
    );
    expect(() => validateTimeRange(1.5, 10, 'edges')).toThrow(
      'edges.startTime must be an integer >= 0',
    );
    expect(() => validateTimeRange(0, -1, 'edges')).toThrow(
      'edges.endTime must be an integer >= 0',
    );
    expect(() => validateTimeRange(0, 1.5, 'edges')).toThrow(
      'edges.endTime must be an integer >= 0',
    );
    expect(() => validateTimeRange(10, 9, 'edges')).toThrow('edges.endTime must be >= startTime');
  });
});
