import { ApiClient, ApiResponse } from './client';
import type { TransactionRecordMsg } from './types';

export type TransactionRecordMsgResponse = ApiResponse<TransactionRecordMsg>;
export type TransactionRecordMsgListResponse = ApiResponse<TransactionRecordMsg[]>;

export async function sendTransactionRecordMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<TransactionRecordMsg>> {
  return client.postBinary<TransactionRecordMsg>('/transaction-record-msg/send', body);
}

export async function getTransactionRecordMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionRecordMsg>> {
  return client.get<TransactionRecordMsg>(`/transaction-record-msg/id/${encodeURIComponent(id)}`);
}

export async function getTransactionRecordMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
): Promise<ApiResponse<TransactionRecordMsg[]>> {
  return client.get<TransactionRecordMsg[]>(`/transaction-record-msg/consume-node-pubkey/${encodeURIComponent(consumeNodePubkey)}`);
}

export async function getTransactionRecordMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionRecordMsg[]>> {
  return client.get<TransactionRecordMsg[]>(`/transaction-record-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}

export async function getTransactionRecordMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionRecordMsg[]>> {
  return client.get<TransactionRecordMsg[]>(`/transaction-record-msg/${encodeURIComponent(consumeNodePubkey)}/${encodeURIComponent(flowNodePubkey)}`);
}
