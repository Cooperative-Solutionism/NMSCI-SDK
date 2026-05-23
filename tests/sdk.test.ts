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
            rawBytes: 'dd',
          },
        }), { status: 200 });
      },
    });

    const response = await sdk.block.getLast();

    expect(response.data.height).toBe(1);
    expect(requested).toEqual(['https://example.test/block-chain/last']);
  });
});
