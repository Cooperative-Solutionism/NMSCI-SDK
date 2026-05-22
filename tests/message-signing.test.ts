import { describe, expect, it } from 'vitest';
import {
  buildCentralPubkeyEmpowerPayload,
  buildCentralPubkeyLockedPayload,
  buildFlowNodeLockedPayload,
  buildFlowNodeRegisterPayload,
  buildTransactionMountPayload,
  buildTransactionRecordPayload,
  signCentralPubkeyEmpowerPayload,
  signCentralPubkeyLockedPayload,
  signFlowNodeLockedPayload,
  signFlowNodeRegisterPayload,
  signTransactionMountPayload,
  signTransactionRecordPayload,
} from '../src';
import type { Pubkey, UUID } from '../src';

const privateKey = '01'.padStart(64, '0');
const uuid = '550e8400e29b41d4a716446655440000' as UUID;
const mountedTransactionRecordId = '650e8400e29b41d4a716446655440001' as UUID;
const flowNodePubkey = `02${'11'.repeat(32)}` as Pubkey;
const consumeNodePubkey = `03${'22'.repeat(32)}` as Pubkey;
const centralPubkey = `02${'33'.repeat(32)}` as Pubkey;

describe('message signing helpers', () => {
  it('signs every pre-sign payload shape', async () => {
    const payloads = [
      [buildFlowNodeRegisterPayload({ uuid, registerDifficultyTarget: '1effffff', nonce: 1, flowNodePubkey }), signFlowNodeRegisterPayload],
      [buildCentralPubkeyEmpowerPayload({ uuid, flowNodePubkey, centralPubkey }), signCentralPubkeyEmpowerPayload],
      [buildCentralPubkeyLockedPayload({ uuid, centralPubkey }), signCentralPubkeyLockedPayload],
      [buildFlowNodeLockedPayload({ uuid, flowNodePubkey, centralPubkey }), signFlowNodeLockedPayload],
      [
        buildTransactionRecordPayload({
          uuid,
          amount: 100n,
          currencyType: 1,
          transactionDifficultyTarget: '1effffff',
          nonce: 1,
          consumeNodePubkey,
          flowNodePubkey,
          centralPubkey,
        }),
        signTransactionRecordPayload,
      ],
      [
        buildTransactionMountPayload({
          uuid,
          mountedTransactionRecordId,
          transactionDifficultyTarget: '1effffff',
          nonce: 1,
          consumeNodePubkey,
          flowNodePubkey,
          centralPubkey,
        }),
        signTransactionMountPayload,
      ],
    ] as const;

    for (const [payload, signPayload] of payloads) {
      await expect(signPayload(payload, privateKey)).resolves.toHaveLength(128);
    }
  });

  it('rejects payloads with the wrong length', async () => {
    await expect(signFlowNodeRegisterPayload(new Uint8Array(58), privateKey)).rejects.toThrow(/59 bytes/);
    await expect(signCentralPubkeyEmpowerPayload(new Uint8Array(83), privateKey)).rejects.toThrow(/84 bytes/);
    await expect(signCentralPubkeyLockedPayload(new Uint8Array(50), privateKey)).rejects.toThrow(/51 bytes/);
    await expect(signFlowNodeLockedPayload(new Uint8Array(83), privateKey)).rejects.toThrow(/84 bytes/);
    await expect(signTransactionRecordPayload(new Uint8Array(134), privateKey)).rejects.toThrow(/135 bytes/);
    await expect(signTransactionMountPayload(new Uint8Array(140), privateKey)).rejects.toThrow(/141 bytes/);
  });
});
