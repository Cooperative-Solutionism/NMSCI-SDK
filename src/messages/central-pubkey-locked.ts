import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, signatureToBytes, uuidToBytes, toBytesBigEndian, pubkeyToBytes, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { MSG_SPECS } from '../protocol/spec';

/** 187-byte Central Pubkey Locked message (协议定义为187字节) */
export interface CentralPubkeyLockedMessage {
  msgType: MsgType.CENTRAL_KEY_FREEZE;
  uuid: UUID;
  centralPubkey: Pubkey;
  centralSignaturePre?: Signature;
  confirmTimestamp?: bigint;
  centralSignature?: Signature;
}

/**
 * Build the 187-byte serialized form.
 */
export function serializeCentralPubkeyLocked(msg: CentralPubkeyLockedMessage): Uint8Array {
  const sigPre = msg.centralSignaturePre ? signatureToBytes(msg.centralSignaturePre) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null
    ? toBytesBigEndian(msg.confirmTimestamp, 8)
    : new Uint8Array(8);
  const centralSig = msg.centralSignature ? signatureToBytes(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_FREEZE, 2), // 2 bytes
    uuidToBytes(msg.uuid),                              // 16 bytes
    pubkeyToBytes(msg.centralPubkey),                  // 33 bytes
    sigPre,                                             // 64 bytes
    timestamp,                                           // 8 bytes
    centralSig,                                          // 64 bytes
  );
}

export const serializeCentralPubkeyLockedFullMessage = serializeCentralPubkeyLocked;

export function serializeCentralPubkeyLockedSubmitPayload(
  msg: CentralPubkeyLockedMessage & { centralSignaturePre: Signature },
): Uint8Array {
  return concat(
    buildCentralPubkeyLockedPayload(msg),
    signatureToBytes(msg.centralSignaturePre),
  );
}

/**
 * Build the 51-byte pre-signature payload (msgType + uuid + centralPubkey).
 * Used for centralSignaturePre.
 */
export function buildCentralPubkeyLockedPayload(params: {
  uuid: UUID;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_FREEZE, 2),
    uuidToBytes(params.uuid),
    pubkeyToBytes(params.centralPubkey),
  );
}

export const buildCentralPubkeyLockedPreSignPayload = buildCentralPubkeyLockedPayload;

export async function signCentralPubkeyLockedPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== MSG_SPECS.CENTRAL_KEY_FREEZE.preSignLength) {
    throw new Error(`Central pubkey locked payload must be ${MSG_SPECS.CENTRAL_KEY_FREEZE.preSignLength} bytes, got ${payload.length}`);
  }
  return toHex(await signData(payload, privateKeyHex)) as Signature;
}

/**
 * Build the 123-byte payload for central signature (前3项 + centralSigPre + timestamp).
 * 协议定义完整冻结信息 = 2+16+33+64+8+64 = 187字节
 */
export function buildCentralPubkeyLockedFullPayload(params: {
  uuid: UUID;
  centralPubkey: Pubkey;
  centralSignaturePre: Signature;
  confirmTimestamp: bigint;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_FREEZE, 2),
    uuidToBytes(params.uuid),
    pubkeyToBytes(params.centralPubkey),
    signatureToBytes(params.centralSignaturePre),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}
