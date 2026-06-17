# Normalized SDK API Design

**目标：** 在 `NmsciSdk` 上新增 `normalized.*` 高层 API，让使用者直接拿到已规范化的 DTO，减少手动调用 `normalizeApiResponse(...)`、`normalizeApiResponseSlice(...)` 和具体 `normalizeXxx(...)` 的重复代码。

**背景：** SDK 已经提供底层 raw API 和独立 normalize 工具。当前 raw API 仍应保留，因为它精确反映后端 JSON 响应；新增 normalized API 只作为体验层，不改变网络请求、参数校验、响应 envelope 或现有导出。

## Scope

本轮只覆盖“规范化后类型会变化”的端点，重点是会从 `number` 转为 `bigint` 的字段：

- `normalized.block`
  - `getLast`
  - `getByHeight`
  - `getByHash`
- `normalized.system`
  - `getParams`
  - `getStatus`
  - `getStorage`
- `normalized.transactionRecord`
  - `getById`
  - `search`
  - `getByConsumeNodePubkey`
  - `getByFlowNodePubkey`
  - `getByBothPubkeys`
- `normalized.transactionMount`
  - `getById`
  - `search`
  - `getByMountedTransactionRecordId`
  - `getByConsumeNodePubkey`
  - `getByFlowNodePubkey`
  - `getByBothPubkeys`
- `normalized.consumeChain`
  - `getById`
  - `query`
  - `getByMountedTransaction`
  - `getByStart`
  - `getByEnd`
  - `getByNode`
  - `getEdges`
- `normalized.centralPubkeyEmpower`
  - `getById`
  - `list`
  - `getByFlowNodePubkey`
- `normalized.centralPubkeyLocked`
  - `getById`
  - `list`
  - `getByCentralPubkey`
- `normalized.flowNodeLocked`
  - `getById`
  - `list`
  - `getByFlowNodePubkey`

Out of scope:

- Do not change the existing `sdk.*` raw API.
- Do not change `ApiClient`.
- Do not normalize `metadata`, `flowNode`, `flowNodeRegister`, or `returningFlowRate` in this round because their normalized DTOs are currently identical to raw DTOs.
- Do not add raw static file download helpers in this round.
- Do not change backend contract validation behavior.

## Architecture

`NmsciSdk` remains the public entry point. A new readonly `normalized` property will be added next to the existing grouped services.

Each `normalized.*` method will:

1. Call the corresponding existing raw SDK helper or API function.
2. Convert the returned `ApiResponse<T>` with the existing normalize utilities.
3. Return the same `ApiResponse` envelope with normalized `data`.

This keeps normalization as a presentation layer over the already-tested raw methods. The implementation should reuse:

- `normalizeApiResponse`
- `normalizeApiResponseSlice`
- `normalizeLockedMessageResponseDTO`
- domain normalizers such as `normalizeBlockInfo`, `normalizeTransactionRecordMsg`, `normalizeConsumeChainResponseDTO`, and `normalizeConsumeChainEdge`.

## Data Flow

Example for a single object:

```ts
sdk.normalized.block.getLast()
  -> getLastBlock(client)
  -> normalizeApiResponse(response, normalizeBlockInfo)
  -> ApiResponse<BlockInfo>
```

Example for a paginated slice:

```ts
sdk.normalized.transactionRecord.search(filters, pagination)
  -> searchTransactionRecordMsgs(client, filters, pagination)
  -> normalizeApiResponseSlice(response, normalizeTransactionRecordMsg)
  -> ApiResponse<SliceResponseDTO<TransactionRecordMsg>>
```

Example for locked status:

```ts
sdk.normalized.flowNodeLocked.getByFlowNodePubkey(pubkey)
  -> getFlowNodeLockedMsgByFlowNodePubkey(client, pubkey)
  -> normalizeApiResponse(response, locked => normalizeLockedMessageResponseDTO(locked, normalizeFlowNodeLockedMsg))
  -> ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsg>>
```

## Error Handling

Normalized methods should preserve existing behavior:

- Network, HTTP, backend business, and parameter validation errors should be thrown by the existing raw helpers.
- Normalization can still throw `MAX_SAFE_INTEGER` errors when a raw numeric field cannot be safely converted to `bigint`.
- No new custom error type is required.

This means normalized methods are not a compatibility shim for unsafe transport data; they intentionally fail rather than silently converting already-imprecise numbers.

## Type Surface

Normalized methods should return concrete normalized DTO response types where practical:

- `ApiResponse<BlockInfo>`
- `ApiResponse<SystemStatusDTO>`
- `ApiResponse<SliceResponseDTO<TransactionRecordMsg>>`
- `ApiResponse<ConsumeChainResponseDTO>`
- `ApiResponse<SliceResponseDTO<ConsumeChainEdge>>`
- `ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsg>>`

The raw API remains available for callers that need exact backend JSON types.

## Testing

Use TDD for the implementation.

Required tests:

- `sdk.normalized.block.getLast()` converts `height`, `maxMsgTimestamp`, and `timestamp` to `bigint`.
- `sdk.normalized.transactionRecord.search()` converts slice `content[].amount` and `content[].confirmTimestamp` to `bigint`.
- `sdk.normalized.consumeChain.getEdges()` converts slice `content[].amount` and `content[].relatedTransactionMountTimestamp` to `bigint`.
- A locked message status helper converts `lockedMsg.confirmTimestamp` when `lockedMsg` is non-null and preserves `null`.
- Unsafe integer normalization still rejects with `MAX_SAFE_INTEGER`.
- Existing raw `sdk.*` tests remain unchanged and continue to pass.
- Type-level tests should assert at least one normalized method returns a normalized DTO response, not a raw DTO response.

Final verification:

- `npm test`
- `npm run test:types`
- `npm run typecheck`
- `git diff --check`

## Acceptance Criteria

- `NmsciSdk` exposes `normalized.*` for the scoped groups.
- Normalized methods reuse existing raw methods and normalize utilities.
- Raw SDK methods and exports remain backward compatible.
- Normalized response data uses `bigint` in fields already modeled as `bigint` in existing normalized DTO types.
- Unsafe integer protection remains active.
- Tests cover single-object, slice, nested consume-chain, locked-message, and type-level behavior.
