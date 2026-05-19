import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, uuidToBytes, toBytesBigEndian, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { calculateTargetFromNBits, mineNonce } from '../core/pow';

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
  const consumeSig = msg.consumeNodeSignature ? fromHex(msg.consumeNodeSignature) : new Uint8Array(64);
  const flowSig = msg.flowNodeSignature ? fromHex(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null ? toBytesBigEndian(msg.confirmTimestamp, 8) : new Uint8Array(8);
  const centralSig = msg.centralSignature ? fromHex(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),
    uuidToBytes(msg.uuid),
    uuidToBytes(msg.mountedTransactionRecordId),
    fromHex(msg.transactionDifficultyTarget.padStart(8, '0')),
    toBytesBigEndian(msg.nonce, 4),
    fromHex(msg.consumeNodePubkey),
    fromHex(msg.flowNodePubkey),
    fromHex(msg.centralPubkey),
    consumeSig,
    flowSig,
    timestamp,
    centralSig,
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
    fromHex(params.transactionDifficultyTarget.padStart(8, '0')),
    toBytesBigEndian(params.nonce, 4),
    fromHex(params.consumeNodePubkey),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
  );
}

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
    fromHex(params.transactionDifficultyTarget.padStart(8, '0')),
    toBytesBigEndian(params.nonce, 4),
    fromHex(params.consumeNodePubkey),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
    fromHex(params.consumeNodeSignature),
    fromHex(params.flowNodeSignature),
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
  if (payload.length !== 141) throw new Error(`Mount payload must be 141 bytes, got ${payload.length}`);
  const sig = await signData(payload, privateKeyHex);
  return toHex(sig) as Signature;
}
