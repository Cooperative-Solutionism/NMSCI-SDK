import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, toHex, uuidToBytes, toBytesBigEndian, bytesToUuid, bytesToUint16, bytesToBigInt64 } from '../core/encoding';

/** 148-byte Central Pubkey Empower message (协议定义为220字节) */
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
 * Build the 148-byte serialized form.
 * If signatures are omitted, the last 128 bytes are zeroed.
 */
export function serializeCentralPubkeyEmpower(msg: CentralPubkeyEmpowerMessage): Uint8Array {
  const flowSig = msg.flowNodeSignature ? fromHex(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null
    ? toBytesBigEndian(msg.confirmTimestamp, 8)
    : new Uint8Array(8);
  const centralSig = msg.centralSignature ? fromHex(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_AUTH, 2), // 2 bytes
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
export function buildCentralPubkeyEmpowerPayload(params: {
  uuid: UUID;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_AUTH, 2),
    uuidToBytes(params.uuid),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
  );
}

/**
 * Build the 148-byte full payload (msgType + uuid + flowNodePubkey + centralPubkey + flowSig + timestamp).
 * Used for centralSignature.
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
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
    fromHex(params.flowNodeSignature),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}
