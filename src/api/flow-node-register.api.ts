import { ApiClient, ApiResponse } from './client';
import type { FlowNodeRegisterMsgRaw, PageQuery, SliceResponseDTO } from './types';

export type FlowNodeRegisterMsgResponse = ApiResponse<FlowNodeRegisterMsgRaw>;
export type FlowNodeRegisterMsgListResponse = ApiResponse<SliceResponseDTO<FlowNodeRegisterMsgRaw>>;

export interface FlowNodeRegisterMsgListQuery extends PageQuery {
  flowNodePubkey?: string;
}

export async function sendFlowNodeRegisterMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<FlowNodeRegisterMsgRaw>> {
  return client.postBinary<FlowNodeRegisterMsgRaw>('/flow-node-registrations', body);
}

export async function getFlowNodeRegisterMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeRegisterMsgRaw>> {
  return client.get<FlowNodeRegisterMsgRaw>(`/flow-node-registrations/${encodeURIComponent(id)}`);
}

export async function listFlowNodeRegisterMsgs(
  client: ApiClient,
  query?: FlowNodeRegisterMsgListQuery,
): Promise<ApiResponse<SliceResponseDTO<FlowNodeRegisterMsgRaw>>> {
  return client.get<SliceResponseDTO<FlowNodeRegisterMsgRaw>>('/flow-node-registrations', query);
}

/**
 * 按流转节点公钥查询注册信息。后端集合根返回分页 Slice（不再是单对象）。
 */
export async function getFlowNodeRegisterMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<FlowNodeRegisterMsgRaw>>> {
  return listFlowNodeRegisterMsgs(client, { flowNodePubkey, ...pagination });
}
