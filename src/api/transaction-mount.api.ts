import { ApiClient, ApiResponse } from './client';
import type { TransactionMountMsg } from './types';

export type TransactionMountMsgResponse = ApiResponse<TransactionMountMsg>;
export type TransactionMountMsgListResponse = ApiResponse<TransactionMountMsg[]>;

export async function sendTransactionMountMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<TransactionMountMsg>> {
  return client.postBinary<TransactionMountMsg>('/transaction-mount-msg/send', body);
}

export async function getTransactionMountMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionMountMsg>> {
  return client.get<TransactionMountMsg>(`/transaction-mount-msg/id/${encodeURIComponent(id)}`);
}

export async function getTransactionMountMsgByMountedTransactionRecordId(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<TransactionMountMsg>> {
  return client.get<TransactionMountMsg>(`/transaction-mount-msg/mounted-transaction-record-id/${encodeURIComponent(id)}`);
}

export async function getTransactionMountMsgByConsumeNodePubkey(
  client: ApiClient,
  consumeNodePubkey: string,
): Promise<ApiResponse<TransactionMountMsg[]>> {
  return client.get<TransactionMountMsg[]>(`/transaction-mount-msg/consume-node-pubkey/${encodeURIComponent(consumeNodePubkey)}`);
}

export async function getTransactionMountMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionMountMsg[]>> {
  return client.get<TransactionMountMsg[]>(`/transaction-mount-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}

export async function getTransactionMountMsgByBothPubkeys(
  client: ApiClient,
  consumeNodePubkey: string,
  flowNodePubkey: string,
): Promise<ApiResponse<TransactionMountMsg[]>> {
  return client.get<TransactionMountMsg[]>(`/transaction-mount-msg/${encodeURIComponent(consumeNodePubkey)}/${encodeURIComponent(flowNodePubkey)}`);
}
