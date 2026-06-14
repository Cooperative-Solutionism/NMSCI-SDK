import { ApiClient, ApiResponse } from './client';
import type { PageQuery, SliceResponseDTO, TransactionRecordMsgRaw } from './types';

export type TransactionRecordMsgResponse = ApiResponse<TransactionRecordMsgRaw>;
export type TransactionRecordMsgListResponse = ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>;

export interface TransactionRecordSearchFilters {
  consumeNodePubkey?: string;
  flowNodePubkey?: string;
  currencyType?: number;
  /** 微秒时间戳（含），过滤 confirmTimestamp。 */
  startTime?: number;
  /** 微秒时间戳（含），过滤 confirmTimestamp。 */
  endTime?: number;
}

export async function sendTransactionRecordMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<TransactionRecordMsgRaw>> {
  return client.postBinary<TransactionRecordMsgRaw>('/transaction-records', body);
}

export async function getTransactionRecordMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionRecordMsgRaw>> {
  return client.get<TransactionRecordMsgRaw>(`/transaction-records/${encodeURIComponent(id)}`);
}

/**
 * 交易记录检索集合根。所有过滤参数可选，全空即返回全量（分页）。
 */
export async function searchTransactionRecordMsgs(
  client: ApiClient,
  filters?: TransactionRecordSearchFilters,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return client.get<SliceResponseDTO<TransactionRecordMsgRaw>>('/transaction-records', {
    ...filters,
    ...pagination,
  });
}

export async function getTransactionRecordMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return searchTransactionRecordMsgs(client, { consumeNodePubkey }, pagination);
}

export async function getTransactionRecordMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return searchTransactionRecordMsgs(client, { flowNodePubkey }, pagination);
}

export async function getTransactionRecordMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return searchTransactionRecordMsgs(client, { consumeNodePubkey, flowNodePubkey }, pagination);
}
