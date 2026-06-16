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
- `BlockInfoRaw.rawBytes` was removed because backend `BlockInfo` does not output `rawBytes`.

### Added

- Message collection-root helpers for documented slice-backed endpoints.
- Grouped `.list(...)` helpers for message collections.
- Runtime validation for clearly invalid SDK query inputs.
- Packed-package smoke testing for public ESM and CommonJS entry points.

### Security and maintenance

- Dev test tooling upgraded to remove high/critical audit findings.
- `elliptic` remains the production secp256k1 implementation for compatibility; npm may report low severity advisory; replacing it requires separate compatibility project with signature, verification, Low-S, and protocol byte regression testing.
