# High Priority Quality Upgrades Design

**Goal:** Prepare `@nmsci/sdk` 3.0.0 for a safer release by addressing high-priority dependency security, SDK query validation, and release documentation/package smoke testing.

**Context:** The SDK has already been updated to match the new NMSCI API contract and is currently at version `3.0.0`. The remaining high-priority work is release hardening, not new business functionality.

## Scope

This work covers three phases:

1. Dependency security and toolchain health.
2. Runtime validation for clearly invalid SDK query parameters.
3. Release documentation and package smoke testing.

Out of scope:

- Replacing `elliptic` with another crypto library.
- Generating an SDK from OpenAPI.
- Full CI platform configuration.
- Refactoring message serialization or protocol byte layouts.
- Adding new backend API capabilities.

## Phase A: Dependency Security

Upgrade the test/build dependency chain enough to remove high and critical audit findings where practical.

Primary targets:

- Upgrade `vitest` from the current 2.x line to the current stable 4.x line.
- Re-run the test suite and adapt tests only if Vitest API behavior changed.
- Investigate remaining `vite` and `esbuild` audit findings after the Vitest upgrade.
- Avoid accepting `npm audit fix` suggestions that downgrade `tsup`.
- Keep `typescript@6` out of this phase unless required by upgraded tooling.

The production dependency `elliptic` currently has a low severity advisory with no direct fix. This phase will document that risk and leave crypto replacement for a separate, compatibility-focused effort.

## Phase B: SDK Runtime Query Validation

Add SDK-side validation for invalid requests that are already forbidden by the backend API contract. The SDK should fail early with clear local errors before sending requests that are guaranteed to receive backend `400` responses.

Validation should live in the API helper layer, not in `ApiClient`, because these rules are NMSCI API contract rules rather than generic HTTP behavior.

Validation targets:

- `id` and `pubkey` query modes must not be mixed.
- Required target selectors must be present for consume-chain edge and returning-flow-rate queries.
- `targetId`/`targetPubkey` and `sourceId`/`sourcePubkey` must not be mixed.
- `page` must be an integer greater than or equal to `0`.
- `size` must be an integer between `1` and `200`.
- Obvious UUID, hex, and compressed public key shape errors should be rejected where the helper has enough context to know the expected shape.

Validation errors should name the offending parameter and expected rule. They do not need a new custom error type unless the implementation benefits from one; plain `Error` is acceptable if messages are stable and tested.

## Phase C: Release Documentation And Package Smoke Testing

Add release-facing documentation and a package smoke test so the 3.0.0 package is easier to verify before publishing.

Documentation requirements:

- Add `CHANGELOG.md` or `MIGRATION.md`.
- Call out 3.0.0 breaking changes:
  - `getConsumeChainEdges().data` changed from an array to `SliceResponseDTO`, so consumers should use `.data.content`.
  - `sendCentralPubkeyLockedMsg` now returns the persisted message response instead of `void`.
  - `BlockInfoRaw.rawBytes` was removed because the backend does not output it.
- Document the remaining `elliptic` low severity advisory and the planned future migration path.

Package smoke test requirements:

- Add a script such as `test:pack`.
- Build and pack the package into a temporary directory.
- Verify ESM imports work for:
  - `@nmsci/sdk`
  - `@nmsci/sdk/api`
  - `@nmsci/sdk/messages`
  - `@nmsci/sdk/protocol`
- Verify CommonJS `require` works for the same public entry points.
- Clean temporary files after the test.

## Testing Strategy

Phase A verification:

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm audit --audit-level=high`

Phase B tests:

- Add or extend API validation tests for invalid query objects.
- Cover missing targets, mixed id/pubkey modes, invalid pagination, and obvious malformed UUID/pubkey/hex values.
- Preserve existing URL construction tests for valid requests.

Phase C tests:

- Add `npm run test:pack`.
- Keep the pack smoke test independent of the release script so it can run before release dry-runs.

Final verification:

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run test:pack`
- `npm audit --audit-level=high`

## Risk Controls

- Make dependency upgrades first and verify before touching production SDK code.
- Do not change message serialization semantics to satisfy tool upgrades.
- Keep crypto implementation unchanged in this round.
- Keep validation behavior narrow: reject clearly invalid inputs, but let backend remain the source of truth for deeper protocol/business validation.
- If an audit finding cannot be resolved without a harmful downgrade or broad dependency replacement, document the remaining risk and reason.

## Acceptance Criteria

- No high or critical audit findings remain, or any unavoidable remaining finding is documented with a concrete reason.
- All existing tests pass after dependency upgrades.
- SDK helpers reject clearly invalid query parameters locally with tested error messages.
- Package smoke testing proves the published entry points work after packing.
- Migration documentation is clear enough for 2.x consumers moving to 3.0.0.
- No new business API behavior or protocol serialization behavior is introduced.
