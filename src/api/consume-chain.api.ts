import { ApiClient, ApiResponse, type QueryParams } from './client';
import type { ConsumeChainResponseDTORaw, PageQuery, SliceResponseDTO } from './types';

export type ConsumeChainResponse = ApiResponse<ConsumeChainResponseDTORaw>;
export type ConsumeChainListResponse = ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>;

export interface ConsumeChainQuery extends PageQuery {
  isLoop?: boolean;
}

export async function getConsumeChainByMountedTransaction(
  client: ApiClient,
  relatedTransactionMount: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>('/consume-chain/by-mounted-transaction', {
    relatedTransactionMount,
    ...pagination,
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
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chain/by-start',
    consumeChainQueryParams('start', start, query),
  );
}

export async function getConsumeChainByEnd(
  client: ApiClient,
  end: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chain/by-end',
    consumeChainQueryParams('end', end, query),
  );
}

function consumeChainQueryParams(
  key: 'start' | 'end',
  value: string,
  query?: boolean | ConsumeChainQuery,
): QueryParams {
  if (typeof query === 'boolean') {
    return { [key]: value, isLoop: query };
  }
  return { [key]: value, ...query };
}
