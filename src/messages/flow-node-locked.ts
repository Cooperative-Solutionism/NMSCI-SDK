import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, uuidToBytes, toBytesBigEndian } from '../core/encoding';

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
  const flowSig = msg.flowNodeSignature ? fromHex(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null
    ? toBytesBigEndian(msg.confirmTimestamp, 8)
    : new Uint8Array(8);
  const centralSig = msg.centralSignature ? fromHex(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_FREEZE, 2), // 2 bytes
    uuidToBytes(msg.uuid),                          // 16 bytes
    fromHex(msg.flowNodePubkey),                    // 33 bytes
    fromHex(msg.centralPubkey),                     // 33 bytes
    flowSig,                                         // 64 bytes
    timestamp,                                       // 8 bytes
    centralSig,                                      // 64 bytes
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
    uuidToBytes(params.uuid),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
  );
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
    uuidToBytes(params.uuid),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
    fromHex(params.flowNodeSignature),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}
