import type { Pubkey, Signature, HexString } from '../core/types';

export interface PageQuery {
  [key: string]: string | number | boolean | undefined;
  page?: number;
  size?: number;
}

export interface SliceResponseDTO<T> {
  content: T[];
  page: number;
  size: number;
  numberOfElements: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface LockedMessageResponseDTO<T> {
  locked: boolean;
  lockedMsg: T | null;
}

export interface FlowNodeStateResponseDTO {
  registered: boolean;
  authorized: boolean;
  locked: boolean;
  currentCentralPubkeyAuthorized: boolean;
}

export interface FlowNodeRegisterMsgRaw {
  id: string;
  msgType: number;
  registerDifficultyTarget: HexString;
  nonce: number;
  flowNodePubkey: Pubkey;
  flowNodeSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export type FlowNodeRegisterMsg = FlowNodeRegisterMsgRaw;

export interface CentralPubkeyEmpowerMsgRaw {
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

export interface CentralPubkeyEmpowerMsg extends Omit<CentralPubkeyEmpowerMsgRaw, 'confirmTimestamp'> {
  confirmTimestamp: bigint;
}

export interface CentralPubkeyLockedMsgRaw {
  id: string;
  msgType: number;
  centralPubkey: Pubkey;
  centralSignaturePre: Signature;
  confirmTimestamp: number;
  centralSignature: Signature;
  rawBytes: HexString;
  txid: HexString;
}

export interface CentralPubkeyLockedMsg extends Omit<CentralPubkeyLockedMsgRaw, 'confirmTimestamp'> {
  confirmTimestamp: bigint;
}

export interface FlowNodeLockedMsgRaw {
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

export interface FlowNodeLockedMsg extends Omit<FlowNodeLockedMsgRaw, 'confirmTimestamp'> {
  confirmTimestamp: bigint;
}

export interface TransactionRecordMsgRaw {
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

export interface TransactionRecordMsg extends Omit<TransactionRecordMsgRaw, 'amount' | 'confirmTimestamp'> {
  amount: bigint;
  confirmTimestamp: bigint;
}

export interface TransactionMountMsgRaw {
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

export interface TransactionMountMsg extends Omit<TransactionMountMsgRaw, 'confirmTimestamp'> {
  confirmTimestamp: bigint;
}

export interface BlockInfoRaw {
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
}

export interface BlockInfo extends Omit<BlockInfoRaw, 'height' | 'maxMsgTimestamp' | 'timestamp'> {
  height: bigint;
  maxMsgTimestamp: bigint;
  timestamp: bigint;
}

export interface ConsumeChainRaw {
  id: string;
  start: string;
  end: string;
  amount: number;
  currencyType: number;
  isLoop: boolean;
  tailMountTimestamp: number;
}

export interface ConsumeChain extends Omit<ConsumeChainRaw, 'amount' | 'tailMountTimestamp'> {
  amount: bigint;
  tailMountTimestamp: bigint;
}

export interface ConsumeChainEdgeRaw {
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

export interface ConsumeChainEdge extends Omit<ConsumeChainEdgeRaw, 'amount' | 'relatedTransactionMountTimestamp'> {
  amount: bigint;
  relatedTransactionMountTimestamp: bigint;
}

export interface ConsumeChainResponseDTORaw {
  consumeChain: ConsumeChainRaw;
  consumeChainEdges: ConsumeChainEdgeRaw[];
}

export interface ConsumeChainResponseDTO {
  consumeChain: ConsumeChain;
  consumeChainEdges: ConsumeChainEdge[];
}

export interface ReturningFlowRateResponseDTORaw {
  returningFlowRate: number;
  loopedAmount: number;
  unloopedAmount: number;
  targetTotalLoopedAmount: number;
  targetTotalUnloopedAmount: number;
  currencyType: number;
}

export type ReturningFlowRateResponseDTO = ReturningFlowRateResponseDTORaw;

export interface FlowNodeListItemDTORaw {
  id: string;
  flowNodePubkey: Pubkey;
  registered: boolean;
  authorized: boolean;
  locked: boolean;
  currentCentralPubkeyAuthorized: boolean;
}

export interface SystemParamsDTORaw {
  blockVersion: number;
  centralPubkey: Pubkey;
  registerDifficultyTargetNbits: number;
  registerDifficultyTargetNbitsHex: HexString;
  transactionDifficultyTargetNbits: number;
  transactionDifficultyTargetNbitsHex: HexString;
  sourceCodeZipHash: HexString;
  latestBlockHeight: number | null;
  latestBlockHash: HexString | null;
}

export interface SystemParamsDTO extends Omit<SystemParamsDTORaw, 'latestBlockHeight'> {
  latestBlockHeight: bigint | null;
}

export interface SystemStatusDTORaw {
  latestBlockHeight: number | null;
  latestBlockHash: HexString | null;
  latestBlockTimestamp: number | null;
  pendingMessageCount: number;
  oldestPendingConfirmTimestamp: number | null;
  /** 区块生成间隔，单位毫秒（固定 600000 = 10 分钟）。 */
  blockIntervalMs: number;
  currentCentralPubkeyLocked: boolean;
}

export interface SystemStatusDTO
  extends Omit<
    SystemStatusDTORaw,
    'latestBlockHeight' | 'latestBlockTimestamp' | 'pendingMessageCount' | 'oldestPendingConfirmTimestamp'
  > {
  latestBlockHeight: bigint | null;
  latestBlockTimestamp: bigint | null;
  pendingMessageCount: bigint;
  oldestPendingConfirmTimestamp: bigint | null;
}

export interface StorageStatusDTORaw {
  datDirectory: string;
  datFileCount: number;
  currentDatFileName: string | null;
  currentDatFileSizeBytes: number;
  totalDatBytes: number;
  datMaxSizePerFileBytes: number;
  currentDatUtilizationPct: number;
}

export interface StorageStatusDTO
  extends Omit<StorageStatusDTORaw, 'currentDatFileSizeBytes' | 'totalDatBytes' | 'datMaxSizePerFileBytes'> {
  currentDatFileSizeBytes: bigint;
  totalDatBytes: bigint;
  datMaxSizePerFileBytes: bigint;
}

export interface MsgTypeMetadataDTO {
  code: string;
  value: number;
  hexValue: string;
  /** 落库/上链最终字节数（含中心签名与确认时间戳）。 */
  size: number;
  /** 入站 POST 请求体字节数（中心签名之前）。 */
  inboundSize: number;
  sizeUnit: string;
  name: string;
}

export interface CurrencyTypeMetadataDTO {
  code: string;
  value: number;
  description: string;
  unit: string;
  unitDescription: string;
}

export interface BlockFormatMetadataDTO {
  magicNumber: number;
  magicNumberHex: string;
  genesisHash: HexString;
  hashSize: number;
  messageCountFieldSize: number;
  blockVersion: number;
  blockHeaderSize: number;
  blockMaxSizeBytes: number;
  blockDatMaxSizeBytes: number;
  datFilePrefix: string;
  datFileSuffix: string;
  datFileIndexWidth: number;
  sourceCodeZipPrefix: string;
  sourceCodeZipSuffix: string;
}

export interface DifficultyTarget {
  nbitsInt: number;
  nbitsHex: string;
  targetDecimal: string;
  targetHex: string;
}

export interface DifficultyMetadataDTO {
  register: DifficultyTarget;
  transaction: DifficultyTarget;
}
