import { ApiClient, ApiResponse } from './client';
import { validateCompressedPubkey, validatePageQuery, validateUuid } from './query-validation';
import type { FlowNodeLockedMsgRaw, LockedMessageResponseDTO, PageQuery, SliceResponseDTO } from './types';

export type FlowNodeLockedMsgResponse = ApiResponse<FlowNodeLockedMsgRaw>;
export type FlowNodeLockedMsgListResponse = ApiResponse<SliceResponseDTO<FlowNodeLockedMsgRaw>>;
export type FlowNodeLockedMsgLookupResponse = ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsgRaw>>;

export async function sendFlowNodeLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<FlowNodeLockedMsgRaw>> {
  return client.postBinary<FlowNodeLockedMsgRaw>('/flow-node-locks', body);
}

export async function getFlowNodeLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<FlowNodeLockedMsgRaw>> {
  validateUuid(id, 'id');
  return client.get<FlowNodeLockedMsgRaw>(`/flow-node-locks/${encodeURIComponent(id)}`);
}

export async function listFlowNodeLockedMsgs(
  client: ApiClient,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<FlowNodeLockedMsgRaw>>> {
  validatePageQuery(pagination, 'flow-node-locks');
  return client.get<SliceResponseDTO<FlowNodeLockedMsgRaw>>('/flow-node-locks', pagination);
}

/**
 * 按流转节点公钥查询冻结状态，返回 { locked, lockedMsg } 包装。
 */
export async function getFlowNodeLockedMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsgRaw>>> {
  validateCompressedPubkey(flowNodePubkey, 'flowNodePubkey');
  return client.get<LockedMessageResponseDTO<FlowNodeLockedMsgRaw>>('/flow-node-locks/status', {
    flowNodePubkey,
  });
}
