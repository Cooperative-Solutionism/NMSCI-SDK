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
});
