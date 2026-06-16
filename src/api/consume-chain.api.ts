import { ApiClient, ApiResponse, type QueryParams } from './client';
import type {
  ConsumeChainEdgeRaw,
  ConsumeChainResponseDTORaw,
  PageQuery,
  SliceResponseDTO,
} from './types';

export type ConsumeChainResponse = ApiResponse<ConsumeChainResponseDTORaw>;
export type ConsumeChainListResponse = ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>;
export type ConsumeChainEdgeListResponse = ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>;

export interface ConsumeChainQuery extends PageQuery {
  isLoop?: boolean;
}

/**
 * 消费链集合根过滤参数。id 模式（startId/endId/nodeId）与 pubkey 模式
 * （startPubkey/endPubkey/nodePubkey）不可混用，混用后端返回 400。
 */
export interface ConsumeChainQueryFilters extends PageQuery {
  startId?: string;
  endId?: string;
  nodeId?: string;
  startPubkey?: string;
  endPubkey?: string;
  nodePubkey?: string;
  isLoop?: boolean;
  mountedTransactionId?: string;
}

interface ConsumeChainEdgeBaseQuery extends PageQuery {
  currencyType?: number;
  /** 微秒时间戳。 */
  startTime?: number;
  /** 微秒时间戳。 */
  endTime?: number;
}

/** 消费链边查询参数。target 必填（id 或 pubkey 二选一），不可混用。 */
export type ConsumeChainEdgeQuery =
  | (ConsumeChainEdgeBaseQuery & {
      targetId: string;
      sourceId?: string;
      targetPubkey?: never;
      sourcePubkey?: never;
    })
  | (ConsumeChainEdgeBaseQuery & {
      targetPubkey: string;
      sourcePubkey?: string;
      targetId?: never;
      sourceId?: never;
    });

export async function getConsumeChainById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<ConsumeChainResponseDTORaw>> {
  return client.get<ConsumeChainResponseDTORaw>(`/consume-chains/${encodeURIComponent(id)}`);
}

/**
 * 消费链集合根（分页）。按起点/终点/途经节点（id 或 pubkey）或挂载交易过滤。
 */
export async function queryConsumeChains(
  client: ApiClient,
  filters?: ConsumeChainQueryFilters,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>('/consume-chains', {
    ...filters,
    ...pagination,
  });
}

export async function getConsumeChainByMountedTransaction(
  client: ApiClient,
  mountedTransactionId: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return queryConsumeChains(client, { mountedTransactionId }, pagination);
}

export async function getConsumeChainByStart(
  client: ApiClient,
  startId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    consumeChainQueryParams('startId', startId, query),
  );
}

export async function getConsumeChainByEnd(
  client: ApiClient,
  endId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    consumeChainQueryParams('endId', endId, query),
  );
}

export async function getConsumeChainByNode(
  client: ApiClient,
  nodeId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    consumeChainQueryParams('nodeId', nodeId, query),
  );
}

/**
 * 消费链边查询（流入某 target 的边集合，返回分页 Slice）。target 必填。
 */
export async function getConsumeChainEdges(
  client: ApiClient,
  params: ConsumeChainEdgeQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>> {
  return client.get<SliceResponseDTO<ConsumeChainEdgeRaw>>('/consume-chains/edges', { ...params });
}

function consumeChainQueryParams(
  key: 'startId' | 'endId' | 'nodeId',
  value: string,
  query?: boolean | ConsumeChainQuery,
): QueryParams {
  if (typeof query === 'boolean') {
    return { [key]: value, isLoop: query };
  }
  return { [key]: value, ...query };
}
