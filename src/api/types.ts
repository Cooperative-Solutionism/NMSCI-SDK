import type { Pubkey, Signature, UUID, HexString } from '../core/types';

export interface FlowNodeRegisterMsg {
  id: string;
  msgType: number;
  registerDifficultyTarget: HexString;
  nonce: number;
  flowNodePubkey: Pubkey;
  flowNodeSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface CentralPubkeyEmpowerMsg {
  id: string;
  msgType: number;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface CentralPubkeyLockedMsg {
  id: string;
  msgType: number;
  centralPubkey: Pubkey;
  centralSignaturePre: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface FlowNodeLockedMsg {
  id: string;
  msgType: number;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  flowNodeSignature: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface TransactionRecordMsg {
  id: string;
  msgType: number;
  amount: number;
  currencyType: number;
  transactionDifficultyTarget: HexString;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  consumeNodeSignature: Signature;
  flowNodeSignature: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface TransactionMountMsg {
  id: string;
  msgType: number;
  mountedTransactionRecordId: string;
  transactionDifficultyTarget: HexString;
  nonce: number;
  consumeNodePubkey: Pubkey;
  flowNodePubkey: Pubkey;
  centralPubkey: Pubkey;
  consumeNodeSignature: Signature;
  flowNodeSignature: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface BlockInfo {
  id: string;
  version: number;
  height: number;
  sourceCodeZipHash: HexString;
  previousBlockHash: HexString;
  merkleRoot: HexString;
  maxMsgTimestamp: number;
  registerDifficultyTarget: HexString;
  transactionDifficultyTarget: HexString;
  centralPubkey: Pubkey;
  timestamp: number;
  centralSignature: Signature;
  datFilepath: string;
  sourceCodeZipFilepath: string;
  rawBytes: HexString;
}

export interface ConsumeChain {
  id: string;
  start: string;
  end: string;
  amount: number;
  currencyType: number;
  isLoop: boolean;
  tailMountTimestamp: number;
}

export interface ConsumeChainEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  currencyType: number;
  chain: string;
  relatedTransactionRecord: string;
  relatedTransactionMount: string;
  relatedTransactionMountTimestamp: number;
  isLoop: boolean;
}

export interface ConsumeChainResponseDTO {
  consumeChain: ConsumeChain;
  consumeChainEdges: ConsumeChainEdge[];
}

export interface ReturningFlowRateResponseDTO {
  returningFlowRate: number;
  loopedAmount: number;
  unloopedAmount: number;
  targetTotalLoopedAmount: number;
  targetTotalUnloopedAmount: number;
  currencyType: number;
}
