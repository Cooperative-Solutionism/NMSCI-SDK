import { describe, expect, it } from 'vitest';
import { NmsciSdk } from '../src';

describe('NmsciSdk', () => {
  it('delegates grouped service calls through a shared ApiClient', async () => {
    const requested: string[] = [];
    const sdk = new NmsciSdk({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return new Response(JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            id: 'block',
            version: 1,
            height: 1,
            sourceCodeZipHash: 'aa',
            previousBlockHash: 'bb',
            merkleRoot: 'cc',
            maxMsgTimestamp: 2,
            registerDifficultyTarget: '1effffff',
            transactionDifficultyTarget: '1effffff',
            centralPubkey: `02${'11'.repeat(32)}`,
            timestamp: 3,
            centralSignature: 'aa'.repeat(64),
            datFilepath: '/tmp/a.dat',
            sourceCodeZipFilepath: '/tmp/a.zip',
          },
        }), { status: 200 });
      },
    });

    const response = await sdk.block.getLast();

    expect(response.data.height).toBe(1);
    expect(requested).toEqual(['https://example.test/blocks/latest']);
  });

  it('exposes grouped message collection root helpers', async () => {
    const requested: string[] = [];
    const sdk = new NmsciSdk({
      baseUrl: 'https://example.test',
      fetch: async (url) => {
        requested.push(url);
        return new Response(JSON.stringify({
          code: 200,
          message: 'ok',
          data: {
            content: [],
            page: 0,
            size: 0,
            numberOfElements: 0,
            hasNext: false,
            hasPrevious: false,
          },
        }), { status: 200 });
      },
    });

    await sdk.flowNodeRegister.list({ flowNodePubkey: 'flow-a', page: 1, size: 10 });
    await sdk.centralPubkeyEmpower.list({ flowNodePubkey: 'flow-b', page: 2, size: 20 });
    await sdk.flowNodeLocked.list({ page: 3, size: 30 });
    await sdk.centralPubkeyLocked.list({ page: 4, size: 40 });

    expect(requested).toEqual([
      'https://example.test/flow-node-registrations?flowNodePubkey=flow-a&page=1&size=10',
      'https://example.test/central-pubkey-empowerments?flowNodePubkey=flow-b&page=2&size=20',
      'https://example.test/flow-node-locks?page=3&size=30',
      'https://example.test/central-pubkey-locks?page=4&size=40',
    ]);
  });
});
