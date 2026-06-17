import { describe, expect, it } from 'vitest';
import { ApiClient, ApiClientError } from '../src';

describe('ApiClient', () => {
  it('sends only the visible bytes of a Uint8Array subarray', async () => {
    let sentBody: ArrayBuffer | undefined;
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (_url, init) => {
        sentBody = init?.body as ArrayBuffer;
        return new Response(JSON.stringify({ code: 200, message: 'ok', data: { accepted: true } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    const source = new Uint8Array([9, 1, 2, 3, 9]);
    await client.postBinary('/send', source.subarray(1, 4));

    expect(Array.from(new Uint8Array(sentBody!))).toEqual([1, 2, 3]);
  });

  it('stringifies number and boolean query params and skips undefined', async () => {
    let requestedUrl = '';
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requestedUrl = url;
        return new Response(JSON.stringify({ code: 200, message: 'ok', data: null }), { status: 200 });
      },
    });

    await client.get('/items', { n: 1, enabled: false, omitted: undefined });

    expect(requestedUrl).toBe('https://example.test/items?n=1&enabled=false');
  });

  it('invokes the global fetch with a valid receiver (no browser Illegal invocation)', async () => {
    // Browsers brand window.fetch and throw "Illegal invocation" when it is called with a
    // receiver that is not the global object (e.g. as a method on the ApiClient instance).
    // Node/jsdom do not enforce this, which previously masked the bug. This branded stand-in
    // reproduces the browser behavior so the default-fetch path stays correct.
    const original = globalThis.fetch;
    function brandedFetch(this: unknown, _input: string, _init?: RequestInit): Promise<Response> {
      if (this !== undefined && this !== globalThis) {
        return Promise.reject(new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation"));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ code: 200, message: 'ok', data: { ok: true } }), { status: 200 }),
      );
    }
    globalThis.fetch = brandedFetch as typeof fetch;
    try {
      const client = new ApiClient({ baseUrl: 'https://example.test' });
      const res = await client.get<{ ok: boolean }>('/ping');
      expect(res.code).toBe(200);
      expect(res.data.ok).toBe(true);
    } finally {
      globalThis.fetch = original;
    }
  });

  it('throws diagnostic errors for backend business errors', async () => {
    const client = new ApiClient({
      baseUrl: 'https://example.test',
      fetch: async () => new Response(JSON.stringify({ code: 400, message: 'bad payload', data: null }), {
        status: 200,
      }),
    });

    await expect(client.get('/bad')).rejects.toMatchObject({
      name: 'ApiClientError',
      message: 'bad payload',
      response: { code: 400, message: 'bad payload', data: null },
    } satisfies Partial<ApiClientError>);
  });

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
});
