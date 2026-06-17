import { describe, expect, it } from 'vitest';
import {
  MsgType,
  buildCentralPubkeyEmpowerPayload,
  buildFlowNodeRegisterPayload,
  buildTransactionMountPayload,
  buildTransactionRecordFullPayload,
  buildTransactionRecordPayload,
  serializeTransactionRecordSubmitPayload,
} from '../src';
import type { Pubkey, Signature, UUID } from '../src';

const uuid = '550e8400e29b41d4a716446655440000' as UUID;
const mountedTransactionRecordId = '650e8400e29b41d4a716446655440001' as UUID;
const flowNodePubkey = `02${'11'.repeat(32)}` as Pubkey;
const consumeNodePubkey = `03${'22'.repeat(32)}` as Pubkey;
const centralPubkey = `02${'33'.repeat(32)}` as Pubkey;
const signature = 'aa'.repeat(64) as Signature;

const transactionRecordParams = {
  uuid,
  amount: 100n,
  currencyType: 1,
  transactionDifficultyTarget: '1effffff',
  nonce: 1,
  consumeNodePubkey,
  flowNodePubkey,
  centralPubkey,
};

describe('message runtime validation', () => {
  it('rejects nBits values that are not exactly 4-byte hex in message builders', () => {
    expect(() =>
      buildFlowNodeRegisterPayload({
        uuid,
        registerDifficultyTarget: '1efffff',
        nonce: 1,
        flowNodePubkey,
      }),
    ).toThrow(/registerDifficultyTarget must be a 4-byte hex string/);
  });

  it('rejects invalid nonce values before serializing the payload', () => {
    expect(() =>
      buildFlowNodeRegisterPayload({
        uuid,
        registerDifficultyTarget: '1effffff',
        nonce: 1.5,
        flowNodePubkey,
      }),
    ).toThrow(/nonce must be an unsigned 4-byte integer/);

    expect(() =>
      buildFlowNodeRegisterPayload({
        uuid,
        registerDifficultyTarget: '1effffff',
        nonce: 0x1_0000_0000,
        flowNodePubkey,
      }),
    ).toThrow(/nonce must be an unsigned 4-byte integer/);
  });

  it('rejects invalid amount and currencyType values', () => {
    expect(() =>
      buildTransactionRecordPayload({
        ...transactionRecordParams,
        amount: -1n,
      }),
    ).toThrow(/amount must be a bigint unsigned 8-byte integer/);

    expect(() =>
      buildTransactionRecordPayload({
        ...transactionRecordParams,
        amount: 100 as unknown as bigint,
      }),
    ).toThrow(/amount must be a bigint unsigned 8-byte integer/);

    expect(() =>
      buildTransactionRecordPayload({
        ...transactionRecordParams,
        currencyType: 0x1_0000,
      }),
    ).toThrow(/currencyType must be an unsigned 2-byte integer/);
  });

  it('adds field context to pubkey, signature, UUID, and timestamp errors', () => {
    expect(() =>
      buildCentralPubkeyEmpowerPayload({
        uuid,
        flowNodePubkey: 'bad-pubkey' as Pubkey,
        centralPubkey,
      }),
    ).toThrow(/flowNodePubkey must be a 33-byte compressed public key hex string/);

    expect(() =>
      serializeTransactionRecordSubmitPayload({
        msgType: MsgType.TRANSACTION_RECORD,
        ...transactionRecordParams,
        consumeNodeSignature: 'aa' as Signature,
        flowNodeSignature: signature,
      }),
    ).toThrow(/consumeNodeSignature must be a 64-byte hex signature/);

    expect(() =>
      buildTransactionMountPayload({
        uuid,
        mountedTransactionRecordId: 'not-a-uuid' as UUID,
        transactionDifficultyTarget: '1effffff',
        nonce: 1,
        consumeNodePubkey,
        flowNodePubkey,
        centralPubkey,
      }),
    ).toThrow(/mountedTransactionRecordId must be a 16-byte UUID hex string/);

    expect(() =>
      buildTransactionRecordFullPayload({
        ...transactionRecordParams,
        consumeNodeSignature: signature,
        flowNodeSignature: signature,
        confirmTimestamp: -1n,
      }),
    ).toThrow(/confirmTimestamp must be a bigint unsigned 8-byte integer/);
  });
});
