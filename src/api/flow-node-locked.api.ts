import { ApiClient, ApiResponse } from './client';
import type { FlowNodeLockedMsgRaw } from './types';

export type FlowNodeLockedMsgResponse = ApiResponse<FlowNodeLockedMsgRaw>;

export async function sendFlowNodeLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<FlowNodeLockedMsgRaw>> {
  return client.postBinary<FlowNodeLockedMsgRaw>('/flow-node-locked-msg/send', body);
}

export async function getFlowNodeLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeLockedMsgRaw>> {
  return client.get<FlowNodeLockedMsgRaw>(`/flow-node-locked-msg/id/${encodeURIComponent(id)}`);
}

export async function getFlowNodeLockedMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeLockedMsgRaw>> {
  return client.get<FlowNodeLockedMsgRaw>(`/flow-node-locked-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}
