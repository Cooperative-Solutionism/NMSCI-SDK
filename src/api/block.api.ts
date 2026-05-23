import { ApiClient, ApiResponse } from './client';
import type { BlockInfoRaw } from './types';

export type BlockInfoResponse = ApiResponse<BlockInfoRaw>;

export async function getLastBlock(client: ApiClient): Promise<ApiResponse<BlockInfoRaw>> {
  return client.get<BlockInfoRaw>('/block-chain/last');
}

export async function getBlockByHeight(client: ApiClient, height: number): Promise<ApiResponse<BlockInfoRaw>> {
  return client.get<BlockInfoRaw>(`/block-chain/height/${height}`);
}

export async function getBlockByHash(client: ApiClient, hash: string): Promise<ApiResponse<BlockInfoRaw>> {
  return client.get<BlockInfoRaw>(`/block-chain/hash/${encodeURIComponent(hash)}`);
}
