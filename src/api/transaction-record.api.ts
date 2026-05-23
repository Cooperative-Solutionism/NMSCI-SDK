import { ApiClient, ApiResponse } from './client';
import type { TransactionRecordMsgRaw } from './types';

export type TransactionRecordMsgResponse = ApiResponse<TransactionRecordMsgRaw>;
export type TransactionRecordMsgListResponse = ApiResponse<TransactionRecordMsgRaw[]>;

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
): Promise<ApiResponse<TransactionRecordMsgRaw[]>> {
  return client.get<TransactionRecordMsgRaw[]>(`/transaction-record-msg/consume-node-pubkey/${encodeURIComponent(consumeNodePubkey)}`);
}

export async function getTransactionRecordMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionRecordMsgRaw[]>> {
  return client.get<TransactionRecordMsgRaw[]>(`/transaction-record-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}

export async function getTransactionRecordMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionRecordMsgRaw[]>> {
  return client.get<TransactionRecordMsgRaw[]>(`/transaction-record-msg/${encodeURIComponent(consumeNodePubkey)}/${encodeURIComponent(flowNodePubkey)}`);
}
