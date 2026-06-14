import { ApiClient, ApiResponse } from './client';
import type { PageQuery, SliceResponseDTO, TransactionMountMsgRaw } from './types';

export type TransactionMountMsgResponse = ApiResponse<TransactionMountMsgRaw>;
export type TransactionMountMsgListResponse = ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>;

export interface TransactionMountSearchFilters {
  consumeNodePubkey?: string;
  flowNodePubkey?: string;
  mountedTransactionRecordId?: string;
  /** 微秒时间戳（含），过滤 confirmTimestamp。 */
  startTime?: number;
  /** 微秒时间戳（含），过滤 confirmTimestamp。 */
  endTime?: number;
}

export async function sendTransactionMountMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<TransactionMountMsgRaw>> {
  return client.postBinary<TransactionMountMsgRaw>('/transaction-mounts', body);
}

export async function getTransactionMountMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionMountMsgRaw>> {
  return client.get<TransactionMountMsgRaw>(`/transaction-mounts/${encodeURIComponent(id)}`);
}

/**
 * 交易挂载检索集合根。所有过滤参数可选，全空即返回全量（分页）。
 */
export async function searchTransactionMountMsgs(
  client: ApiClient,
  filters?: TransactionMountSearchFilters,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  return client.get<SliceResponseDTO<TransactionMountMsgRaw>>('/transaction-mounts', {
    ...filters,
    ...pagination,
  });
}

/**
 * 按被挂载的交易记录 ID 查询挂载信息。后端为集合过滤，返回分页 Slice
 * （命中为空时返回空集合 + 200，而非旧版的 404 单对象）。
 */
export async function getTransactionMountMsgByMountedTransactionRecordId(
  client: ApiClient,
  mountedTransactionRecordId: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  return searchTransactionMountMsgs(client, { mountedTransactionRecordId }, pagination);
}

export async function getTransactionMountMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  return searchTransactionMountMsgs(client, { consumeNodePubkey }, pagination);
}

export async function getTransactionMountMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  return searchTransactionMountMsgs(client, { flowNodePubkey }, pagination);
}

export async function getTransactionMountMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  return searchTransactionMountMsgs(client, { consumeNodePubkey, flowNodePubkey }, pagination);
}
