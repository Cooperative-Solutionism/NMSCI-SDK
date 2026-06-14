import { describe, expect, it } from 'vitest';
import {
  ApiClient,
  NmsciSdk,
  getConsumeChainByStart,
  getFlowNodeState,
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

    await getTransactionRecordMsgByFlowNodePubkey(client, 'flow', { page: 2, size: 10 });
    await getTransactionMountMsgByBothPubkeys(client, 'consume', 'flow', { page: 1, size: 25 });
    await getConsumeChainByStart(client, 'chain-start', { isLoop: false, page: 3, size: 5 });

    expect(requested).toEqual([
      'https://example.test/transaction-records?flowNodePubkey=flow&page=2&size=10',
      'https://example.test/transaction-mounts?consumeNodePubkey=consume&flowNodePubkey=flow&page=1&size=25',
      'https://example.test/consume-chains?startId=chain-start&isLoop=false&page=3&size=5',
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

    await getFlowNodeState(client, '02aa');
    await sdk.flowNode.getState('02bb');

    expect(requested).toEqual([
      'https://example.test/flow-nodes/02aa',
      'https://example.test/flow-nodes/02bb',
    ]);
  });
});

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ code: 200, message: 'ok', data }), { status: 200 });
}
