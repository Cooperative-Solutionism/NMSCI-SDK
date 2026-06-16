import { ApiClient, ApiResponse } from './client';
import { validatePageQuery, validateRequiredCompressedPubkey } from './query-validation';
import type { FlowNodeListItemDTORaw, FlowNodeStateResponseDTO, PageQuery, SliceResponseDTO } from './types';

export type FlowNodeStateResponse = ApiResponse<FlowNodeStateResponseDTO>;
export type FlowNodeListResponse = ApiResponse<SliceResponseDTO<FlowNodeListItemDTORaw>>;

export interface FlowNodeListQuery extends PageQuery {
  registered?: boolean;
  authorized?: boolean;
  locked?: boolean;
}

export async function getFlowNodeState(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeStateResponseDTO>> {
  validateRequiredCompressedPubkey(flowNodePubkey, 'flowNodePubkey');
  return client.get<FlowNodeStateResponseDTO>(`/flow-nodes/${encodeURIComponent(flowNodePubkey)}`);
}

export async function listFlowNodes(
  client: ApiClient,
  query?: FlowNodeListQuery,
): Promise<ApiResponse<SliceResponseDTO<FlowNodeListItemDTORaw>>> {
  validatePageQuery(query, 'flow-nodes');
  return client.get<SliceResponseDTO<FlowNodeListItemDTORaw>>('/flow-nodes', query);
}
