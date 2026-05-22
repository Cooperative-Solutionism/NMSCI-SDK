import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, nBitsToBytes, pubkeyToBytes, signatureToBytes, uuidToBytes, toBytesBigEndian, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { calculateTargetFromNBits, mineNonce } from '../core/pow';
import { MSG_SPECS } from '../protocol/spec';

/** 341-byte Transaction Mount message (协议定义为341字节) */
export interface TransactionMountMessage {
  msgType: MsgType.TRANSACTION_MOUNT;
  uuid: UUID;
  mountedTransactionRecordId: UUID;
  transactionDifficultyTarget: string;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  consumeNodeSignature?: Signature;
  flowNodeSignature?: Signature;
  confirmTimestamp?: bigint;
  centralSignature?: Signature;
}

export function serializeTransactionMount(msg: TransactionMountMessage): Uint8Array {
  const consumeSig = msg.consumeNodeSignature ? signatureToBytes(msg.consumeNodeSignature) : new Uint8Array(64);
  const flowSig = msg.flowNodeSignature ? signatureToBytes(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null ? toBytesBigEndian(msg.confirmTimestamp, 8) : new Uint8Array(8);
  const centralSig = msg.centralSignature ? signatureToBytes(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),
    uuidToBytes(msg.uuid),
    uuidToBytes(msg.mountedTransactionRecordId),
    nBitsToBytes(msg.transactionDifficultyTarget),
    toBytesBigEndian(msg.nonce, 4),
    pubkeyToBytes(msg.consumeNodePubkey),
    pubkeyToBytes(msg.flowNodePubkey),
    pubkeyToBytes(msg.centralPubkey),
    consumeSig,
    flowSig,
    timestamp,
    centralSig,
  );
}

export const serializeTransactionMountFullMessage = serializeTransactionMount;

export function serializeTransactionMountSubmitPayload(
  msg: TransactionMountMessage & {
    consumeNodeSignature: Signature;
    flowNodeSignature: Signature;
  },
): Uint8Array {
  return concat(
    buildTransactionMountPayload(msg),
    signatureToBytes(msg.consumeNodeSignature),
    signatureToBytes(msg.flowNodeSignature),
  );
}

/**
 * Build the 141-byte pre-signature payload (msgType + uuid + mountedTxId + difficulty + nonce + 3 pubkeys).
 * Used for consumeNodeSignature and flowNodeSignature.
 * 协议定义：前8项数据 = 2+16+16+4+4+33+33+33 = 141字节
 */
export function buildTransactionMountPayload(params: {
  uuid: UUID;
  mountedTransactionRecordId: UUID;
  transactionDifficultyTarget: string;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),
    uuidToBytes(params.uuid),
    uuidToBytes(params.mountedTransactionRecordId),
    nBitsToBytes(params.transactionDifficultyTarget),
    toBytesBigEndian(params.nonce, 4),
    pubkeyToBytes(params.consumeNodePubkey),
    pubkeyToBytes(params.flowNodePubkey),
    pubkeyToBytes(params.centralPubkey),
  );
}

export const buildTransactionMountPreSignPayload = buildTransactionMountPayload;

/**
 * Build the 277-byte payload for central signature (前8项 + consumeSig + flowSig + timestamp).
 * 协议定义完整交易挂载 = 141 + 64 + 64 + 8 + 64 = 341字节，中心签名对象为前277字节
 */
export function buildTransactionMountFullPayload(params: {
  uuid: UUID;
  mountedTransactionRecordId: UUID;
  transactionDifficultyTarget: string;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  consumeNodeSignature: Signature;
  flowNodeSignature: Signature;
  confirmTimestamp: bigint;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),
    uuidToBytes(params.uuid),
    uuidToBytes(params.mountedTransactionRecordId),
    nBitsToBytes(params.transactionDifficultyTarget),
    toBytesBigEndian(params.nonce, 4),
    pubkeyToBytes(params.consumeNodePubkey),
    pubkeyToBytes(params.flowNodePubkey),
    pubkeyToBytes(params.centralPubkey),
    signatureToBytes(params.consumeNodeSignature),
    signatureToBytes(params.flowNodeSignature),
    toBytesBigEndian(params.confirmTimestamp, 8),
  );
}

/**
 * Mine the PoW nonce for a transaction mount.
 * The nonce field occupies bytes 38-41 of the 141-byte payload.
 */
export async function mineTransactionMountNonce(
  noncePrefix: Uint8Array,
  nonceSuffix: Uint8Array,
  difficultyTargetHex: string,
  onProgress?: (attempts: number, hashHex: string, nonce: number) => void,
): Promise<number> {
  const targetHex = calculateTargetFromNBits(difficultyTargetHex);
  return mineNonce(noncePrefix, nonceSuffix, targetHex, onProgress);
}

export async function signTransactionMountPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== MSG_SPECS.TRANSACTION_MOUNT.preSignLength) {
    throw new Error(`Mount payload must be ${MSG_SPECS.TRANSACTION_MOUNT.preSignLength} bytes, got ${payload.length}`);
  }
  const sig = await signData(payload, privateKeyHex);
  return toHex(sig) as Signature;
}
