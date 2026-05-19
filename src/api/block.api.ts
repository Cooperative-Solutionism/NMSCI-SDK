import { ApiClient, ApiResponse } from './client';
import type { BlockInfo } from './types';

export type BlockInfoResponse = ApiResponse<BlockInfo>;

export async function getLastBlock(client: ApiClient): Promise<ApiResponse<BlockInfo>> {
  return client.get<BlockInfo>('/block-chain/last');
}

export async function getBlockByHeight(client: ApiClient, height: number): Promise<ApiResponse<BlockInfo>> {
  return client.get<BlockInfo>(`/block-chain/height/${height}`);
}

export async function getBlockByHash(client: ApiClient, hash: string): Promise<ApiResponse<BlockInfo>> {
  return client.get<BlockInfo>(`/block-chain/hash/${hash}`);
}
