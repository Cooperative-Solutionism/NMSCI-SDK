# Raw Download API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add low-level `ApiClient.getRaw()` and `ApiClient.download()` helpers for non-`ResponseResult` static resources.

**Architecture:** Keep raw download support inside `ApiClient`, reusing the existing URL builder, auth header builder, and timeout path. Do not add `sdk.static.*`; users access the new helpers through `client` or `sdk.client`.

**Tech Stack:** TypeScript, Fetch `Response`, `ArrayBuffer`, Vitest, existing `ApiClientError`, existing API contract manifest tests.

---

## File Structure

- Modify: `src/api/client.ts`
  - Add `getRaw(path, params?)`.
  - Add `download(path, params?)`.
  - Keep existing JSON request methods unchanged.
- Modify: `tests/api-client.test.ts`
  - Add raw response, binary download, query serialization, auth header, and non-2xx error tests.
- Modify: `tests/public-api.type-test.ts`
  - Add return type assertions for `client.getRaw` and `client.download`.
- Modify: `contracts/nmsci-api.v3.json`
  - Add `clientMethods: ["getRaw", "download"]` to both raw-static endpoints.
- Modify: `tests/api-contract-manifest.test.ts`
  - Add optional `clientMethods` field to the test interface.
  - Verify raw-static endpoints are covered by `ApiClient.getRaw/download`.

## Task 1: Add ApiClient Raw Behavior RED Tests

**Files:**
- Modify: `tests/api-client.test.ts`

- [ ] **Step 1: Write failing raw ApiClient tests**

Append these tests inside the existing `describe('ApiClient', () => { ... })` block in `tests/api-client.test.ts`, before the final closing `});`:

```ts
  it('returns raw responses without parsing them as ResponseResult JSON', async () => {
    let requestedUrl = '';
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requestedUrl = url;
        return new Response('not json', {
          status: 200,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
      },
    });

    const response = await client.getRaw('/dat/blk00000001.dat');

    expect(requestedUrl).toBe('https://example.test/dat/blk00000001.dat');
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/octet-stream');
    expect(await response.text()).toBe('not json');
  });

  it('downloads raw response bodies as ArrayBuffer', async () => {
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async () => new Response(new Uint8Array([0, 1, 2, 255]), { status: 200 }),
    });

    const bytes = await client.download('/source-code/source_code_v1.zip');

    expect(Array.from(new Uint8Array(bytes))).toEqual([0, 1, 2, 255]);
  });

  it('serializes raw query params and skips undefined values', async () => {
    let requestedUrl = '';
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requestedUrl = url;
        return new Response('raw', { status: 200 });
      },
    });

    await client.getRaw('/dat/file.dat', { n: 1, enabled: false, omitted: undefined });

    expect(requestedUrl).toBe('https://example.test/dat/file.dat?n=1&enabled=false');
  });

  it('sends bearer auth headers for raw requests', async () => {
    let headers = new Headers();
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      authToken: 'secret-token',
      fetch: async (_url, init) => {
        headers = new Headers(init?.headers);
        return new Response('raw', { status: 200 });
      },
    });

    await client.getRaw('/source-code/source_code_v1.zip');

    expect(headers.get('Authorization')).toBe('Bearer secret-token');
  });

  it('throws ApiClientError for non-2xx raw responses', async () => {
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async () => new Response('missing', { status: 404 }),
    });

    await expect(client.getRaw('/dat/missing.dat')).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'HTTP request failed with status 404',
      status: 404,
      url: 'https://example.test/dat/missing.dat',
    } satisfies Partial<ApiClientError>);
  });
```

- [ ] **Step 2: Run the ApiClient tests to verify RED**

Run:

```bash
npm test -- tests/api-client.test.ts
```

Expected: FAIL with TypeScript/runtime errors that `getRaw` and `download` do not exist on `ApiClient`.

## Task 2: Add Public Type and Contract RED Tests

**Files:**
- Modify: `tests/public-api.type-test.ts`
- Modify: `contracts/nmsci-api.v3.json`
- Modify: `tests/api-contract-manifest.test.ts`

- [ ] **Step 1: Add public type assertions**

Add this block in `tests/public-api.type-test.ts` after `declare const client: ApiClient;` and the other declarations:

```ts
expectTypeOf<ReturnType<typeof client.getRaw>>().toEqualTypeOf<Promise<Response>>();
expectTypeOf<ReturnType<typeof client.download>>().toEqualTypeOf<Promise<ArrayBuffer>>();
```

- [ ] **Step 2: Add raw client method mappings to the contract manifest**

Update the two raw-static endpoint objects at the end of `contracts/nmsci-api.v3.json` to include `clientMethods`.

Use this exact JSON for the `/dat/**` endpoint:

```json
    {
      "id": "static.datFiles",
      "method": "GET",
      "path": "/dat/**",
      "envelope": "raw-static",
      "sdkFunctions": [],
      "sdkGroups": [],
      "clientMethods": ["getRaw", "download"]
    }
```

Use this exact JSON for the `/source-code/**` endpoint:

```json
    {
      "id": "static.sourceCodeArchives",
      "method": "GET",
      "path": "/source-code/**",
      "envelope": "raw-static",
      "sdkFunctions": [],
      "sdkGroups": [],
      "clientMethods": ["getRaw", "download"]
    }
```

- [ ] **Step 3: Update the contract manifest test interface**

In `tests/api-contract-manifest.test.ts`, extend `ApiContractEndpoint` with the optional client methods field:

```ts
  clientMethods?: string[];
```

The interface should become:

```ts
interface ApiContractEndpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  envelope: 'response-result' | 'raw-static';
  sdkFunctions: string[];
  sdkGroups: string[];
  clientMethods?: string[];
}
```

- [ ] **Step 4: Replace the raw-static manifest assertion**

Replace the existing test named `keeps static file resources explicit until raw download helpers are added` with this test:

```ts
  it('maps raw static resources to low-level ApiClient raw helpers', () => {
    const contract = readContract();
    const rawStaticEndpoints = contract.endpoints.filter(endpoint => endpoint.envelope === 'raw-static');
    const client = new api.ApiClient({
      baseUrl: 'https://example.test',
      fetch: async () => new Response('raw', { status: 200 }),
    });

    expect(rawStaticEndpoints.map(endpoint => `${endpoint.method} ${endpoint.path}`)).toEqual([
      'GET /dat/**',
      'GET /source-code/**',
    ]);
    for (const endpoint of rawStaticEndpoints) {
      expect(endpoint.sdkFunctions).toEqual([]);
      expect(endpoint.sdkGroups).toEqual([]);
      expect(endpoint.clientMethods, endpoint.id).toEqual(['getRaw', 'download']);
      for (const clientMethod of endpoint.clientMethods || []) {
        expect(typeof readGroupPath(client, clientMethod), `${endpoint.id}: ${clientMethod}`).toBe('function');
      }
    }
  });
```

- [ ] **Step 5: Run type and contract tests to verify RED**

Run:

```bash
npm run test:types
npm test -- tests/api-contract-manifest.test.ts
```

Expected:

- `npm run test:types` FAILS because `getRaw` and `download` do not exist on `ApiClient`.
- `npm test -- tests/api-contract-manifest.test.ts` FAILS because `readGroupPath(client, 'getRaw')` and `readGroupPath(client, 'download')` are not functions.

## Task 3: Implement Raw ApiClient Helpers

**Files:**
- Modify: `src/api/client.ts`

- [ ] **Step 1: Add `getRaw` and `download` to `ApiClient`**

In `src/api/client.ts`, add these methods after the existing `get<T>()` method and before `post<T>()`:

```ts
  async getRaw(path: string, params?: QueryParams): Promise<Response> {
    const url = this.buildUrl(path, params);
    const response = await this.fetchWithTimeout(url, {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    if (!response.ok) {
      throw new ApiClientError(`HTTP request failed with status ${response.status}`, {
        url,
        status: response.status,
      });
    }

    return response;
  }

  async download(path: string, params?: QueryParams): Promise<ArrayBuffer> {
    const response = await this.getRaw(path, params);
    return response.arrayBuffer();
  }
```

- [ ] **Step 2: Run focused tests to verify GREEN**

Run:

```bash
npm test -- tests/api-client.test.ts tests/api-contract-manifest.test.ts
npm run test:types
```

Expected: both commands PASS.

- [ ] **Step 3: Verify existing JSON behavior remains covered**

Run:

```bash
npm test -- tests/api-client.test.ts tests/api-contract.test.ts
```

Expected: PASS. Existing JSON `get/post/postBinary` behavior remains unchanged.

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

Expected: all commands PASS. The only acceptable recurring warning is npm's existing `Unknown user config "home"` warning.

- [ ] **Step 2: Review the final diff**

Run:

```bash
git diff -- src/api/client.ts tests/api-client.test.ts tests/public-api.type-test.ts contracts/nmsci-api.v3.json tests/api-contract-manifest.test.ts
git status --short
```

Expected changed files:

- `src/api/client.ts`
- `tests/api-client.test.ts`
- `tests/public-api.type-test.ts`
- `contracts/nmsci-api.v3.json`
- `tests/api-contract-manifest.test.ts`

Expected scope:

- `ApiClient` gains only `getRaw` and `download`.
- Existing JSON request methods are unchanged.
- Contract manifest keeps raw-static `sdkFunctions` and `sdkGroups` empty while adding `clientMethods`.

- [ ] **Step 3: Commit**

Run:

```bash
git add src/api/client.ts tests/api-client.test.ts tests/public-api.type-test.ts contracts/nmsci-api.v3.json tests/api-contract-manifest.test.ts
git commit -m "功能: 添加 Raw 下载 API"
git log -1 --format="%h %an %cn %s"
```

Expected latest commit author and committer are `GPT5.5XH`, and the subject is `功能: 添加 Raw 下载 API`.
