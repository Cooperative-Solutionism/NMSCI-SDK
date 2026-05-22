import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, nBitsToBytes, pubkeyToBytes, signatureToBytes, toHex, uuidToBytes, toBytesBigEndian } from '../core/encoding';
import { signData } from '../core/crypto';
import { calculateTargetFromNBits, mineNonce } from '../core/pow';

/** 335-byte Transaction Record message (协议定义为335字节) */
export interface TransactionRecordMessage {
  msgType: MsgType.TRANSACTION_RECORD;
  uuid: UUID;
  amount: bigint;
  currencyType: number;
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

export function serializeTransactionRecord(msg: TransactionRecordMessage): Uint8Array {
  const consumeSig = msg.consumeNodeSignature ? signatureToBytes(msg.consumeNodeSignature) : new Uint8Array(64);
  const flowSig = msg.flowNodeSignature ? signatureToBytes(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null ? toBytesBigEndian(msg.confirmTimestamp, 8) : new Uint8Array(8);
  const centralSig = msg.centralSignature ? signatureToBytes(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),
    uuidToBytes(msg.uuid),
    toBytesBigEndian(msg.amount, 8),
    toBytesBigEndian(msg.currencyType, 2),
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

export const serializeTransactionRecordFullMessage = serializeTransactionRecord;

export function serializeTransactionRecordSubmitPayload(
  msg: TransactionRecordMessage & {
    consumeNodeSignature: Signature;
    flowNodeSignature: Signature;
  },
): Uint8Array {
  return concat(
    buildTransactionRecordPayload(msg),
    signatureToBytes(msg.consumeNodeSignature),
    signatureToBytes(msg.flowNodeSignature),
  );
}

/**
 * Build the 135-byte pre-signature payload (msgType + uuid + amount + currencyType + difficulty + nonce + 3 pubkeys).
 * Used for consumeNodeSignature and flowNodeSignature.
 * 协议定义：前9项数据 = 2+16+8+2+4+4+33+33+33 = 135字节
 */
export function buildTransactionRecordPayload(params: {
  uuid: UUID;
  amount: bigint;
  currencyType: number;
  transactionDifficultyTarget: string;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
}): Uint8Array {
  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),
    uuidToBytes(params.uuid),
    toBytesBigEndian(params.amount, 8),
    toBytesBigEndian(params.currencyType, 2),
    nBitsToBytes(params.transactionDifficultyTarget),
    toBytesBigEndian(params.nonce, 4),
    pubkeyToBytes(params.consumeNodePubkey),
    pubkeyToBytes(params.flowNodePubkey),
    pubkeyToBytes(params.centralPubkey),
  );
}

/**
 * Build the 271-byte payload for central signature (前9项 + consumeSig + flowSig + timestamp).
 * 协议定义完整交易记录 = 135 + 64 + 64 + 8 + 64 = 335字节，中心签名对象为前271字节
 */
export function buildTransactionRecordFullPayload(params: {
  uuid: UUID;
  amount: bigint;
  currencyType: number;
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
    toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),
    uuidToBytes(params.uuid),
    toBytesBigEndian(params.amount, 8),
    toBytesBigEndian(params.currencyType, 2),
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
 * Mine the PoW nonce for a transaction record.
 * The nonce field occupies bytes 32-35 of the 135-byte payload.
 */
export async function mineTransactionRecordNonce(
  noncePrefix: Uint8Array,
  nonceSuffix: Uint8Array,
  difficultyTargetHex: string,
  onProgress?: (attempts: number, hashHex: string, nonce: number) => void,
): Promise<number> {
  const targetHex = calculateTargetFromNBits(difficultyTargetHex);
  return mineNonce(noncePrefix, nonceSuffix, targetHex, onProgress);
}

export async function signTransactionRecordPayload(
  payload: Uint8Array,
  privateKeyHex: string,
): Promise<Signature> {
  if (payload.length !== 135) throw new Error(`Transaction Record payload must be 135 bytes, got ${payload.length}`);
  const sig = await signData(payload, privateKeyHex);
  return toHex(sig) as Signature;
}
