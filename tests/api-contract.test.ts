import { describe, expect, it } from 'vitest';
import {
  ApiClient,
  NmsciSdk,
  getConsumeChainByStart,
  getConsumeChainEdges,
  listCentralPubkeyEmpowerMsgs,
  listCentralPubkeyLockedMsgs,
  listFlowNodeLockedMsgs,
  listFlowNodeRegisterMsgs,
  getFlowNodeState,
  sendCentralPubkeyLockedMsg,
  getTransactionMountMsgByBothPubkeys,
  getTransactionRecordMsgByFlowNodePubkey,
  normalizeApiResponseSlice,
  normalizeLockedMessageResponseDTO,
  normalizeReturningFlowRateResponseDTO,
} from '../src';
import type {
  ApiResponse,
  CentralPubkeyLockedMsgRaw,
  LockedMessageResponseDTO,
  SliceResponseDTO,
} from '../src';

const uuidA = '550e8400-e29b-41d4-a716-446655440000';
const uuidB = '550e8400-e29b-41d4-a716-446655440001';
const flowPubkey = `02${'11'.repeat(32)}`;
const consumePubkey = `03${'22'.repeat(32)}`;

describe('current backend API contracts', () => {
  it('passes page and size to slice-backed query endpoints', async () => {
    const requested: string[] = [];
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return jsonResponse({
          content: [],
          page: 0,
          size: 0,
          numberOfElements: 0,
          hasNext: false,
          hasPrevious: false,
        });
      },
    });

    await getTransactionRecordMsgByFlowNodePubkey(client, flowPubkey, { page: 2, size: 10 });
    await getTransactionMountMsgByBothPubkeys(client, consumePubkey, flowPubkey, { page: 1, size: 25 });
    await getConsumeChainByStart(client, uuidA, { isLoop: false, page: 3, size: 5 });

    expect(requested).toEqual([
      `https://example.test/transaction-records?flowNodePubkey=${flowPubkey}&page=2&size=10`,
      `https://example.test/transaction-mounts?consumeNodePubkey=${consumePubkey}&flowNodePubkey=${flowPubkey}&page=1&size=25`,
      `https://example.test/consume-chains?startId=${uuidA}&isLoop=false&page=3&size=5`,
    ]);
  });

  it('exposes message collection roots with documented optional filters', async () => {
    const requested: string[] = [];
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return jsonResponse({
          content: [],
          page: 0,
          size: 0,
          numberOfElements: 0,
          hasNext: false,
          hasPrevious: false,
        });
      },
    });

    await listFlowNodeRegisterMsgs(client, { flowNodePubkey: flowPubkey, page: 2, size: 10 });
    await listCentralPubkeyEmpowerMsgs(client, { flowNodePubkey: consumePubkey, page: 3, size: 20 });
    await listFlowNodeLockedMsgs(client, { page: 4, size: 30 });
    await listCentralPubkeyLockedMsgs(client, { page: 5, size: 40 });

    expect(requested).toEqual([
      `https://example.test/flow-node-registrations?flowNodePubkey=${flowPubkey}&page=2&size=10`,
      `https://example.test/central-pubkey-empowerments?flowNodePubkey=${consumePubkey}&page=3&size=20`,
      'https://example.test/flow-node-locks?page=4&size=30',
      'https://example.test/central-pubkey-locks?page=5&size=40',
    ]);
  });

  it('returns the persisted entity from central-pubkey-lock POST', async () => {
    const requested: string[] = [];
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return jsonResponse({
          id: 'lock-id',
          msgType: 2,
          centralPubkey: 'central',
          centralSignaturePre: 'pre',
          confirmTimestamp: 123,
          centralSignature: 'signature',
          rawBytes: 'raw',
          txid: 'txid',
        });
      },
    });

    const response = await sendCentralPubkeyLockedMsg(client, [1, 2, 3]);

    expect(requested).toEqual(['https://example.test/central-pubkey-locks']);
    expect(response.data.id).toBe('lock-id');
  });

  it('treats consume-chain edge lookup as a paginated slice', async () => {
    const requested: string[] = [];
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return jsonResponse({
          content: [{
            id: 'edge-id',
            source: 'source-id',
            target: 'target-id',
            amount: 100,
            currencyType: 1,
            chain: 'chain-id',
            relatedTransactionRecord: 'record-id',
            relatedTransactionMount: 'mount-id',
            relatedTransactionMountTimestamp: 456,
            isLoop: true,
          }],
          page: 1,
          size: 25,
          numberOfElements: 1,
          hasNext: false,
          hasPrevious: true,
        });
      },
    });

    const response = await getConsumeChainEdges(client, {
      targetId: uuidA,
      sourceId: uuidB,
      currencyType: 1,
      page: 1,
      size: 25,
    });

    expect(requested).toEqual([
      `https://example.test/consume-chains/edges?targetId=${uuidA}&sourceId=${uuidB}&currencyType=1&page=1&size=25`,
    ]);
    expect(response.data.content[0]?.id).toBe('edge-id');
    expect(response.data.hasPrevious).toBe(true);
  });

  it('passes consume-chain edge pubkey mode and time filters', async () => {
    const requested: string[] = [];
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return jsonResponse({
          content: [],
          page: 0,
          size: 50,
          numberOfElements: 0,
          hasNext: false,
          hasPrevious: false,
        });
      },
    });

    await getConsumeChainEdges(client, {
      targetPubkey: flowPubkey,
      sourcePubkey: consumePubkey,
      currencyType: 1,
      startTime: 1718352000000000,
      endTime: 1718352999999999,
      page: 0,
      size: 50,
    });

    expect(requested).toEqual([
      `https://example.test/consume-chains/edges?targetPubkey=${flowPubkey}&sourcePubkey=${consumePubkey}&currencyType=1&startTime=1718352000000000&endTime=1718352999999999&page=0&size=50`,
    ]);
  });

  it('normalizes slice response content while preserving pagination metadata', () => {
    const response: ApiResponse<SliceResponseDTO<number>> = {
      code: 200,
      message: 'ok',
      data: {
        content: [1, 2],
        page: 4,
        size: 2,
        numberOfElements: 2,
        hasNext: true,
        hasPrevious: true,
      },
    };

    const normalized = normalizeApiResponseSlice(response, value => BigInt(value));

    expect(normalized.data).toEqual({
      content: [1n, 2n],
      page: 4,
      size: 2,
      numberOfElements: 2,
      hasNext: true,
      hasPrevious: true,
    });
  });

  it('normalizes locked-message lookup responses with nullable lockedMsg', () => {
    const unlocked: LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw> = {
      locked: false,
      lockedMsg: null,
    };

    expect(normalizeLockedMessageResponseDTO(unlocked, value => value.id)).toEqual({
      locked: false,
      lockedMsg: null,
    });
  });

  it('keeps returning-flow-rate amount metrics as numbers', () => {
    const normalized = normalizeReturningFlowRateResponseDTO({
      returningFlowRate: 0.25,
      loopedAmount: 1.5,
      unloopedAmount: 2.25,
      targetTotalLoopedAmount: 3.75,
      targetTotalUnloopedAmount: 4.125,
      currencyType: 1,
    });

    expect(normalized.loopedAmount).toBe(1.5);
    expect(normalized.targetTotalUnloopedAmount).toBe(4.125);
  });

  it('exposes flow-node state lookup in function and grouped SDK APIs', async () => {
    const requested: string[] = [];
    const fetch = async (url: string) => {
      requested.push(url);
      return jsonResponse({
        registered: true,
        authorized: true,
        locked: false,
        currentCentralPubkeyAuthorized: true,
      });
    };
    const client = new ApiClient({ baseUrl: 'https://example.test', fetch });
    const sdk = new NmsciSdk(client);

    await getFlowNodeState(client, flowPubkey);
    await sdk.flowNode.getState(consumePubkey);

    expect(requested).toEqual([
      `https://example.test/flow-nodes/${flowPubkey}`,
      `https://example.test/flow-nodes/${consumePubkey}`,
    ]);
  });
});

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ code: 200, message: 'ok', data }), { status: 200 });
}
