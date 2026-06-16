import { ApiClient, ApiResponse } from './client';
import { validateHexString } from './query-validation';
import type { BlockInfoRaw } from './types';

export type BlockInfoResponse = ApiResponse<BlockInfoRaw>;

export async function getLastBlock(client: ApiClient): Promise<ApiResponse<BlockInfoRaw>> {
  return client.get<BlockInfoRaw>('/blocks/latest');
}

export async function getBlockByHeight(client: ApiClient, height: number): Promise<ApiResponse<BlockInfoRaw>> {
  return client.get<BlockInfoRaw>(`/blocks/${height}`);
}

export async function getBlockByHash(client: ApiClient, hash: string): Promise<ApiResponse<BlockInfoRaw>> {
  validateHexString(hash, 'hash', 32);
  return client.get<BlockInfoRaw>('/blocks', { hash });
}
