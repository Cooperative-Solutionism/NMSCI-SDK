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
  const consumeSig = optionalSignatureField(msg.consumeNodeSignature, 'consumeNodeSignature');
  const flowSig = optionalSignatureField(msg.flowNodeSignature, 'flowNodeSignature');
  const timestamp = optionalUint64BigIntField(msg.confirmTimestamp, 'confirmTimestamp');
  const centralSig = optionalSignatureField(msg.centralSignature, 'centralSignature');

  return concat(
    toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),
    uuidField(msg.uuid, 'uuid'),
    uuidField(msg.mountedTransactionRecordId, 'mountedTransactionRecordId'),
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

export const serializeTransactionMountFullMessage = serializeTransactionMount;

export function serializeTransactionMountSubmitPayload(
  msg: TransactionMountMessage & {
    consumeNodeSignature: Signature;
    flowNodeSignature: Signature;
  },
): Uint8Array {
  return concat(
    buildTransactionMountPayload(msg),
    signatureField(msg.consumeNodeSignature, 'consumeNodeSignature'),
    signatureField(msg.flowNodeSignature, 'flowNodeSignature'),
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
    uuidField(params.uuid, 'uuid'),
    uuidField(params.mountedTransactionRecordId, 'mountedTransactionRecordId'),
    nBitsField(params.transactionDifficultyTarget, 'transactionDifficultyTarget'),
    uintNumberField(params.nonce, 4, 'nonce'),
    pubkeyField(params.consumeNodePubkey, 'consumeNodePubkey'),
    pubkeyField(params.flowNodePubkey, 'flowNodePubkey'),
    pubkeyField(params.centralPubkey, 'centralPubkey'),
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
    uuidField(params.uuid, 'uuid'),
    uuidField(params.mountedTransactionRecordId, 'mountedTransactionRecordId'),
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
