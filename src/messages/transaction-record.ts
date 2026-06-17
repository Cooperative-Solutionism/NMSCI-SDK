import { MsgType } from './types';
import type { Pubkey, Signature, UUID } from '../core/types';
import { concat, toBytesBigEndian, toHex } from '../core/encoding';
import { signData } from '../core/crypto';
import { calculateTargetFromNBits, mineNonce } from '../core/pow';
import { MSG_SPECS } from '../protocol/spec';
import {
  nBitsField,
  optionalSignatureField,
  optionalUint64BigIntField,
  pubkeyField,
  signatureField,
  uint64BigIntField,
  uintNumberField,
  uuidField,
} from './validation';

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
  const consumeSig = optionalSignatureField(msg.consumeNodeSignature, 'consumeNodeSignature');
  const flowSig = optionalSignatureField(msg.flowNodeSignature, 'flowNodeSignature');
  const timestamp = optionalUint64BigIntField(msg.confirmTimestamp, 'confirmTimestamp');
  const centralSig = optionalSignatureField(msg.centralSignature, 'centralSignature');

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),
    uuidField(msg.uuid, 'uuid'),
    uint64BigIntField(msg.amount, 'amount'),
    uintNumberField(msg.currencyType, 2, 'currencyType'),
    nBitsField(msg.transactionDifficultyTarget, 'transactionDifficultyTarget'),
    uintNumberField(msg.nonce, 4, 'nonce'),
    pubkeyField(msg.consumeNodePubkey, 'consumeNodePubkey'),
    pubkeyField(msg.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(msg.centralPubkey, 'centralPubkey'),
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
    signatureField(msg.consumeNodeSignature, 'consumeNodeSignature'),
    signatureField(msg.flowNodeSignature, 'flowNodeSignature'),
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
    uuidField(params.uuid, 'uuid'),
    uint64BigIntField(params.amount, 'amount'),
    uintNumberField(params.currencyType, 2, 'currencyType'),
    nBitsField(params.transactionDifficultyTarget, 'transactionDifficultyTarget'),
    uintNumberField(params.nonce, 4, 'nonce'),
    pubkeyField(params.consumeNodePubkey, 'consumeNodePubkey'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
  );
}

export const buildTransactionRecordPreSignPayload = buildTransactionRecordPayload;

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
    uuidField(params.uuid, 'uuid'),
    uint64BigIntField(params.amount, 'amount'),
    uintNumberField(params.currencyType, 2, 'currencyType'),
    nBitsField(params.transactionDifficultyTarget, 'transactionDifficultyTarget'),
    uintNumberField(params.nonce, 4, 'nonce'),
    pubkeyField(params.consumeNodePubkey, 'consumeNodePubkey'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
    signatureField(params.consumeNodeSignature, 'consumeNodeSignature'),
    signatureField(params.flowNodeSignature, 'flowNodeSignature'),
    uint64BigIntField(params.confirmTimestamp, 'confirmTimestamp'),
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
  if (payload.length !== MSG_SPECS.TRANSACTION_RECORD.preSignLength) {
    throw new Error(`Transaction Record payload must be ${MSG_SPECS.TRANSACTION_RECORD.preSignLength} bytes, got ${payload.length}`);
  }
  const sig = await signData(payload, privateKeyHex);
  return toHex(sig) as Signature;
}
