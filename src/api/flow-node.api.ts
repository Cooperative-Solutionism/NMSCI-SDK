import { ApiClient, ApiResponse } from './client';
import type { FlowNodeStateResponseDTO } from './types';

export type FlowNodeStateResponse = ApiResponse<FlowNodeStateResponseDTO>;

export async function getFlowNodeState(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<FlowNodeStateResponseDTO>> {
  return client.get<FlowNodeStateResponseDTO>('/flow-node/state', { flowNodePubkey });
}
