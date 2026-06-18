# Changelog

## 3.0.0

### Breaking changes

- `getConsumeChainEdges()` now resolves to `ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>` instead of `ApiResponse<ConsumeChainEdgeRaw[]>`.

  Before:

  ```ts
  response.data.map(edge => edge.id)
  ```

  After:

  ```ts
  response.data.content.map(edge => edge.id)
  ```

- `sendCentralPubkeyLockedMsg()` now resolves to `ApiResponse<CentralPubkeyLockedMsgRaw>` instead of `void`.
- `BlockInfoRaw.rawBytes` and message DTO `rawBytes` fields were removed because backend HTTP responses do not output the internal raw-byte cache.
- `queryConsumeChains()` now requires exactly one documented selector, or `mountedTransactionId`; empty root queries and multiple node selectors are rejected before the request is sent.

### Added

- `verifyChain()` and `NmsciSdk.verify.chain()` for the documented `GET /verify/chain` chain-integrity self-check endpoint.
- Actuator observability helpers for `GET /actuator/health`, `/actuator/info`, `/actuator/metrics`, `/actuator/metrics/{name}`, and `/actuator/prometheus`.
- Message collection-root helpers for documented slice-backed endpoints.
- Grouped `.list(...)` helpers for message collections.
- Runtime validation for clearly invalid SDK query inputs.
- Packed-package smoke testing for public ESM and CommonJS entry points, including secp256k1 derive/sign/verify calls.

### Security and maintenance

- Dev test tooling upgraded to remove high/critical audit findings.
- Production secp256k1 signing migrated from `elliptic` to `@noble/secp256k1`, removing the remaining `elliptic` audit finding while preserving compressed public keys, compact Low-S signatures, and double-SHA-256 sign/verify behavior.
