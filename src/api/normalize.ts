import type { ApiResponse } from './client';
import type {
  BlockInfo,
  BlockInfoRaw,
  CentralPubkeyEmpowerMsg,
  CentralPubkeyEmpowerMsgRaw,
  CentralPubkeyLockedMsg,
  CentralPubkeyLockedMsgRaw,
  ConsumeChain,
  ConsumeChainEdge,
  ConsumeChainEdgeRaw,
  ConsumeChainRaw,
  ConsumeChainResponseDTO,
  ConsumeChainResponseDTORaw,
  FlowNodeLockedMsg,
  FlowNodeLockedMsgRaw,
  FlowNodeRegisterMsg,
  FlowNodeRegisterMsgRaw,
  LockedMessageResponseDTO,
  ReturningFlowRateResponseDTO,
  ReturningFlowRateResponseDTORaw,
  SliceResponseDTO,
  TransactionMountMsg,
  TransactionMountMsgRaw,
  TransactionRecordMsg,
  TransactionRecordMsgRaw,
} from './types';

export function normalizeApiResponse<Raw, Normalized>(
  response: ApiResponse<Raw>,
  normalizeData: (data: Raw) => Normalized,
): ApiResponse<Normalized> {
  return {
    ...response,
    data: normalizeData(response.data),
  };
}

export function normalizeApiResponseList<Raw, Normalized>(
  response: ApiResponse<Raw[]>,
  normalizeData: (data: Raw) => Normalized,
): ApiResponse<Normalized[]> {
  return normalizeApiResponse(response, items => items.map(normalizeData));
}

export function normalizeApiResponseSlice<Raw, Normalized>(
  response: ApiResponse<SliceResponseDTO<Raw>>,
  normalizeData: (data: Raw) => Normalized,
): ApiResponse<SliceResponseDTO<Normalized>> {
  return normalizeApiResponse(response, slice => ({
    ...slice,
    content: slice.content.map(normalizeData),
  }));
}

export function normalizeLockedMessageResponseDTO<Raw, Normalized>(
  raw: LockedMessageResponseDTO<Raw>,
  normalizeData: (data: Raw) => Normalized,
): LockedMessageResponseDTO<Normalized> {
  return {
    locked: raw.locked,
    lockedMsg: raw.lockedMsg === null ? null : normalizeData(raw.lockedMsg),
  };
}

export function normalizeFlowNodeRegisterMsg(raw: FlowNodeRegisterMsgRaw): FlowNodeRegisterMsg {
  return raw;
}

export function normalizeCentralPubkeyEmpowerMsg(raw: CentralPubkeyEmpowerMsgRaw): CentralPubkeyEmpowerMsg {
  return {
    ...raw,
    confirmTimestamp: toSafeBigInt(raw.confirmTimestamp, 'CentralPubkeyEmpowerMsg.confirmTimestamp'),
  };
}

export function normalizeCentralPubkeyLockedMsg(raw: CentralPubkeyLockedMsgRaw): CentralPubkeyLockedMsg {
  return {
    ...raw,
    confirmTimestamp: toSafeBigInt(raw.confirmTimestamp, 'CentralPubkeyLockedMsg.confirmTimestamp'),
  };
}

export function normalizeFlowNodeLockedMsg(raw: FlowNodeLockedMsgRaw): FlowNodeLockedMsg {
  return {
    ...raw,
    confirmTimestamp: toSafeBigInt(raw.confirmTimestamp, 'FlowNodeLockedMsg.confirmTimestamp'),
  };
}

export function normalizeTransactionRecordMsg(raw: TransactionRecordMsgRaw): TransactionRecordMsg {
  return {
    ...raw,
    amount: toSafeBigInt(raw.amount, 'TransactionRecordMsg.amount'),
    confirmTimestamp: toSafeBigInt(raw.confirmTimestamp, 'TransactionRecordMsg.confirmTimestamp'),
  };
}

export function normalizeTransactionMountMsg(raw: TransactionMountMsgRaw): TransactionMountMsg {
  return {
    ...raw,
    confirmTimestamp: toSafeBigInt(raw.confirmTimestamp, 'TransactionMountMsg.confirmTimestamp'),
  };
}

export function normalizeBlockInfo(raw: BlockInfoRaw): BlockInfo {
  return {
    ...raw,
    height: toSafeBigInt(raw.height, 'BlockInfo.height'),
    maxMsgTimestamp: toSafeBigInt(raw.maxMsgTimestamp, 'BlockInfo.maxMsgTimestamp'),
    timestamp: toSafeBigInt(raw.timestamp, 'BlockInfo.timestamp'),
  };
}

export function normalizeConsumeChain(raw: ConsumeChainRaw): ConsumeChain {
  return {
    ...raw,
    amount: toSafeBigInt(raw.amount, 'ConsumeChain.amount'),
    tailMountTimestamp: toSafeBigInt(raw.tailMountTimestamp, 'ConsumeChain.tailMountTimestamp'),
  };
}

export function normalizeConsumeChainEdge(raw: ConsumeChainEdgeRaw): ConsumeChainEdge {
  return {
    ...raw,
    amount: toSafeBigInt(raw.amount, 'ConsumeChainEdge.amount'),
    relatedTransactionMountTimestamp: toSafeBigInt(
      raw.relatedTransactionMountTimestamp,
      'ConsumeChainEdge.relatedTransactionMountTimestamp',
    ),
  };
}

export function normalizeConsumeChainResponseDTO(raw: ConsumeChainResponseDTORaw): ConsumeChainResponseDTO {
  return {
    consumeChain: normalizeConsumeChain(raw.consumeChain),
    consumeChainEdges: raw.consumeChainEdges.map(normalizeConsumeChainEdge),
  };
}

export function normalizeReturningFlowRateResponseDTO(
  raw: ReturningFlowRateResponseDTORaw,
): ReturningFlowRateResponseDTO {
  return raw;
}

function toSafeBigInt(value: number, fieldName: string): bigint {
  if (!Number.isInteger(value)) {
    throw new Error(`${fieldName} must be an integer number, got ${value}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${fieldName} exceeds Number.MAX_SAFE_INTEGER; use raw JSON as string-compatible transport before normalizing`);
  }
  return BigInt(value);
}
