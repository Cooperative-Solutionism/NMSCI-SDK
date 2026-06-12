import { ApiClient, ApiResponse } from './client';
import type { PageQuery, SliceResponseDTO, TransactionRecordMsgRaw } from './types';

export type TransactionRecordMsgResponse = ApiResponse<TransactionRecordMsgRaw>;
export type TransactionRecordMsgListResponse = ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>;

export async function sendTransactionRecordMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<TransactionRecordMsgRaw>> {
  return client.postBinary<TransactionRecordMsgRaw>('/transaction-record-msg/send', body);
}

export async function getTransactionRecordMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionRecordMsgRaw>> {
  return client.get<TransactionRecordMsgRaw>(`/transaction-record-msg/id/${encodeURIComponent(id)}`);
}

export async function getTransactionRecordMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return client.get<SliceResponseDTO<TransactionRecordMsgRaw>>(
    `/transaction-record-msg/consume-node-pubkey/${encodeURIComponent(consumeNodePubkey)}`,
    pagination,
  );
}

export async function getTransactionRecordMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return client.get<SliceResponseDTO<TransactionRecordMsgRaw>>(
    `/transaction-record-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`,
    pagination,
  );
}

export async function getTransactionRecordMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>> {
  return client.get<SliceResponseDTO<TransactionRecordMsgRaw>>(
    `/transaction-record-msg/${encodeURIComponent(consumeNodePubkey)}/${encodeURIComponent(flowNodePubkey)}`,
    pagination,
  );
}
