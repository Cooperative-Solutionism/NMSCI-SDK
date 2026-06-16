import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NmsciSdk } from '../src';
import * as api from '../src/api';

interface ApiContractEndpoint {
  id: string;
  method: 'GET' | 'POST';
  path: string;
  envelope: 'response-result' | 'raw-static';
  sdkFunctions: string[];
  sdkGroups: string[];
  clientMethods?: string[];
}

interface ApiContract {
  contractVersion: number;
  apiVersion: string;
  source: {
    repository: string;
    document: string;
  };
  endpoints: ApiContractEndpoint[];
}

const contractPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'contracts', 'nmsci-api.v3.json');

function readContract(): ApiContract {
  return JSON.parse(readFileSync(contractPath, 'utf8')) as ApiContract;
}

function readGroupPath(root: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object' && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

describe('machine-readable backend API contract', () => {
  it('tracks the documented endpoint surface', () => {
    const contract = readContract();
    const uniqueOperations = new Set(contract.endpoints.map(endpoint => `${endpoint.method} ${endpoint.path}`));

    expect(contract.contractVersion).toBe(1);
    expect(contract.apiVersion).toBe('3.0.0');
    expect(contract.source).toEqual({
      repository: 'NMSCI',
      document: 'docs/API.md',
    });
    expect(contract.endpoints).toHaveLength(38);
    expect(uniqueOperations.size).toBe(contract.endpoints.length);
    expect(contract.endpoints.filter(endpoint => endpoint.envelope === 'response-result')).toHaveLength(36);
    expect(contract.endpoints.filter(endpoint => endpoint.envelope === 'raw-static')).toHaveLength(2);
  });

  it('maps every ResponseResult endpoint to SDK helpers', () => {
    const contract = readContract();
    const apiExports = api as Record<string, unknown>;
    const sdk = new NmsciSdk({
      baseUrl: 'https://example.test',
      fetch: async () => new Response(JSON.stringify({ code: 200, message: 'ok', data: {} }), { status: 200 }),
    });

    for (const endpoint of contract.endpoints.filter(endpoint => endpoint.envelope === 'response-result')) {
      expect(endpoint.sdkFunctions, endpoint.id).not.toHaveLength(0);
      expect(endpoint.sdkGroups, endpoint.id).not.toHaveLength(0);

      for (const sdkFunction of endpoint.sdkFunctions) {
        expect(typeof apiExports[sdkFunction], `${endpoint.id}: ${sdkFunction}`).toBe('function');
      }

      for (const sdkGroup of endpoint.sdkGroups) {
        expect(typeof readGroupPath(sdk, sdkGroup), `${endpoint.id}: ${sdkGroup}`).toBe('function');
      }
    }
  });

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
});
