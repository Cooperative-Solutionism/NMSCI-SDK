import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, nBitsToBytes, signatureToBytes, uuidToBytes, toBytesBigEndian, pubkeyToBytes, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { MSG_SPECS } from '../protocol/spec';

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
  const difficultyBytes = nBitsToBytes(msg.registerDifficultyTarget);
  const signature = msg.flowNodeSignature ? signatureToBytes(msg.flowNodeSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_REGISTRATION, 2), // 2 bytes
    uuidToBytes(msg.uuid),                                  // 16 bytes
    difficultyBytes,                                         // 4 bytes
    toBytesBigEndian(msg.nonce, 4),                         // 4 bytes
    pubkeyToBytes(msg.flowNodePubkey),                     // 33 bytes
    signature,                                              // 64 bytes
  );
}

export const serializeFlowNodeRegisterSubmitPayload = serializeFlowNodeRegister;
export const serializeFlowNodeRegisterFullMessage = serializeFlowNodeRegister;

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
    nBitsToBytes(params.registerDifficultyTarget),
    toBytesBigEndian(params.nonce, 4),
    pubkeyToBytes(params.flowNodePubkey),
  );
}

export const buildFlowNodeRegisterPreSignPayload = buildFlowNodeRegisterPayload;

export async function signFlowNodeRegisterPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== MSG_SPECS.FLOW_NODE_REGISTRATION.preSignLength) {
    throw new Error(`Flow node register payload must be ${MSG_SPECS.FLOW_NODE_REGISTRATION.preSignLength} bytes, got ${payload.length}`);
  }
  return toHex(await signData(payload, privateKeyHex)) as Signature;
}
