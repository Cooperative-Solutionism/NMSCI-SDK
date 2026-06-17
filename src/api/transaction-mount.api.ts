import { ApiClient, ApiResponse } from './client';
import {
  validateCompressedPubkey,
  validatePageQuery,
  validateRequiredCompressedPubkey,
  validateRequiredUuid,
  validateTimeRange,
  validateUuid,
} from './query-validation';
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

type TransactionMountSearchQuery = TransactionMountSearchFilters & PageQuery;

function validateTransactionMountSearchQuery(
  filters?: TransactionMountSearchFilters,
  pagination?: PageQuery,
): TransactionMountSearchQuery {
  validatePageQuery(filters as PageQuery | undefined, 'transaction-mounts');
  validatePageQuery(pagination, 'transaction-mounts');

  const query = { ...filters, ...pagination } as TransactionMountSearchQuery;
  validatePageQuery(query, 'transaction-mounts');
  validateCompressedPubkey(query.consumeNodePubkey, 'consumeNodePubkey');
  validateCompressedPubkey(query.flowNodePubkey, 'flowNodePubkey');
  validateUuid(query.mountedTransactionRecordId, 'mountedTransactionRecordId');
  validateTimeRange(query.startTime, query.endTime, 'transaction-mounts');
  return query;
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
  validateRequiredUuid(id, 'id');
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
  return client.get<SliceResponseDTO<TransactionMountMsgRaw>>(
    '/transaction-mounts',
    validateTransactionMountSearchQuery(filters, pagination),
  );
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
  validateRequiredUuid(mountedTransactionRecordId, 'mountedTransactionRecordId');
  return searchTransactionMountMsgs(client, { mountedTransactionRecordId }, pagination);
}

export async function getTransactionMountMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  validateRequiredCompressedPubkey(consumeNodePubkey, 'consumeNodePubkey');
  return searchTransactionMountMsgs(client, { consumeNodePubkey }, pagination);
}

export async function getTransactionMountMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  validateRequiredCompressedPubkey(flowNodePubkey, 'flowNodePubkey');
  return searchTransactionMountMsgs(client, { flowNodePubkey }, pagination);
}

export async function getTransactionMountMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>> {
  validateRequiredCompressedPubkey(consumeNodePubkey, 'consumeNodePubkey');
  validateRequiredCompressedPubkey(flowNodePubkey, 'flowNodePubkey');
  return searchTransactionMountMsgs(client, { consumeNodePubkey, flowNodePubkey }, pagination);
}
