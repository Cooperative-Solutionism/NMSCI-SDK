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
import * as publicApi from '../src';
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

  it('exposes chain verification in function and grouped SDK APIs', async () => {
    const requested: string[] = [];
    const fetch = async (url: string) => {
      requested.push(url);
      return jsonResponse({
        valid: true,
        datDirectory: '/data/dat',
        blockCount: 2,
        messageCount: 3,
        passedChecks: 10,
        failedChecks: 0,
        skippedChecks: 1,
        statefulReplayIncluded: false,
        failureCount: 0,
        failures: [],
        configuredCentralPubkeyHex: flowPubkey,
        runningSourceCodeZipHash: 'aa'.repeat(32),
      });
    };
    const client = new ApiClient({ baseUrl: 'https://example.test', fetch });
    const sdk = new NmsciSdk(client);
    const verifyChain = (publicApi as Record<string, unknown>).verifyChain as
      | ((client: ApiClient, query?: { stateful?: boolean }) => Promise<ApiResponse<unknown>>)
      | undefined;

    expect(typeof verifyChain).toBe('function');
    const response = await verifyChain!(client, { stateful: false });
    await sdk.verify.chain({ stateful: true });

    expect(response.data).toMatchObject({ valid: true, blockCount: 2 });
    expect(requested).toEqual([
      'https://example.test/verify/chain?stateful=false',
      'https://example.test/verify/chain?stateful=true',
    ]);
  });

  it('exposes Actuator endpoints as non-ResponseResult JSON and text helpers', async () => {
    const requested: string[] = [];
    const fetch = async (url: string) => {
      requested.push(url);
      const pathname = new URL(url).pathname;
      if (pathname === '/actuator/prometheus') {
        return new Response('nmsci_blocks_pending 3\n', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; version=0.0.4' },
        });
      }
      if (pathname.startsWith('/actuator/metrics/')) {
        const name = decodeURIComponent(pathname.slice('/actuator/metrics/'.length));
        return new Response(JSON.stringify({
          name,
          description: `${name} metric`,
          baseUnit: 'seconds',
          measurements: [{ statistic: 'COUNT', value: 2 }],
          availableTags: [{ tag: 'application', values: ['nmsci'] }],
        }), { status: 200 });
      }
      if (pathname === '/actuator/metrics') {
        return new Response(JSON.stringify({ names: ['http.server.requests', 'jvm.memory.used'] }), { status: 200 });
      }
      if (pathname === '/actuator/info') {
        return new Response(JSON.stringify({ app: { name: 'nmsci' } }), { status: 200 });
      }
      if (pathname === '/actuator/health') {
        return new Response(JSON.stringify({ status: 'UP' }), { status: 200 });
      }
      return new Response('missing', { status: 404 });
    };
    const client = new ApiClient({ baseUrl: 'https://example.test', fetch });
    const sdk = new NmsciSdk(client) as NmsciSdk & {
      actuator: {
        health: () => Promise<unknown>;
        info: () => Promise<unknown>;
        metrics: () => Promise<unknown>;
        metric: (name: string) => Promise<unknown>;
        prometheus: () => Promise<string>;
      };
    };
    const getActuatorHealth = (publicApi as Record<string, unknown>).getActuatorHealth as
      | ((client: ApiClient) => Promise<Record<string, unknown>>)
      | undefined;
    const getActuatorInfo = (publicApi as Record<string, unknown>).getActuatorInfo as
      | ((client: ApiClient) => Promise<Record<string, unknown>>)
      | undefined;
    const getActuatorMetrics = (publicApi as Record<string, unknown>).getActuatorMetrics as
      | ((client: ApiClient) => Promise<{ names: string[] }>)
      | undefined;
    const getActuatorMetric = (publicApi as Record<string, unknown>).getActuatorMetric as
      | ((client: ApiClient, name: string) => Promise<{ name: string }>)
      | undefined;
    const getActuatorPrometheus = (publicApi as Record<string, unknown>).getActuatorPrometheus as
      | ((client: ApiClient) => Promise<string>)
      | undefined;

    expect(typeof getActuatorHealth).toBe('function');
    expect(typeof getActuatorInfo).toBe('function');
    expect(typeof getActuatorMetrics).toBe('function');
    expect(typeof getActuatorMetric).toBe('function');
    expect(typeof getActuatorPrometheus).toBe('function');

    const health = await getActuatorHealth!(client);
    const info = await getActuatorInfo!(client);
    const metrics = await getActuatorMetrics!(client);
    const metric = await getActuatorMetric!(client, 'http.server.requests');
    const prometheus = await getActuatorPrometheus!(client);
    await sdk.actuator.health();
    await sdk.actuator.metric('jvm.memory.used');

    expect(health.status).toBe('UP');
    expect(info.app).toEqual({ name: 'nmsci' });
    expect(metrics.names).toContain('http.server.requests');
    expect(metric.name).toBe('http.server.requests');
    expect(prometheus).toContain('nmsci_blocks_pending');
    expect(requested).toEqual([
      'https://example.test/actuator/health',
      'https://example.test/actuator/info',
      'https://example.test/actuator/metrics',
      'https://example.test/actuator/metrics/http.server.requests',
      'https://example.test/actuator/prometheus',
      'https://example.test/actuator/health',
      'https://example.test/actuator/metrics/jvm.memory.used',
    ]);
  });
});

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify({ code: 200, message: 'ok', data }), { status: 200 });
}
