import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, signatureToBytes, uuidToBytes, toBytesBigEndian, pubkeyToBytes, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { MSG_SPECS } from '../protocol/spec';

/** 220-byte Central Pubkey Empower message (协议定义为220字节) */
export interface CentralPubkeyEmpowerMessage {
  msgType: MsgType.CENTRAL_KEY_AUTH;
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature?: Signature;
  confirmTimestamp?: bigint;
  centralSignature?: Signature;
}

/**
 * Build the 220-byte serialized form.
 * If signatures are omitted, the last 128 bytes are zeroed.
 */
export function serializeCentralPubkeyEmpower(msg: CentralPubkeyEmpowerMessage): Uint8Array {
  const flowSig = msg.flowNodeSignature ? signatureToBytes(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null
    ? toBytesBigEndian(msg.confirmTimestamp, 8)
    : new Uint8Array(8);
  const centralSig = msg.centralSignature ? signatureToBytes(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_AUTH, 2), // 2 bytes
    uuidToBytes(msg.uuid),                          // 16 bytes
    pubkeyToBytes(msg.flowNodePubkey),              // 33 bytes
    pubkeyToBytes(msg.centralPubkey),               // 33 bytes
    flowSig,                                         // 64 bytes
    timestamp,                                       // 8 bytes
    centralSig,                                      // 64 bytes
  );
}

export const serializeCentralPubkeyEmpowerFullMessage = serializeCentralPubkeyEmpower;

export function serializeCentralPubkeyEmpowerSubmitPayload(
  msg: CentralPubkeyEmpowerMessage & { flowNodeSignature: Signature },
): Uint8Array {
  return concat(
    buildCentralPubkeyEmpowerPayload(msg),
    signatureToBytes(msg.flowNodeSignature),
  );
}

/**
 * Build the 84-byte pre-signature payload (msgType + uuid + flowNodePubkey + centralPubkey).
 * Used for flowNodeSignature.
 */
export function buildCentralPubkeyEmpowerPayload(params: {
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_AUTH, 2),
    uuidToBytes(params.uuid),
    pubkeyToBytes(params.flowNodePubkey),
    pubkeyToBytes(params.centralPubkey),
  );
}

export const buildCentralPubkeyEmpowerPreSignPayload = buildCentralPubkeyEmpowerPayload;

export async function signCentralPubkeyEmpowerPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== MSG_SPECS.CENTRAL_KEY_AUTH.preSignLength) {
    throw new Error(`Central pubkey empower payload must be ${MSG_SPECS.CENTRAL_KEY_AUTH.preSignLength} bytes, got ${payload.length}`);
  }
  return toHex(await signData(payload, privateKeyHex)) as Signature;
}

/**
 * Build the 156-byte payload for central signature (前4项 + flowNodeSig + timestamp).
 * 协议定义完整公证信息 = 2+16+33+33+64+8+64 = 220字节
 */
export function buildCentralPubkeyEmpowerFullPayload(params: {
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature: Signature;
  confirmTimestamp: bigint;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_AUTH, 2),
    uuidToBytes(params.uuid),
    pubkeyToBytes(params.flowNodePubkey),
    pubkeyToBytes(params.centralPubkey),
    signatureToBytes(params.flowNodeSignature),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}
