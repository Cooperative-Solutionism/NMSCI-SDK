import { ApiClient, ApiResponse } from './client';
import type { ConsumeChainResponseDTORaw } from './types';

export type ConsumeChainResponse = ApiResponse<ConsumeChainResponseDTORaw>;
export type ConsumeChainListResponse = ApiResponse<ConsumeChainResponseDTORaw[]>;

export async function getConsumeChainByMountedTransaction(
  client: ApiClient,
  relatedTransactionMount: string,
): Promise<ApiResponse<ConsumeChainResponseDTORaw[]>> {
  return client.get<ConsumeChainResponseDTORaw[]>('/consume-chain/by-mounted-transaction', {
    relatedTransactionMount,
  });
}

export async function getConsumeChainById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<ConsumeChainResponseDTORaw>> {
  return client.get<ConsumeChainResponseDTORaw>(`/consume-chain/id/${encodeURIComponent(id)}`);
}

export async function getConsumeChainByStart(
  client: ApiClient,
  start: string,
  isLoop?: boolean,
): Promise<ApiResponse<ConsumeChainResponseDTORaw[]>> {
  const params: Record<string, string | boolean> = { start };
  if (isLoop !== undefined) params['isLoop'] = isLoop;
  return client.get<ConsumeChainResponseDTORaw[]>('/consume-chain/by-start', params);
}

export async function getConsumeChainByEnd(
  client: ApiClient,
  end: string,
  isLoop?: boolean,
): Promise<ApiResponse<ConsumeChainResponseDTORaw[]>> {
  const params: Record<string, string | boolean> = { end };
  if (isLoop !== undefined) params['isLoop'] = isLoop;
  return client.get<ConsumeChainResponseDTORaw[]>('/consume-chain/by-end', params);
}
