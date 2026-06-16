# Normalized SDK API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `sdk.normalized.*` query helpers that preserve the existing `ApiResponse` envelope while returning already-normalized DTO data.

**Architecture:** Keep `NmsciSdk` as the public entry point and add a new readonly `normalized` group beside the existing raw groups. Each normalized method delegates to the existing raw SDK helper, then applies the existing normalize utilities from `src/api/normalize.ts`.

**Tech Stack:** TypeScript, Vitest, existing `ApiClient`, existing raw API modules, existing normalize utilities.

---

## File Structure

- Modify: `src/sdk.ts`
  - Add normalize imports.
  - Add `readonly normalized = { ... }` inside `NmsciSdk`.
  - Do not change existing raw groups.
- Create: `tests/sdk-normalized.test.ts`
  - Exercise `sdk.normalized.*` through a real `NmsciSdk` instance with injected `fetch`.
  - Cover single object, slice, locked message, null locked message, and unsafe integer rejection.
- Modify: `tests/public-api.type-test.ts`
  - Assert normalized return types use normalized DTOs.
  - Assert the existing raw API still returns raw DTOs for at least one method.

## Task 1: Add Behavioral RED Tests

**Files:**
- Create: `tests/sdk-normalized.test.ts`

- [ ] **Step 1: Write the failing behavioral tests**

Create `tests/sdk-normalized.test.ts` with this content:

```ts
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
    const { sdk } = createSdk({
      '/transaction-records': slice([transactionRecordRaw()]),
    });

    const response = await sdk.normalized.transactionRecord.search(undefined, { page: 0, size: 10 });

    expect(response.data.content[0]?.amount).toBe(100n);
    expect(response.data.content[0]?.confirmTimestamp).toBe(1_700_000_000_000_000n);
    expect(response.data.page).toBe(0);
  });

  it('normalizes consume-chain edge slices', async () => {
    const { sdk } = createSdk({
      '/consume-chains/edges': slice([consumeChainEdgeRaw()]),
    });

    const response = await sdk.normalized.consumeChain.getEdges({ targetId: uuidA });

    expect(response.data.content[0]?.amount).toBe(200n);
    expect(response.data.content[0]?.relatedTransactionMountTimestamp).toBe(300n);
  });

  it('normalizes locked message lookup results and preserves null lockedMsg', async () => {
    const { sdk: lockedSdk } = createSdk({
      '/flow-node-locks/status': {
        locked: true,
        lockedMsg: flowNodeLockedRaw(),
      },
    });
    const locked = await lockedSdk.normalized.flowNodeLocked.getByFlowNodePubkey(pubkey);

    expect(locked.data.locked).toBe(true);
    expect(locked.data.lockedMsg?.confirmTimestamp).toBe(400n);

    const { sdk: unlockedSdk } = createSdk({
      '/flow-node-locks/status': {
        locked: false,
        lockedMsg: null,
      },
    });
    const unlocked = await unlockedSdk.normalized.flowNodeLocked.getByFlowNodePubkey(pubkey);

    expect(unlocked.data).toEqual({ locked: false, lockedMsg: null });
  });

  it('rejects unsafe integer data during normalized SDK calls', async () => {
    const { sdk } = createSdk({
      '/blocks/latest': blockRaw({ height: Number.MAX_SAFE_INTEGER + 1 }),
    });

    await expect(sdk.normalized.block.getLast()).rejects.toThrow(/MAX_SAFE_INTEGER/);
  });
});
```

- [ ] **Step 2: Run the behavioral tests to verify RED**

Run:

```bash
npm test -- tests/sdk-normalized.test.ts
```

Expected: FAIL because `Property 'normalized' does not exist on type 'NmsciSdk'`.

## Task 2: Add Type RED Tests

**Files:**
- Modify: `tests/public-api.type-test.ts`

- [ ] **Step 1: Add normalized return type assertions**

Extend the existing import list in `tests/public-api.type-test.ts` with these types:

```ts
  type BlockInfo,
  type BlockInfoRaw,
  type ConsumeChainEdge,
  type FlowNodeLockedMsg,
  type LockedMessageResponseDTO,
  type TransactionRecordMsg,
```

Add this block after the existing `void sdk.consumeChain.getEdges(...)` calls:

```ts
expectTypeOf<ReturnType<typeof sdk.block.getLast>>().toEqualTypeOf<Promise<ApiResponse<BlockInfoRaw>>>();
expectTypeOf<ReturnType<typeof sdk.normalized.block.getLast>>().toEqualTypeOf<Promise<ApiResponse<BlockInfo>>>();
expectTypeOf<ReturnType<typeof sdk.normalized.transactionRecord.search>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.consumeChain.getEdges>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<ConsumeChainEdge>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.flowNodeLocked.getByFlowNodePubkey>>().toEqualTypeOf<
  Promise<ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsg>>>
>();
```

- [ ] **Step 2: Run type tests to verify RED**

Run:

```bash
npm run test:types
```

Expected: FAIL because `normalized` is not available on `NmsciSdk`.

## Task 3: Implement Normalized SDK Methods

**Files:**
- Modify: `src/sdk.ts`

- [ ] **Step 1: Add normalize imports**

Add this import block near the other API imports in `src/sdk.ts`:

```ts
import {
  normalizeApiResponse,
  normalizeApiResponseSlice,
  normalizeBlockInfo,
  normalizeCentralPubkeyEmpowerMsg,
  normalizeCentralPubkeyLockedMsg,
  normalizeConsumeChainEdge,
  normalizeConsumeChainResponseDTO,
  normalizeFlowNodeLockedMsg,
  normalizeLockedMessageResponseDTO,
  normalizeStorageStatus,
  normalizeSystemParams,
  normalizeSystemStatus,
  normalizeTransactionMountMsg,
  normalizeTransactionRecordMsg,
} from './api/normalize';
```

- [ ] **Step 2: Add the `normalized` property inside `NmsciSdk`**

Add this readonly property before the `constructor` in `src/sdk.ts`:

```ts
  readonly normalized = {
    centralPubkeyEmpower: {
      getById: async (id: string) =>
        normalizeApiResponse(
          await getCentralPubkeyEmpowerMsgById(this.client, id),
          normalizeCentralPubkeyEmpowerMsg,
        ),
      list: async (query?: Parameters<typeof listCentralPubkeyEmpowerMsgs>[1]) =>
        normalizeApiResponseSlice(
          await listCentralPubkeyEmpowerMsgs(this.client, query),
          normalizeCentralPubkeyEmpowerMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getCentralPubkeyEmpowerMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getCentralPubkeyEmpowerMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeCentralPubkeyEmpowerMsg,
        ),
    },

    centralPubkeyLocked: {
      getById: async (id: string) =>
        normalizeApiResponse(await getCentralPubkeyLockedMsgById(this.client, id), normalizeCentralPubkeyLockedMsg),
      list: async (pagination?: Parameters<typeof listCentralPubkeyLockedMsgs>[1]) =>
        normalizeApiResponseSlice(
          await listCentralPubkeyLockedMsgs(this.client, pagination),
          normalizeCentralPubkeyLockedMsg,
        ),
      getByCentralPubkey: async (centralPubkey: string) =>
        normalizeApiResponse(
          await getCentralPubkeyLockedMsgByCentralPubkey(this.client, centralPubkey),
          locked => normalizeLockedMessageResponseDTO(locked, normalizeCentralPubkeyLockedMsg),
        ),
    },

    flowNodeLocked: {
      getById: async (id: string) =>
        normalizeApiResponse(await getFlowNodeLockedMsgById(this.client, id), normalizeFlowNodeLockedMsg),
      list: async (pagination?: Parameters<typeof listFlowNodeLockedMsgs>[1]) =>
        normalizeApiResponseSlice(await listFlowNodeLockedMsgs(this.client, pagination), normalizeFlowNodeLockedMsg),
      getByFlowNodePubkey: async (flowNodePubkey: string) =>
        normalizeApiResponse(
          await getFlowNodeLockedMsgByFlowNodePubkey(this.client, flowNodePubkey),
          locked => normalizeLockedMessageResponseDTO(locked, normalizeFlowNodeLockedMsg),
        ),
    },

    transactionRecord: {
      getById: async (id: string) =>
        normalizeApiResponse(await getTransactionRecordMsgById(this.client, id), normalizeTransactionRecordMsg),
      search: async (
        filters?: Parameters<typeof searchTransactionRecordMsgs>[1],
        pagination?: Parameters<typeof searchTransactionRecordMsgs>[2],
      ) =>
        normalizeApiResponseSlice(
          await searchTransactionRecordMsgs(this.client, filters, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByConsumeNodePubkey: async (
        consumeNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByConsumeNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByBothPubkeys: async (
        consumeNodePubkey: string,
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByBothPubkeys>[3],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
    },

    transactionMount: {
      getById: async (id: string) =>
        normalizeApiResponse(await getTransactionMountMsgById(this.client, id), normalizeTransactionMountMsg),
      search: async (
        filters?: Parameters<typeof searchTransactionMountMsgs>[1],
        pagination?: Parameters<typeof searchTransactionMountMsgs>[2],
      ) =>
        normalizeApiResponseSlice(
          await searchTransactionMountMsgs(this.client, filters, pagination),
          normalizeTransactionMountMsg,
        ),
      getByMountedTransactionRecordId: async (
        id: string,
        pagination?: Parameters<typeof getTransactionMountMsgByMountedTransactionRecordId>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByMountedTransactionRecordId(this.client, id, pagination),
          normalizeTransactionMountMsg,
        ),
      getByConsumeNodePubkey: async (
        consumeNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByConsumeNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
      getByBothPubkeys: async (
        consumeNodePubkey: string,
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByBothPubkeys>[3],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
    },

    block: {
      getLast: async () => normalizeApiResponse(await getLastBlock(this.client), normalizeBlockInfo),
      getByHeight: async (height: number) =>
        normalizeApiResponse(await getBlockByHeight(this.client, height), normalizeBlockInfo),
      getByHash: async (hash: string) =>
        normalizeApiResponse(await getBlockByHash(this.client, hash), normalizeBlockInfo),
    },

    consumeChain: {
      getById: async (id: string) =>
        normalizeApiResponse(await getConsumeChainById(this.client, id), normalizeConsumeChainResponseDTO),
      query: async (
        filters?: Parameters<typeof queryConsumeChains>[1],
        pagination?: Parameters<typeof queryConsumeChains>[2],
      ) =>
        normalizeApiResponseSlice(
          await queryConsumeChains(this.client, filters, pagination),
          normalizeConsumeChainResponseDTO,
        ),
      getByMountedTransaction: async (
        mountedTransactionId: string,
        pagination?: Parameters<typeof getConsumeChainByMountedTransaction>[2],
      ) =>
        normalizeApiResponseSlice(
          await getConsumeChainByMountedTransaction(this.client, mountedTransactionId, pagination),
          normalizeConsumeChainResponseDTO,
        ),
      getByStart: async (startId: string, query?: Parameters<typeof getConsumeChainByStart>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByStart(this.client, startId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getByEnd: async (endId: string, query?: Parameters<typeof getConsumeChainByEnd>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByEnd(this.client, endId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getByNode: async (nodeId: string, query?: Parameters<typeof getConsumeChainByNode>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByNode(this.client, nodeId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getEdges: async (params: Parameters<typeof getConsumeChainEdges>[1]) =>
        normalizeApiResponseSlice(await getConsumeChainEdges(this.client, params), normalizeConsumeChainEdge),
    },

    system: {
      getParams: async () => normalizeApiResponse(await getSystemParams(this.client), normalizeSystemParams),
      getStatus: async () => normalizeApiResponse(await getSystemStatus(this.client), normalizeSystemStatus),
      getStorage: async () => normalizeApiResponse(await getSystemStorage(this.client), normalizeStorageStatus),
    },
  };
```

- [ ] **Step 3: Run focused tests to verify GREEN**

Run:

```bash
npm test -- tests/sdk-normalized.test.ts
npm run test:types
```

Expected: both commands PASS.

## Task 4: Full Verification and Commit

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
npm run typecheck
npm test
npm run test:types
git diff --check
```

Expected: all commands PASS with no warnings that require code changes.

- [ ] **Step 2: Review the final diff**

Run:

```bash
git diff -- src/sdk.ts tests/sdk-normalized.test.ts tests/public-api.type-test.ts
git status --short
```

Expected:

- `src/sdk.ts` only adds normalize imports and `readonly normalized`.
- `tests/sdk-normalized.test.ts` is new.
- `tests/public-api.type-test.ts` only adds normalized type assertions.
- No unrelated files changed.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/sdk.ts tests/sdk-normalized.test.ts tests/public-api.type-test.ts
git commit -m "功能: 添加 normalized SDK API"
git log -1 --format="%h %an %cn %s"
```

Expected latest commit author and committer are `GPT5.5XH`, and the subject is `功能: 添加 normalized SDK API`.
