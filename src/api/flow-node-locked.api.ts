import { ApiClient, ApiResponse } from './client';
import type { FlowNodeLockedMsg } from './types';

export type FlowNodeLockedMsgResponse = ApiResponse<FlowNodeLockedMsg>;

export async function sendFlowNodeLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<FlowNodeLockedMsg>> {
  return client.postBinary<FlowNodeLockedMsg>('/flow-node-locked-msg/send', body);
}

export async function getFlowNodeLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeLockedMsg>> {
  return client.get<FlowNodeLockedMsg>(`/flow-node-locked-msg/id/${id}`);
}

export async function getFlowNodeLockedMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeLockedMsg>> {
  return client.get<FlowNodeLockedMsg>(`/flow-node-locked-msg/flow-node-pubkey/${flowNodePubkey}`);
}
