import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, toBytesBigEndian, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { MSG_SPECS } from '../protocol/spec';
import {
  optionalSignatureField,
  optionalUint64BigIntField,
  pubkeyField,
  signatureField,
  uint64BigIntField,
  uuidField,
} from './validation';

/** 220-byte Flow Node Locked message (协议定义为220字节) */
export interface FlowNodeLockedMessage {
  msgType: MsgType.FLOW_NODE_FREEZE;
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature?: Signature;
  confirmTimestamp?: bigint;
  centralSignature?: Signature;
}

/**
 * Build the 220-byte serialized form.
 */
export function serializeFlowNodeLocked(msg: FlowNodeLockedMessage): Uint8Array {
  const flowSig = optionalSignatureField(msg.flowNodeSignature, 'flowNodeSignature');
  const timestamp = optionalUint64BigIntField(msg.confirmTimestamp, 'confirmTimestamp');
  const centralSig = optionalSignatureField(msg.centralSignature, 'centralSignature');

  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_FREEZE, 2), // 2 bytes
    uuidField(msg.uuid, 'uuid'),                    // 16 bytes
    pubkeyField(msg.flowNodePubkey, 'flowNodePubkey'), // 33 bytes
    pubkeyField(msg.centralPubkey, 'centralPubkey'), // 33 bytes
    flowSig,                                         // 64 bytes
    timestamp,                                       // 8 bytes
    centralSig,                                      // 64 bytes
  );
}

export const serializeFlowNodeLockedFullMessage = serializeFlowNodeLocked;

export function serializeFlowNodeLockedSubmitPayload(
  msg: FlowNodeLockedMessage & { flowNodeSignature: Signature },
): Uint8Array {
  return concat(
    buildFlowNodeLockedPayload(msg),
    signatureField(msg.flowNodeSignature, 'flowNodeSignature'),
  );
}

/**
 * Build the 84-byte pre-signature payload (msgType + uuid + flowNodePubkey + centralPubkey).
 * Used for flowNodeSignature.
 */
export function buildFlowNodeLockedPayload(params: {
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_FREEZE, 2),
    uuidField(params.uuid, 'uuid'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
  );
}

export const buildFlowNodeLockedPreSignPayload = buildFlowNodeLockedPayload;

export async function signFlowNodeLockedPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== MSG_SPECS.FLOW_NODE_FREEZE.preSignLength) {
    throw new Error(`Flow node locked payload must be ${MSG_SPECS.FLOW_NODE_FREEZE.preSignLength} bytes, got ${payload.length}`);
  }
  return toHex(await signData(payload, privateKeyHex)) as Signature;
}

/**
 * Build the 156-byte payload for central signature (前4项 + flowNodeSig + timestamp).
 * 协议定义完整流转节点冻结 = 2+16+33+33+64+8+64 = 220字节
 */
export function buildFlowNodeLockedFullPayload(params: {
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature: Signature;
  confirmTimestamp: bigint;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_FREEZE, 2),
    uuidField(params.uuid, 'uuid'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
    signatureField(params.flowNodeSignature, 'flowNodeSignature'),
    uint64BigIntField(params.confirmTimestamp, 'confirmTimestamp'),
  );
}
