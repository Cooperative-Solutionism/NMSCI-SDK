import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, toHex, uuidToBytes, toBytesBigEndian } from '../core/encoding';

/** 123-byte Flow Node Register message */
export interface FlowNodeRegisterMessage {
  msgType: MsgType.FLOW_NODE_REGISTRATION;
  uuid: UUID;
  registerDifficultyTarget: string;
  nonce: number;
  flowNodePubkey: Pubkey;
  flowNodeSignature?: Signature;
}

/**
 * Build the 123-byte serialized form.
 * If flowNodeSignature is omitted, the last 64 bytes are zeroed.
 */
export function serializeFlowNodeRegister(msg: FlowNodeRegisterMessage): Uint8Array {
  const difficultyBytes = fromHex(msg.registerDifficultyTarget.padStart(8, '0'));
  const signature = msg.flowNodeSignature ? fromHex(msg.flowNodeSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_REGISTRATION, 2), // 2 bytes
    uuidToBytes(msg.uuid),                                  // 16 bytes
    difficultyBytes,                                         // 4 bytes
    toBytesBigEndian(msg.nonce, 4),                         // 4 bytes
    fromHex(msg.flowNodePubkey),                           // 33 bytes
    signature,                                              // 64 bytes
  );
}

/**
 * Build the 59-byte pre-signature payload (msgType + uuid + difficulty + nonce + pubkey).
 * Used for signing and PoW validation.
 */
export function buildFlowNodeRegisterPayload(params: {
  uuid: UUID;
  registerDifficultyTarget: string;
  nonce: number;
  flowNodePubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_REGISTRATION, 2),
    uuidToBytes(params.uuid),
    fromHex(params.registerDifficultyTarget.padStart(8, '0')),
    toBytesBigEndian(params.nonce, 4),
    fromHex(params.flowNodePubkey),
  );
}
