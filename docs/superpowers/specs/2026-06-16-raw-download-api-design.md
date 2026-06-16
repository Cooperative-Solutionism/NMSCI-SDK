# Raw Download API Design

**Goal:** Add low-level raw response and binary download support to `ApiClient` so SDK users can consume non-`ResponseResult` resources such as `/dat/**` and `/source-code/**`.

**Context:** The backend API document states that static resources are served directly by `WebMvcConfig` and do not use the normal `ResponseResult<T>` JSON envelope. The SDK currently routes all `ApiClient.get/post/postBinary` calls through JSON parsing, so these endpoints cannot be consumed without bypassing the SDK.

## Scope

Add two low-level `ApiClient` methods:

- `getRaw(path: string, params?: QueryParams): Promise<Response>`
- `download(path: string, params?: QueryParams): Promise<ArrayBuffer>`

These methods are intended for raw static resources, especially:

- `/dat/**`
- `/source-code/**`

They are deliberately generic so the SDK can support future raw endpoints without another client-level change.

## Out of Scope

- Do not add `sdk.static.*` high-level helpers in this round.
- Do not add path allow-listing for `/dat/**` or `/source-code/**`.
- Do not change existing JSON methods: `get`, `post`, `postBinary`, or `postBinaryNoResponse`.
- Do not parse raw static responses as JSON.
- Do not normalize or decode file contents.
- Do not add filesystem write helpers; callers decide whether to stream, buffer, save, or inspect headers.

## API Behavior

`getRaw(path, params?)` should:

1. Build the URL with the existing `baseUrl` and query parameter behavior.
2. Send a `GET` request with existing auth header behavior.
3. Use the existing timeout path.
4. Return the original `Response` for successful HTTP 2xx responses.
5. Throw `ApiClientError` for non-2xx HTTP responses, including `url` and `status`.
6. Avoid reading or consuming the response body on success.

`download(path, params?)` should:

1. Call `getRaw(path, params?)`.
2. Return `await response.arrayBuffer()` for successful responses.
3. Preserve the same non-2xx error behavior as `getRaw`.

## Error Handling

Raw methods keep the SDK's fail-fast style for HTTP errors:

- HTTP 2xx: return raw `Response` or `ArrayBuffer`.
- HTTP non-2xx: throw `ApiClientError`.
- Timeout: preserve the existing `AbortController` behavior from `fetchWithTimeout`.

Unlike JSON methods, raw methods should not try to parse backend error bodies into `ApiResponse<T>`. Static file errors are not part of the `ResponseResult` contract, and reading the body during error handling would add behavior the SDK cannot consistently type.

## Data Flow

Raw response:

```ts
const response = await client.getRaw('/dat/blk00000001.dat');
const contentType = response.headers.get('content-type');
const bytes = await response.arrayBuffer();
```

Direct download:

```ts
const bytes = await client.download('/source-code/source_code_v1.zip');
```

Through `NmsciSdk`:

```ts
const sdk = new NmsciSdk({ baseUrl });
const bytes = await sdk.client.download('/dat/blk00000001.dat');
```

## Contract Manifest

The machine-readable contract currently marks `/dat/**` and `/source-code/**` as `raw-static` with empty SDK mappings. After this feature, the contract should make those endpoints explicit as supported by the low-level client raw capability.

Because `ApiClient` methods are not top-level API functions and are not `NmsciSdk` grouped helpers, the manifest test should use a separate assertion for raw-static endpoints rather than forcing them into the `sdkFunctions` or `sdkGroups` model used for `ResponseResult` endpoints.

## Testing

Use TDD for implementation.

Required tests:

- `ApiClient.getRaw()` returns a `Response` for a non-JSON body and does not parse it as `ResponseResult`.
- `ApiClient.download()` returns exact binary bytes from the response body.
- `getRaw()` preserves query parameter serialization, including skipped `undefined` values.
- `getRaw()` sends the configured bearer token.
- `getRaw()` throws `ApiClientError` with `status` and `url` for non-2xx responses.
- Public type tests assert:
  - `ApiClient['getRaw']` returns `Promise<Response>`
  - `ApiClient['download']` returns `Promise<ArrayBuffer>`
- Contract manifest tests assert raw-static endpoints are covered by `ApiClient.getRaw/download`.

Final verification:

- `npm run typecheck`
- `npm test`
- `npm run test:types`
- `git diff --check`

## Acceptance Criteria

- Users can fetch `/dat/**` and `/source-code/**` through `ApiClient` without JSON parsing errors.
- Existing `ResponseResult<T>` client methods remain behaviorally unchanged.
- Raw HTTP errors use `ApiClientError` consistently.
- `download()` provides a simple `ArrayBuffer` path for callers that do not need headers or streaming.
- Contract tests no longer describe raw static resources as unsupported by the SDK.
