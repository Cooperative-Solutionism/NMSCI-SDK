import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, uuidToBytes, toBytesBigEndian } from '../core/encoding';

/** 115-byte Central Pubkey Locked message */
export interface CentralPubkeyLockedMessage {
  msgType: MsgType.CENTRAL_KEY_FREEZE;
  uuid: UUID;
  centralPubkey: Pubkey;
  centralSignaturePre?: Signature;
  confirmTimestamp?: bigint;
  centralSignature?: Signature;
}

/**
 * Build the 115-byte serialized form.
 */
export function serializeCentralPubkeyLocked(msg: CentralPubkeyLockedMessage): Uint8Array {
  const sigPre = msg.centralSignaturePre ? fromHex(msg.centralSignaturePre) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null
    ? toBytesBigEndian(msg.confirmTimestamp, 8)
    : new Uint8Array(8);
  const centralSig = msg.centralSignature ? fromHex(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_FREEZE, 2), // 2 bytes
    uuidToBytes(msg.uuid),                              // 16 bytes
    fromHex(msg.centralPubkey),                        // 33 bytes
    sigPre,                                             // 64 bytes
    timestamp,                                           // 8 bytes
    centralSig,                                          // 64 bytes
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
    fromHex(params.centralPubkey),
  );
}

/**
 * Build the 115-byte full payload (for centralSignature).
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
    fromHex(params.centralPubkey),
    fromHex(params.centralSignaturePre),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}
