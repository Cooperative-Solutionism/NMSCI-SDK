import { describe, expect, it } from 'vitest';
import {
  ApiClient,
  getConsumeChainById,
  getConsumeChainByEnd,
  getConsumeChainByMountedTransaction,
  getConsumeChainByNode,
  getConsumeChainByStart,
  getConsumeChainEdges,
  getBlockByHash,
  getCentralPubkeyLockedMsgByCentralPubkey,
  getFlowNodeLockedMsgByFlowNodePubkey,
  getFlowNodeRegisterMsgByFlowNodePubkey,
  getFlowNodeState,
  getReturningFlowRateById,
  getReturningFlowRateByPubkey,
  getTransactionMountMsgByMountedTransactionRecordId,
  getTransactionRecordMsgByFlowNodePubkey,
  listFlowNodes,
  searchTransactionMountMsgs,
  searchTransactionRecordMsgs,
  type PageQuery,
  queryConsumeChains,
} from '../src';
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

const client = new ApiClient({
  baseUrl: 'https://example.test',
  fetch: async () =>
    new Response(JSON.stringify({ code: 200, message: 'ok', data: {} }), { status: 200 }),
});
const uuidA = '550e8400-e29b-41d4-a716-446655440000';
const uuidB = '550e8400-e29b-41d4-a716-446655440001';
const pubkeyA = `02${'11'.repeat(32)}`;
const pubkeyB = `03${'22'.repeat(32)}`;

function createCountingClient(): { client: ApiClient; fetchCount: () => number; requested: () => string[] } {
  let count = 0;
  const urls: string[] = [];
  return {
    client: new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        count += 1;
        urls.push(url);
        return new Response(JSON.stringify({ code: 200, message: 'ok', data: {} }), { status: 200 });
      },
    }),
    fetchCount: () => count,
    requested: () => urls,
  };
}

describe('consume-chain query validation', () => {
  it('rejects invalid consume-chain UUIDs', async () => {
    await expect(getConsumeChainById(client, 'not-a-uuid')).rejects.toThrow(
      /id must be a UUID string/,
    );
    await expect(getConsumeChainByMountedTransaction(client, 'not-a-uuid')).rejects.toThrow(
      /mountedTransactionId must be a UUID string/,
    );
    await expect(getConsumeChainByStart(client, 'not-a-uuid')).rejects.toThrow(
      /startId must be a UUID string/,
    );
  });

  it('rejects id and pubkey mode mixing in consume-chain root queries', async () => {
    await expect(queryConsumeChains(client, { startId: uuidA, endPubkey: pubkeyA })).rejects.toThrow(
      /consume-chains cannot mix id and pubkey query parameters/,
    );
    await expect(queryConsumeChains(client, { mountedTransactionId: uuidA, startId: uuidB })).rejects.toThrow(
      /mountedTransactionId cannot be combined with node filters/,
    );
  });

  it('rejects consume-chain root selectors passed through pagination without calling fetch', async () => {
    const counted = createCountingClient();

    await expect(
      queryConsumeChains(counted.client, { mountedTransactionId: uuidA }, { startId: uuidB } as PageQuery),
    ).rejects.toThrow(/mountedTransactionId cannot be combined with node filters/);

    expect(counted.fetchCount()).toBe(0);
  });

  it('rejects selector filters in consume-chain convenience query objects before calling fetch', async () => {
    const counted = createCountingClient();

    await expect(
      getConsumeChainByStart(counted.client, uuidA, { endId: uuidB } as never),
    ).rejects.toThrow(/consume-chains convenience query cannot include selector filters/);
    await expect(
      getConsumeChainByEnd(counted.client, uuidA, { nodeId: uuidB } as never),
    ).rejects.toThrow(/consume-chains convenience query cannot include selector filters/);
    await expect(
      getConsumeChainByNode(counted.client, uuidA, { startPubkey: pubkeyA } as never),
    ).rejects.toThrow(/consume-chains convenience query cannot include selector filters/);
    await expect(
      getConsumeChainByStart(counted.client, uuidA, { startId: 'not-a-uuid' } as never),
    ).rejects.toThrow(/consume-chains convenience query cannot include selector filters/);

    expect(counted.fetchCount()).toBe(0);
  });

  it('rejects missing or mixed consume-chain edge target selectors', async () => {
    await expect(getConsumeChainEdges(client, {} as never)).rejects.toThrow(
      /consume-chains\/edges requires targetId or targetPubkey/,
    );
    await expect(getConsumeChainEdges(client, { sourceId: uuidA } as never)).rejects.toThrow(
      /consume-chains\/edges requires targetId or targetPubkey/,
    );
    await expect(getConsumeChainEdges(client, { sourcePubkey: pubkeyA } as never)).rejects.toThrow(
      /consume-chains\/edges requires targetId or targetPubkey/,
    );
    await expect(getConsumeChainEdges(client, { targetId: uuidA, targetPubkey: pubkeyA } as never)).rejects.toThrow(
      /consume-chains\/edges cannot mix id and pubkey query parameters/,
    );
    await expect(getConsumeChainEdges(client, { targetId: uuidA, sourcePubkey: pubkeyA } as never)).rejects.toThrow(
      /consume-chains\/edges cannot mix id and pubkey query parameters/,
    );
  });

  it('rejects malformed consume-chain edge selectors and pagination', async () => {
    await expect(getConsumeChainEdges(client, { targetId: 'not-a-uuid' })).rejects.toThrow(
      /targetId must be a UUID string/,
    );
    await expect(getConsumeChainEdges(client, { targetPubkey: 'bad-pubkey' })).rejects.toThrow(
      /targetPubkey must be a 33-byte compressed public key hex string/,
    );
    await expect(getConsumeChainEdges(client, { targetId: uuidA, page: -1 })).rejects.toThrow(
      /consume-chains\/edges.page must be an integer >= 0/,
    );
    await expect(getConsumeChainEdges(client, { targetId: uuidA, startTime: 10, endTime: 9 })).rejects.toThrow(
      /consume-chains\/edges.endTime must be >= startTime/,
    );
  });
});

describe('returning-flow-rate query validation', () => {
  it('rejects invalid returning-flow-rate UUIDs and pubkeys', async () => {
    await expect(getReturningFlowRateById(client, { targetId: 'not-a-uuid' })).rejects.toThrow(
      /targetId must be a UUID string/,
    );
    await expect(getReturningFlowRateByPubkey(client, { targetPubkey: 'bad-pubkey' })).rejects.toThrow(
      /targetPubkey must be a 33-byte compressed public key hex string/,
    );
  });

  it('rejects returning-flow-rate source-only requests without calling fetch', async () => {
    const counted = createCountingClient();

    await expect(getReturningFlowRateById(counted.client, { sourceId: uuidA } as never)).rejects.toThrow(
      /targetId must be a UUID string/,
    );
    await expect(getReturningFlowRateByPubkey(counted.client, { sourcePubkey: pubkeyA } as never)).rejects.toThrow(
      /targetPubkey must be a 33-byte compressed public key hex string/,
    );

    expect(counted.fetchCount()).toBe(0);
  });

  it('rejects returning-flow-rate id and pubkey mixing from JavaScript callers', async () => {
    await expect(getReturningFlowRateById(client, { targetId: uuidA, targetPubkey: pubkeyA } as never)).rejects.toThrow(
      /returning-flow-rates cannot mix id and pubkey query parameters/,
    );
    await expect(getReturningFlowRateById(client, { targetPubkey: pubkeyA } as never)).rejects.toThrow(
      /returning-flow-rates cannot mix id and pubkey query parameters/,
    );
    await expect(
      getReturningFlowRateByPubkey(client, { targetPubkey: pubkeyA, sourceId: uuidA } as never),
    ).rejects.toThrow(/returning-flow-rates cannot mix id and pubkey query parameters/);
    await expect(getReturningFlowRateByPubkey(client, { targetId: uuidA } as never)).rejects.toThrow(
      /returning-flow-rates cannot mix id and pubkey query parameters/,
    );
  });

  it('rejects invalid returning-flow-rate time ranges', async () => {
    await expect(getReturningFlowRateById(client, { targetId: uuidA, startTime: 10, endTime: 9 })).rejects.toThrow(
      /returning-flow-rates.endTime must be >= startTime/,
    );
  });

  it('accepts valid returning-flow-rate id and pubkey requests', async () => {
    await expect(getReturningFlowRateById(client, { targetId: uuidA, sourceId: uuidB })).resolves.toMatchObject({
      code: 200,
    });
    await expect(
      getReturningFlowRateByPubkey(client, { targetPubkey: pubkeyA, sourcePubkey: pubkeyB }),
    ).resolves.toMatchObject({ code: 200 });
  });
});

describe('remaining API helper query validation', () => {
  it('rejects invalid compressed pubkeys', async () => {
    await expect(getFlowNodeState(client, 'bad-pubkey')).rejects.toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
    await expect(getFlowNodeRegisterMsgByFlowNodePubkey(client, 'bad-pubkey')).rejects.toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
    await expect(getFlowNodeLockedMsgByFlowNodePubkey(client, 'bad-pubkey')).rejects.toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
    await expect(getCentralPubkeyLockedMsgByCentralPubkey(client, 'bad-pubkey')).rejects.toThrow(
      /centralPubkey must be a 33-byte compressed public key hex string/,
    );
    await expect(getTransactionRecordMsgByFlowNodePubkey(client, 'bad-pubkey')).rejects.toThrow(
      /flowNodePubkey must be a 33-byte compressed public key hex string/,
    );
  });

  it('rejects invalid pagination in remaining list and search helpers', async () => {
    await expect(listFlowNodes(client, { size: 201 })).rejects.toThrow(
      /flow-nodes.size must be an integer between 1 and 200/,
    );
    await expect(searchTransactionRecordMsgs(client, {}, { size: 201 })).rejects.toThrow(
      /transaction-records.size must be an integer between 1 and 200/,
    );
    await expect(searchTransactionMountMsgs(client, {}, { page: -1 })).rejects.toThrow(
      /transaction-mounts.page must be an integer >= 0/,
    );
  });

  it('rejects invalid transaction-record and transaction-mount time ranges', async () => {
    await expect(searchTransactionRecordMsgs(client, { startTime: 10, endTime: 9 })).rejects.toThrow(
      /transaction-records.endTime must be >= startTime/,
    );
    await expect(searchTransactionMountMsgs(client, { startTime: -1 })).rejects.toThrow(
      /transaction-mounts.startTime must be an integer >= 0/,
    );
  });

  it('rejects invalid transaction-mount mounted transaction record IDs', async () => {
    await expect(getTransactionMountMsgByMountedTransactionRecordId(client, 'not-a-uuid')).rejects.toThrow(
      /mountedTransactionRecordId must be a UUID string/,
    );
  });

  it('rejects invalid block hashes', async () => {
    await expect(getBlockByHash(client, 'abc')).rejects.toThrow(
      /hash must be a 32-byte hex string/,
    );
  });

  it('rejects transaction-record filters hidden in pagination before calling fetch', async () => {
    const counted = createCountingClient();

    await expect(
      searchTransactionRecordMsgs(counted.client, { flowNodePubkey: pubkeyA }, {
        consumeNodePubkey: 'bad-pubkey',
      } as PageQuery),
    ).rejects.toThrow(/consumeNodePubkey must be a 33-byte compressed public key hex string/);

    expect(counted.fetchCount()).toBe(0);
  });

  it('rejects transaction-mount filters hidden in pagination before calling fetch', async () => {
    const counted = createCountingClient();

    await expect(
      searchTransactionMountMsgs(counted.client, { mountedTransactionRecordId: uuidA }, {
        mountedTransactionRecordId: 'not-a-uuid',
      } as PageQuery),
    ).rejects.toThrow(/mountedTransactionRecordId must be a UUID string/);

    expect(counted.fetchCount()).toBe(0);
  });
});
