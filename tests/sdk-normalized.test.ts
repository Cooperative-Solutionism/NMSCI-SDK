import { describe, expect, it } from 'vitest';
import { NmsciSdk } from '../src';
import type {
  ApiResponse,
  BlockInfoRaw,
  CentralPubkeyEmpowerMsgRaw,
  CentralPubkeyLockedMsgRaw,
  ConsumeChainEdgeRaw,
  FlowNodeLockedMsgRaw,
  SliceResponseDTO,
  StorageStatusDTORaw,
  SystemParamsDTORaw,
  SystemStatusDTORaw,
  TransactionMountMsgRaw,
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

function centralPubkeyEmpowerRaw(
  overrides: Partial<CentralPubkeyEmpowerMsgRaw> = {},
): CentralPubkeyEmpowerMsgRaw {
  return {
    id: 'empower',
    msgType: 2,
    flowNodePubkey: pubkey,
    centralPubkey: pubkey,
    flowNodeSignature: signature,
    confirmTimestamp: 500,
    centralSignature: signature,
    rawBytes: '00',
    txid: '33',
    ...overrides,
  };
}

function centralPubkeyLockedRaw(
  overrides: Partial<CentralPubkeyLockedMsgRaw> = {},
): CentralPubkeyLockedMsgRaw {
  return {
    id: 'central-lock',
    msgType: 5,
    centralPubkey: pubkey,
    centralSignaturePre: signature,
    confirmTimestamp: 600,
    centralSignature: signature,
    rawBytes: '00',
    txid: '44',
    ...overrides,
  };
}

function transactionMountRaw(overrides: Partial<TransactionMountMsgRaw> = {}): TransactionMountMsgRaw {
  return {
    id: 'mount',
    msgType: 6,
    mountedTransactionRecordId: uuidA,
    transactionDifficultyTarget: '1effffff',
    nonce: 1,
    consumeNodePubkey: pubkey,
    flowNodePubkey: pubkey,
    centralPubkey: pubkey,
    consumeNodeSignature: signature,
    flowNodeSignature: signature,
    confirmTimestamp: 700,
    centralSignature: signature,
    rawBytes: '00',
    txid: '55',
    ...overrides,
  };
}

function systemParamsRaw(overrides: Partial<SystemParamsDTORaw> = {}): SystemParamsDTORaw {
  return {
    blockVersion: 1,
    centralPubkey: pubkey,
    registerDifficultyTargetNbits: 0x1effffff,
    registerDifficultyTargetNbitsHex: '1effffff',
    transactionDifficultyTargetNbits: 0x1effffff,
    transactionDifficultyTargetNbitsHex: '1effffff',
    sourceCodeZipHash: 'aa',
    latestBlockHeight: 800,
    latestBlockHash: 'bb',
    ...overrides,
  };
}

function systemStatusRaw(overrides: Partial<SystemStatusDTORaw> = {}): SystemStatusDTORaw {
  return {
    latestBlockHeight: 801,
    latestBlockHash: 'cc',
    latestBlockTimestamp: 802,
    pendingMessageCount: 803,
    oldestPendingConfirmTimestamp: 804,
    blockIntervalMs: 600_000,
    currentCentralPubkeyLocked: false,
    ...overrides,
  };
}

function storageStatusRaw(overrides: Partial<StorageStatusDTORaw> = {}): StorageStatusDTORaw {
  return {
    datDirectory: '/data',
    datFileCount: 2,
    currentDatFileName: 'NMSCI_0000000001.dat',
    currentDatFileSizeBytes: 900,
    totalDatBytes: 901,
    datMaxSizePerFileBytes: 902,
    currentDatUtilizationPct: 0.5,
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

  it('normalizes central pubkey empower slices', async () => {
    const { sdk, requested } = createSdk({
      '/central-pubkey-empowerments': slice([centralPubkeyEmpowerRaw()]),
    });

    const response = await sdk.normalized.centralPubkeyEmpower.list({ flowNodePubkey: pubkey, page: 1, size: 2 });

    expect(response.data.content[0]?.confirmTimestamp).toBe(500n);
    const url = expectRequestedUrl(requested[0]!, '/central-pubkey-empowerments');
    expect(url.searchParams.get('flowNodePubkey')).toBe(pubkey);
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('size')).toBe('2');
  });

  it('normalizes central pubkey locked lookup results', async () => {
    const { sdk, requested } = createSdk({
      '/central-pubkey-locks/status': {
        locked: true,
        lockedMsg: centralPubkeyLockedRaw(),
      },
    });

    const response = await sdk.normalized.centralPubkeyLocked.getByCentralPubkey(pubkey);

    expect(response.data.locked).toBe(true);
    expect(response.data.lockedMsg?.confirmTimestamp).toBe(600n);
    const url = expectRequestedUrl(requested[0]!, '/central-pubkey-locks/status');
    expect(url.searchParams.get('centralPubkey')).toBe(pubkey);
  });

  it('normalizes transaction mount slices', async () => {
    const { sdk, requested } = createSdk({
      '/transaction-mounts': slice([transactionMountRaw()]),
    });

    const response = await sdk.normalized.transactionMount.search(
      { mountedTransactionRecordId: uuidA },
      { page: 2, size: 3 },
    );

    expect(response.data.content[0]?.confirmTimestamp).toBe(700n);
    const url = expectRequestedUrl(requested[0]!, '/transaction-mounts');
    expect(url.searchParams.get('mountedTransactionRecordId')).toBe(uuidA);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('size')).toBe('3');
  });

  it('normalizes system params, status, and storage bigint fields', async () => {
    const { sdk, requested } = createSdk({
      '/system/params': systemParamsRaw({ latestBlockHeight: null }),
      '/system/status': systemStatusRaw({ oldestPendingConfirmTimestamp: null }),
      '/system/storage': storageStatusRaw(),
    });

    const params = await sdk.normalized.system.getParams();
    const status = await sdk.normalized.system.getStatus();
    const storage = await sdk.normalized.system.getStorage();

    expect(params.data.latestBlockHeight).toBeNull();
    expect(status.data.latestBlockHeight).toBe(801n);
    expect(status.data.latestBlockTimestamp).toBe(802n);
    expect(status.data.pendingMessageCount).toBe(803n);
    expect(status.data.oldestPendingConfirmTimestamp).toBeNull();
    expect(storage.data.currentDatFileSizeBytes).toBe(900n);
    expect(storage.data.totalDatBytes).toBe(901n);
    expect(storage.data.datMaxSizePerFileBytes).toBe(902n);
    expect(requested).toEqual([
      'https://example.test/system/params',
      'https://example.test/system/status',
      'https://example.test/system/storage',
    ]);
  });

  it('rejects unsafe integer data during normalized SDK calls', async () => {
    const { sdk } = createSdk({
      '/blocks/latest': blockRaw({ height: Number.MAX_SAFE_INTEGER + 1 }),
    });

    await expect(sdk.normalized.block.getLast()).rejects.toThrow(/MAX_SAFE_INTEGER/);
  });
});
