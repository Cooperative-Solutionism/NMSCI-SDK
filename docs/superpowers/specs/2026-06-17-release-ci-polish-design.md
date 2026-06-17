# Release CI Polish Design

**Goal:** Harden the local release path, remove duplicated CI build work, improve README copy-paste examples, and reduce false positives in the text encoding audit without adding an npm publish workflow.

**Context:** The repository already has validation-only GitHub Actions CI and a local `scripts/release.mjs` publisher. The user chose not to add a publish workflow in this round because npm trusted publisher configuration cannot be verified from the local repository. Current CI runs `npm run test:pack` followed by `npm run build`; `test:pack` already builds internally, so CI does redundant build work. The text encoding audit currently uses broad single-codepoint markers that are useful but may false-positive on legitimate text in the future.

## Scope

### 1. Pack Smoke Build Control

Keep `npm run test:pack` self-contained for local use by default. Add a prepared-mode path so CI and release flows can reuse an already-built `dist`:

- `scripts/smoke-pack.mjs --skip-build`
- `npm run test:pack:prepared`

Default behavior stays unchanged:

- `npm run test:pack` still runs `npm run build` before packing.

### 2. CI Command Order

Update `.github/workflows/ci.yml` so CI runs the same checks without duplicated build work:

1. `npm ci`
2. `npm run test:encoding`
3. `npm run typecheck`
4. `npm test`
5. `npm run test:types`
6. `npm run build`
7. `npm run test:pack:prepared`

The workflow remains validation-only. It must not add `id-token: write`, publish permissions, npm tokens, tag triggers, or a publish job.

### 3. Local Release Gate

Strengthen `scripts/release.mjs` while preserving its current safety model:

- When tests are not skipped, run:
  - `npm run test:encoding`
  - `npm run typecheck`
  - `npm test`
  - `npm run test:types`
- After version bump and confirmation, run:
  - `npm run build`
  - `npm run test:pack:prepared`
- Then proceed to `npm publish` or `npm publish --dry-run` as it does today.

`--skip-tests` should skip the pre-bump quality gate, but it should not skip the build step. Whether it skips pack smoke should be explicit in the implementation plan; the preferred design is that pack smoke runs after build even when `--skip-tests` is used because it validates publishable package shape.

Do not add provenance flags, OIDC, or GitHub Actions publishing behavior in this round.

### 4. Encoding Audit Precision

Refine `scripts/check-text-encoding.mjs` to reduce false positives:

- Continue failing on Unicode replacement character `U+FFFD`.
- Replace broad single-character mojibake checks with contextual fragment checks that represent realistic corrupted UTF-8 text.
- Keep scanning tracked text files from `git ls-files`.
- Add tests for:
  - clean Chinese/English text passes
  - replacement character fails
  - representative mojibake fragment fails

The implementation should make the scanner testable without needing to write tracked fixture files into the repository root.

### 5. README Polish

Update README to match the new command order and improve copy-paste examples:

- Add `import { NmsciSdk } from '@nmsci/sdk';` to the raw `sdk.client.download` snippet.
- Change local verification docs to run `npm run build` before `npm run test:pack:prepared`.
- Explain that `npm run test:pack` remains a standalone command, while `test:pack:prepared` is for already-built CI/release flows.
- Clarify that release automation remains local; trusted publishing/provenance is still a separate future step requiring npm-side configuration.

## Out of Scope

- No GitHub Actions publish workflow.
- No automatic tag-based npm publishing.
- No `npm publish --provenance` behavior.
- No package version bump.
- No runtime SDK behavior changes.
- No crypto dependency migration.

## Testing and Verification

Required verification after implementation:

- `npm run test:encoding`
- `npm run typecheck`
- `npm test`
- `npm run test:types`
- `npm run build`
- `npm run test:pack:prepared`
- `npm run test:pack`
- `npm run release:dry -- --skip-tests --yes` or an equivalent dry-run-safe release verification if npm authentication makes this impossible locally
- `git diff --check`

If release dry-run requires npm login and cannot run in the environment, the implementation must report that clearly and verify the changed release command sequence through targeted tests or a dry-run mode that does not require external publication.

## Acceptance Criteria

- CI no longer builds twice for the pack smoke path.
- `test:pack` remains self-contained for local users.
- `test:pack:prepared` validates packed ESM/CJS/subpath imports from an existing build.
- Local release script runs encoding, typecheck, unit tests, type tests, build, and pack smoke before publishing.
- Encoding audit has lower false-positive risk and regression tests.
- README examples and command lists match the implemented scripts.
- Worktree remains clean and full verification passes.
