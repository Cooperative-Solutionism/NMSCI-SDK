import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, toBytesBigEndian, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { MSG_SPECS } from '../protocol/spec';
import { nBitsField, optionalSignatureField, pubkeyField, uintNumberField, uuidField } from './validation';

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
  const difficultyBytes = nBitsField(msg.registerDifficultyTarget, 'registerDifficultyTarget');
  const signature = optionalSignatureField(msg.flowNodeSignature, 'flowNodeSignature');

  return concat(
    toBytesBigEndian(MsgType.FLOW_NODE_REGISTRATION, 2), // 2 bytes
    uuidField(msg.uuid, 'uuid'),                           // 16 bytes
    difficultyBytes,                                         // 4 bytes
    uintNumberField(msg.nonce, 4, 'nonce'),                 // 4 bytes
    pubkeyField(msg.flowNodePubkey, 'flowNodePubkey'),      // 33 bytes
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
    uuidField(params.uuid, 'uuid'),
    nBitsField(params.registerDifficultyTarget, 'registerDifficultyTarget'),
    uintNumberField(params.nonce, 4, 'nonce'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
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
