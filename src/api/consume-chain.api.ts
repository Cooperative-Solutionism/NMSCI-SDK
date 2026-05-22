import { ApiClient, ApiResponse } from './client';
import type { ConsumeChainResponseDTO } from './types';

export type ConsumeChainResponse = ApiResponse<ConsumeChainResponseDTO>;
export type ConsumeChainListResponse = ApiResponse<ConsumeChainResponseDTO[]>;

export async function getConsumeChainByMountedTransaction(
  client: ApiClient,
  relatedTransactionMount: string,
): Promise<ApiResponse<ConsumeChainResponseDTO[]>> {
  return client.get<ConsumeChainResponseDTO[]>('/consume-chain/by-mounted-transaction', {
    relatedTransactionMount,
  });
}

export async function getConsumeChainById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<ConsumeChainResponseDTO>> {
  return client.get<ConsumeChainResponseDTO>(`/consume-chain/id/${encodeURIComponent(id)}`);
}

export async function getConsumeChainByStart(
  client: ApiClient,
  start: string,
  isLoop?: boolean,
): Promise<ApiResponse<ConsumeChainResponseDTO[]>> {
  const params: Record<string, string | boolean> = { start };
  if (isLoop !== undefined) params['isLoop'] = isLoop;
  return client.get<ConsumeChainResponseDTO[]>('/consume-chain/by-start', params);
}

export async function getConsumeChainByEnd(
  client: ApiClient,
  end: string,
  isLoop?: boolean,
): Promise<ApiResponse<ConsumeChainResponseDTO[]>> {
  const params: Record<string, string | boolean> = { end };
  if (isLoop !== undefined) params['isLoop'] = isLoop;
  return client.get<ConsumeChainResponseDTO[]>('/consume-chain/by-end', params);
}
