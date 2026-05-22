import { describe, expect, it } from 'vitest';
import {
  MSG_SPECS,
  MsgType,
  buildCentralPubkeyEmpowerPayload,
  buildCentralPubkeyLockedPayload,
  buildFlowNodeLockedPayload,
  buildFlowNodeRegisterPayload,
  buildTransactionMountPayload,
  buildTransactionRecordPayload,
  serializeCentralPubkeyEmpowerFullMessage,
  serializeCentralPubkeyEmpowerSubmitPayload,
  serializeCentralPubkeyLockedFullMessage,
  serializeCentralPubkeyLockedSubmitPayload,
  serializeFlowNodeLockedFullMessage,
  serializeFlowNodeLockedSubmitPayload,
  serializeFlowNodeRegisterFullMessage,
  serializeFlowNodeRegisterSubmitPayload,
  serializeTransactionMountFullMessage,
  serializeTransactionMountSubmitPayload,
  serializeTransactionRecordFullMessage,
  serializeTransactionRecordSubmitPayload,
} from '../src';
import type { Pubkey, Signature, UUID } from '../src';

const uuid = '550e8400e29b41d4a716446655440000' as UUID;
const mountedTransactionRecordId = '650e8400e29b41d4a716446655440001' as UUID;
const flowNodePubkey = `02${'11'.repeat(32)}` as Pubkey;
const consumeNodePubkey = `03${'22'.repeat(32)}` as Pubkey;
const centralPubkey = `02${'33'.repeat(32)}` as Pubkey;
const signature = 'aa'.repeat(64) as Signature;

describe('message payload lengths', () => {
  it('serializes flow-node registration submit/full payloads', () => {
    const msg = {
      msgType: MsgType.FLOW_NODE_REGISTRATION,
      uuid,
      registerDifficultyTarget: '1effffff',
      nonce: 1,
      flowNodePubkey,
      flowNodeSignature: signature,
    };

    expect(buildFlowNodeRegisterPayload(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_REGISTRATION.preSignLength);
    expect(serializeFlowNodeRegisterSubmitPayload(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_REGISTRATION.submitLength);
    expect(serializeFlowNodeRegisterFullMessage(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_REGISTRATION.fullLength);
  });

  it('serializes central-key-auth submit/full payloads', () => {
    const msg = {
      msgType: MsgType.CENTRAL_KEY_AUTH,
      uuid,
      flowNodePubkey,
      centralPubkey,
      flowNodeSignature: signature,
      confirmTimestamp: 1n,
      centralSignature: signature,
    };

    expect(buildCentralPubkeyEmpowerPayload(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_AUTH.preSignLength);
    expect(serializeCentralPubkeyEmpowerSubmitPayload(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_AUTH.submitLength);
    expect(serializeCentralPubkeyEmpowerFullMessage(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_AUTH.fullLength);
  });

  it('serializes central-key-freeze submit/full payloads', () => {
    const msg = {
      msgType: MsgType.CENTRAL_KEY_FREEZE,
      uuid,
      centralPubkey,
      centralSignaturePre: signature,
      confirmTimestamp: 1n,
      centralSignature: signature,
    };

    expect(buildCentralPubkeyLockedPayload(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_FREEZE.preSignLength);
    expect(serializeCentralPubkeyLockedSubmitPayload(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_FREEZE.submitLength);
    expect(serializeCentralPubkeyLockedFullMessage(msg)).toHaveLength(MSG_SPECS.CENTRAL_KEY_FREEZE.fullLength);
  });

  it('serializes flow-node-freeze submit/full payloads', () => {
    const msg = {
      msgType: MsgType.FLOW_NODE_FREEZE,
      uuid,
      flowNodePubkey,
      centralPubkey,
      flowNodeSignature: signature,
      confirmTimestamp: 1n,
      centralSignature: signature,
    };

    expect(buildFlowNodeLockedPayload(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_FREEZE.preSignLength);
    expect(serializeFlowNodeLockedSubmitPayload(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_FREEZE.submitLength);
    expect(serializeFlowNodeLockedFullMessage(msg)).toHaveLength(MSG_SPECS.FLOW_NODE_FREEZE.fullLength);
  });

  it('serializes transaction-record submit/full payloads', () => {
    const msg = {
      msgType: MsgType.TRANSACTION_RECORD,
      uuid,
      amount: 100n,
      currencyType: 1,
      transactionDifficultyTarget: '1effffff',
      nonce: 1,
      consumeNodePubkey,
      flowNodePubkey,
      centralPubkey,
      consumeNodeSignature: signature,
      flowNodeSignature: signature,
      confirmTimestamp: 1n,
      centralSignature: signature,
    };

    expect(buildTransactionRecordPayload(msg)).toHaveLength(MSG_SPECS.TRANSACTION_RECORD.preSignLength);
    expect(serializeTransactionRecordSubmitPayload(msg)).toHaveLength(MSG_SPECS.TRANSACTION_RECORD.submitLength);
    expect(serializeTransactionRecordFullMessage(msg)).toHaveLength(MSG_SPECS.TRANSACTION_RECORD.fullLength);
  });

  it('serializes transaction-mount submit/full payloads', () => {
    const msg = {
      msgType: MsgType.TRANSACTION_MOUNT,
      uuid,
      mountedTransactionRecordId,
      transactionDifficultyTarget: '1effffff',
      nonce: 1,
      consumeNodePubkey,
      flowNodePubkey,
      centralPubkey,
      consumeNodeSignature: signature,
      flowNodeSignature: signature,
      confirmTimestamp: 1n,
      centralSignature: signature,
    };

    expect(buildTransactionMountPayload(msg)).toHaveLength(MSG_SPECS.TRANSACTION_MOUNT.preSignLength);
    expect(serializeTransactionMountSubmitPayload(msg)).toHaveLength(MSG_SPECS.TRANSACTION_MOUNT.submitLength);
    expect(serializeTransactionMountFullMessage(msg)).toHaveLength(MSG_SPECS.TRANSACTION_MOUNT.fullLength);
  });
});
