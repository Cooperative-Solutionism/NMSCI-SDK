# CI, README, and Encoding Cleanup Design

**Goal:** Add a validation-focused CI workflow, document recently added SDK usage paths, and audit/fix confirmed mojibake or replacement characters without changing runtime SDK behavior.

**Context:** The repository currently has no `.github` workflow directory. Recent SDK work added `sdk.normalized.*` and `ApiClient.getRaw()` / `ApiClient.download()`, but the README still focuses on lower-level normalize helpers and JSON APIs. Earlier terminal output made some UTF-8 text look corrupted, but a Node UTF-8 character scan confirmed sampled files such as `package.json`, `README.md`, and existing design docs contain valid Unicode. The implementation must therefore distinguish terminal rendering issues from real file corruption.

## Scope

### 1. GitHub Actions CI

Add `.github/workflows/ci.yml` for validation on:

- `push`
- `pull_request`

Use current official action versions from upstream docs:

- `actions/checkout@v6`
- `actions/setup-node@v6`

Use a Node matrix that matches the supported development/runtime range:

- `20.x`
- `22.x`

Run the same checks developers are expected to run locally:

- `npm ci`
- `npm run typecheck`
- `npm test`
- `npm run test:types`
- `npm run test:pack`
- `npm run build`

Use `permissions: contents: read` because the workflow only reads repository contents. Use npm dependency caching through `setup-node` where appropriate for CI validation jobs.

### 2. README Usage Docs

Update README with concise examples for the newest public SDK surfaces:

- `sdk.normalized.*`
  - Show direct use of normalized high-level methods.
  - Explain that normalized responses keep the `ApiResponse<T>` envelope but convert modeled large numeric fields to `bigint`.
  - Keep existing raw API and standalone `normalizeApiResponse(...)` docs as valid lower-level options.
- `ApiClient.getRaw()` and `ApiClient.download()`
  - Show raw static resource usage for `/dat/**`.
  - Show binary download usage for `/source-code/**`.
  - Clarify that raw methods do not parse `ResponseResult<T>` JSON and are accessed through `client` or `sdk.client`.

Add a short development-checks section that matches the new CI commands, so local verification and CI stay aligned.

### 3. Encoding and Metadata Audit

Perform a UTF-8 based audit instead of relying on PowerShell terminal rendering. Search text files for confirmed suspicious characters or byte-decoding artifacts, including:

- Unicode replacement character (`U+FFFD`)
- common mojibake fragments produced by incorrectly decoded UTF-8 text, represented in the implementation audit as explicit code point patterns rather than copied into this design doc

Only edit files where the actual UTF-8 contents contain confirmed corruption. Do not rewrite valid Chinese text or valid symbols such as the Unicode em dash in `package.json`.

Expected high-value targets:

- `package.json` metadata
- `README.md`
- `CHANGELOG.md`
- `docs/**/*.md`
- source comments under `src/**/*.ts`

## Out of Scope

- Do not add an npm publish workflow in this round.
- Do not configure npm trusted publishing in this repository; it requires npm package-side settings that cannot be safely inferred locally.
- Do not change package version.
- Do not change SDK runtime behavior, exported types, or generated package contents except where README/CI verification exposes a real issue.
- Do not bulk-transcode or rewrite docs that already contain valid UTF-8.

## Release Workflow Note

Trusted publishing and provenance should remain a follow-up unless the repository and npm package are explicitly configured for it. Official npm docs require GitHub Actions OIDC permissions for trusted publishing, and npm also requires npm CLI `11.5.1+` with Node `22.14.0+` for this path.

Sources checked:

- https://github.com/actions/checkout
- https://github.com/actions/setup-node
- https://docs.npmjs.com/trusted-publishers/

## Testing and Verification

Implementation should be verified with:

- `npm run typecheck`
- `npm test`
- `npm run test:types`
- `npm run test:pack`
- `npm run build`
- `git diff --check`

Additional checks:

- Validate YAML syntax structurally by reading the workflow as text and checking indentation.
- Run a Node UTF-8 scan for suspicious mojibake markers before and after cleanup.
- Confirm README examples reference real exported APIs.

## Acceptance Criteria

- GitHub Actions has a validation workflow for push and pull request events.
- CI uses current official checkout/setup-node action major versions and a supported Node matrix.
- README documents `sdk.normalized.*`, `getRaw()`, `download()`, and local verification commands.
- Any confirmed mojibake or replacement characters in tracked text files are fixed.
- Valid UTF-8 text is not rewritten merely because PowerShell renders it incorrectly.
- All local verification commands pass after implementation.
