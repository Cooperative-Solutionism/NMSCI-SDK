import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, fromHex, toHex, uuidToBytes, toBytesBigEndian } from '../core/encoding';
import { signData } from '../core/crypto';
import { calculateTargetFromNBits, doubleSha256Hex, compareHex, mineNonce } from '../core/pow';

/** 263-byte Transaction Record message (协议定义为335字节) */
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
  const consumeSig = msg.consumeNodeSignature ? fromHex(msg.consumeNodeSignature) : new Uint8Array(64);
  const flowSig = msg.flowNodeSignature ? fromHex(msg.flowNodeSignature) : new Uint8Array(64);
  const timestamp = msg.confirmTimestamp != null ? toBytesBigEndian(msg.confirmTimestamp, 8) : new Uint8Array(8);
  const centralSig = msg.centralSignature ? fromHex(msg.centralSignature) : new Uint8Array(64);

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),
    uuidToBytes(msg.uuid),
    toBytesBigEndian(msg.amount, 8),
    toBytesBigEndian(msg.currencyType, 2),
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
 * Build the 141-byte pre-signature payload (msgType + uuid + amount + currencyType + difficulty + nonce + 3 pubkeys).
 * Used for consumeNodeSignature and flowNodeSignature.
 * 协议定义：前9项数据 = 2+16+8+2+4+4+33+33+33 = 141字节
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
    fromHex(params.transactionDifficultyTarget.padStart(8, '0')),
    toBytesBigEndian(params.nonce, 4),
    fromHex(params.consumeNodePubkey),
    fromHex(params.flowNodePubkey),
    fromHex(params.centralPubkey),
  );
}

/**
 * Build the 263-byte full payload (for centralSignature).
 * 协议定义完整交易记录 = 2+16+8+2+4+4+33+33+33+64+64+8+64 = 335字节
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
