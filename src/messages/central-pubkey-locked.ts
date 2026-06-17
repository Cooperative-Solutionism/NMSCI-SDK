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
  const sigPre = optionalSignatureField(msg.centralSignaturePre, 'centralSignaturePre');
  const timestamp = optionalUint64BigIntField(msg.confirmTimestamp, 'confirmTimestamp');
  const centralSig = optionalSignatureField(msg.centralSignature, 'centralSignature');

  return concat(
    toBytesBigEndian(MsgType.CENTRAL_KEY_FREEZE, 2), // 2 bytes
    uuidField(msg.uuid, 'uuid'),                       // 16 bytes
    pubkeyField(msg.centralPubkey, 'centralPubkey'),   // 33 bytes
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
    signatureField(msg.centralSignaturePre, 'centralSignaturePre'),
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
    uuidField(params.uuid, 'uuid'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
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
    uuidField(params.uuid, 'uuid'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
    signatureField(params.centralSignaturePre, 'centralSignaturePre'),
    uint64BigIntField(params.confirmTimestamp, 'confirmTimestamp'),
  );
}
