import { describe, expect, it } from 'vitest';
import { NmsciSdk } from '../src';
import type {
  ApiResponse,
  BlockInfoRaw,
  ConsumeChainEdgeRaw,
  FlowNodeLockedMsgRaw,
  SliceResponseDTO,
  TransactionRecordMsgRaw,
} from '../src';

const pubkey = `02${'11'.repeat(32)}` as const;
const signature = 'aa'.repeat(64);
const uuidA = '00000000-0000-4000-8000-000000000001';

function slice<T>(content: T[]): SliceResponseDTO<T> {
  return {
    content,
    page: 0,
    size: content.length,
    numberOfElements: content.length,
    hasNext: false,
    hasPrevious: false,
  };
}

function createSdk(routes: Record<string, unknown>): { sdk: NmsciSdk; requested: string[] } {
  const requested: string[] = [];
  const sdk = new NmsciSdk({
    baseUrl: 'https://example.test',
    fetch: async (url) => {
      requested.push(url);
      const path = new URL(url).pathname;
      if (!Object.hasOwn(routes, path)) {
        throw new Error(`Missing test route for ${path}`);
      }
      const response: ApiResponse<unknown> = {
        code: 200,
        message: 'ok',
        data: routes[path],
      };
      return new Response(JSON.stringify(response), { status: 200 });
    },
  });
  return { sdk, requested };
}

function expectRequestedUrl(requestedUrl: string, expectedPath: string): URL {
  const url = new URL(requestedUrl);
  expect(url.pathname).toBe(expectedPath);
  return url;
}

function blockRaw(overrides: Partial<BlockInfoRaw> = {}): BlockInfoRaw {
  return {
    id: 'block',
    version: 1,
    height: 10,
    sourceCodeZipHash: 'aa',
    previousBlockHash: 'bb',
    merkleRoot: 'cc',
    maxMsgTimestamp: 20,
    registerDifficultyTarget: '1effffff',
    transactionDifficultyTarget: '1effffff',
    centralPubkey: pubkey,
    timestamp: 30,
    centralSignature: signature,
    datFilepath: '/tmp/a.dat',
    sourceCodeZipFilepath: '/tmp/a.zip',
    ...overrides,
  };
}

function transactionRecordRaw(overrides: Partial<TransactionRecordMsgRaw> = {}): TransactionRecordMsgRaw {
  return {
    id: 'record',
    msgType: 4,
    amount: 100,
    currencyType: 1,
    transactionDifficultyTarget: '1effffff',
    nonce: 1,
    consumeNodePubkey: pubkey,
    flowNodePubkey: pubkey,
    centralPubkey: pubkey,
    consumeNodeSignature: signature,
    flowNodeSignature: signature,
    confirmTimestamp: 1_700_000_000_000_000,
    centralSignature: signature,
    rawBytes: '00',
    txid: '11',
    ...overrides,
  };
}

function consumeChainEdgeRaw(overrides: Partial<ConsumeChainEdgeRaw> = {}): ConsumeChainEdgeRaw {
  return {
    id: 'edge',
    source: 'source',
    target: 'target',
    amount: 200,
    currencyType: 1,
    chain: 'chain',
    relatedTransactionRecord: 'record',
    relatedTransactionMount: 'mount',
    relatedTransactionMountTimestamp: 300,
    isLoop: false,
    ...overrides,
  };
}

function flowNodeLockedRaw(overrides: Partial<FlowNodeLockedMsgRaw> = {}): FlowNodeLockedMsgRaw {
  return {
    id: 'lock',
    msgType: 3,
    flowNodePubkey: pubkey,
    centralPubkey: pubkey,
    flowNodeSignature: signature,
    confirmTimestamp: 400,
    centralSignature: signature,
    rawBytes: '00',
    txid: '22',
    ...overrides,
  };
}

describe('NmsciSdk normalized API', () => {
  it('normalizes block bigint fields while preserving the response envelope', async () => {
    const { sdk, requested } = createSdk({
      '/blocks/latest': blockRaw(),
    });

    const response = await sdk.normalized.block.getLast();

    expect(response).toMatchObject({ code: 200, message: 'ok' });
    expect(response.data.height).toBe(10n);
    expect(response.data.maxMsgTimestamp).toBe(20n);
    expect(response.data.timestamp).toBe(30n);
    expect(requested).toEqual(['https://example.test/blocks/latest']);
  });

  it('normalizes transaction record slices', async () => {
    const { sdk, requested } = createSdk({
      '/transaction-records': slice([transactionRecordRaw()]),
    });

    const response = await sdk.normalized.transactionRecord.search(undefined, { page: 0, size: 10 });

    expect(response.data.content[0]?.amount).toBe(100n);
    expect(response.data.content[0]?.confirmTimestamp).toBe(1_700_000_000_000_000n);
    expect(response.data.page).toBe(0);
    const url = expectRequestedUrl(requested[0]!, '/transaction-records');
    expect(url.searchParams.get('page')).toBe('0');
    expect(url.searchParams.get('size')).toBe('10');
  });

  it('normalizes consume-chain edge slices', async () => {
    const { sdk, requested } = createSdk({
      '/consume-chains/edges': slice([consumeChainEdgeRaw()]),
    });

    const response = await sdk.normalized.consumeChain.getEdges({ targetId: uuidA });

    expect(response.data.content[0]?.amount).toBe(200n);
    expect(response.data.content[0]?.relatedTransactionMountTimestamp).toBe(300n);
    const url = expectRequestedUrl(requested[0]!, '/consume-chains/edges');
    expect(url.searchParams.get('targetId')).toBe(uuidA);
  });

  it('normalizes locked message lookup results and preserves null lockedMsg', async () => {
    const { sdk: lockedSdk, requested: lockedRequested } = createSdk({
      '/flow-node-locks/status': {
        locked: true,
        lockedMsg: flowNodeLockedRaw(),
      },
    });
    const locked = await lockedSdk.normalized.flowNodeLocked.getByFlowNodePubkey(pubkey);

    expect(locked.data.locked).toBe(true);
    expect(locked.data.lockedMsg?.confirmTimestamp).toBe(400n);
    const lockedUrl = expectRequestedUrl(lockedRequested[0]!, '/flow-node-locks/status');
    expect(lockedUrl.searchParams.get('flowNodePubkey')).toBe(pubkey);

    const { sdk: unlockedSdk, requested: unlockedRequested } = createSdk({
      '/flow-node-locks/status': {
        locked: false,
        lockedMsg: null,
      },
    });
    const unlocked = await unlockedSdk.normalized.flowNodeLocked.getByFlowNodePubkey(pubkey);

    expect(unlocked.data).toEqual({ locked: false, lockedMsg: null });
    const unlockedUrl = expectRequestedUrl(unlockedRequested[0]!, '/flow-node-locks/status');
    expect(unlockedUrl.searchParams.get('flowNodePubkey')).toBe(pubkey);
  });

  it('rejects unsafe integer data during normalized SDK calls', async () => {
    const { sdk } = createSdk({
      '/blocks/latest': blockRaw({ height: Number.MAX_SAFE_INTEGER + 1 }),
    });

    await expect(sdk.normalized.block.getLast()).rejects.toThrow(/MAX_SAFE_INTEGER/);
  });
});
