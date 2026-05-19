import { ApiClient, ApiResponse } from './client';
import type { ReturningFlowRateResponseDTO } from './types';

export type ReturningFlowRateResponse = ApiResponse<ReturningFlowRateResponseDTO>;

export async function getReturningFlowRateById(
  client: ApiClient,
  params: {
    sourceId?: string;
    targetId: string;
    startTime?: number;
    endTime?: number;
    currencyType?: number;
  },
): Promise<ApiResponse<ReturningFlowRateResponseDTO>> {
  const query: Record<string, string> = { targetId: params.targetId };
  if (params.sourceId) query['sourceId'] = params.sourceId;
  if (params.startTime !== undefined) query['startTime'] = String(params.startTime);
  if (params.endTime !== undefined) query['endTime'] = String(params.endTime);
  if (params.currencyType !== undefined) query['currencyType'] = String(params.currencyType);
  return client.get<ReturningFlowRateResponseDTO>('/returning-flow-rate/by-id', query);
}

export async function getReturningFlowRateByPubkey(
  client: ApiClient,
  params: {
    source?: string;
    target: string;
    startTime?: number;
    endTime?: number;
    currencyType?: number;
  },
): Promise<ApiResponse<ReturningFlowRateResponseDTO>> {
  const query: Record<string, string> = { target: params.target };
  if (params.source) query['source'] = params.source;
  if (params.startTime !== undefined) query['startTime'] = String(params.startTime);
  if (params.endTime !== undefined) query['endTime'] = String(params.endTime);
  if (params.currencyType !== undefined) query['currencyType'] = String(params.currencyType);
  return client.get<ReturningFlowRateResponseDTO>('/returning-flow-rate/by-pubkey', query);
}
