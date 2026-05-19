import { ApiClient, ApiResponse } from './client';
import type { FlowNodeRegisterMsg } from './types';

export type FlowNodeRegisterMsgResponse = ApiResponse<FlowNodeRegisterMsg>;

export async function sendFlowNodeRegisterMsg(
  client: ApiClient,
  body: number[],
): Promise<ApiResponse<FlowNodeRegisterMsg>> {
  return client.post<FlowNodeRegisterMsg>('/flow-node-register-msg/send', body);
}

export async function getFlowNodeRegisterMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeRegisterMsg>> {
  return client.get<FlowNodeRegisterMsg>(`/flow-node-register-msg/id/${id}`);
}

export async function getFlowNodeRegisterMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeRegisterMsg>> {
  return client.get<FlowNodeRegisterMsg>(`/flow-node-register-msg/flow-node-pubkey/${flowNodePubkey}`);
}
