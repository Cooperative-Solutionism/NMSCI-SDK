import { ApiClient, ApiResponse } from './client';
import type { FlowNodeRegisterMsgRaw } from './types';

export type FlowNodeRegisterMsgResponse = ApiResponse<FlowNodeRegisterMsgRaw>;

export async function sendFlowNodeRegisterMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<FlowNodeRegisterMsgRaw>> {
  return client.postBinary<FlowNodeRegisterMsgRaw>('/flow-node-register-msg/send', body);
}

export async function getFlowNodeRegisterMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeRegisterMsgRaw>> {
  return client.get<FlowNodeRegisterMsgRaw>(`/flow-node-register-msg/id/${encodeURIComponent(id)}`);
}

export async function getFlowNodeRegisterMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeRegisterMsgRaw>> {
  return client.get<FlowNodeRegisterMsgRaw>(`/flow-node-register-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}
