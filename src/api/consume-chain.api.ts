import { ApiClient, ApiResponse, type QueryParams } from './client';
import {
  validateCompressedPubkey,
  validateNoIdPubkeyMix,
  validatePageQuery,
  validateRequiredTargetMode,
  validateTimeRange,
  validateUuid,
} from './query-validation';
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

const consumeChainNodeFilterKeys = ['startId', 'endId', 'nodeId', 'startPubkey', 'endPubkey', 'nodePubkey'] as const;
const consumeChainConvenienceForbiddenQueryKeys = [...consumeChainNodeFilterKeys, 'mountedTransactionId'] as const;

function validateConsumeChainFilters(filters?: ConsumeChainQueryFilters, pagination?: PageQuery): void {
  validatePageQuery(filters, 'consume-chains');
  validatePageQuery(pagination, 'consume-chains');
  const mergedFilters = { ...filters, ...pagination } as ConsumeChainQueryFilters;
  validatePageQuery(mergedFilters, 'consume-chains');
  if (!filters && !pagination) {
    return;
  }

  const hasNodeFilters = consumeChainNodeFilterKeys.some(key => mergedFilters[key] !== undefined);
  if (mergedFilters.mountedTransactionId !== undefined && hasNodeFilters) {
    throw new Error('mountedTransactionId cannot be combined with node filters');
  }

  validateNoIdPubkeyMix(
    mergedFilters as Record<string, unknown>,
    ['startId', 'endId', 'nodeId'],
    ['startPubkey', 'endPubkey', 'nodePubkey'],
    'consume-chains',
  );
  validateUuid(mergedFilters.startId, 'startId');
  validateUuid(mergedFilters.endId, 'endId');
  validateUuid(mergedFilters.nodeId, 'nodeId');
  validateUuid(mergedFilters.mountedTransactionId, 'mountedTransactionId');
  validateCompressedPubkey(mergedFilters.startPubkey, 'startPubkey');
  validateCompressedPubkey(mergedFilters.endPubkey, 'endPubkey');
  validateCompressedPubkey(mergedFilters.nodePubkey, 'nodePubkey');
}

function validateConsumeChainConvenienceQuery(query?: boolean | ConsumeChainQuery): void {
  if (!query || typeof query === 'boolean') {
    return;
  }

  const queryRecord = query as Record<string, unknown>;
  if (consumeChainConvenienceForbiddenQueryKeys.some(key => queryRecord[key] !== undefined)) {
    throw new Error('consume-chains convenience query cannot include selector filters');
  }

  validatePageQuery(query, 'consume-chains');
}

function validateConsumeChainEdgeQuery(params: ConsumeChainEdgeQuery): void {
  validatePageQuery(params, 'consume-chains/edges');
  validateTimeRange(params.startTime, params.endTime, 'consume-chains/edges');
  const mode = validateRequiredTargetMode(params as Record<string, unknown>, 'consume-chains/edges');
  if (mode === 'id') {
    validateUuid(params.targetId, 'targetId');
    validateUuid(params.sourceId, 'sourceId');
  } else {
    validateCompressedPubkey(params.targetPubkey, 'targetPubkey');
    validateCompressedPubkey(params.sourcePubkey, 'sourcePubkey');
  }
}

export async function getConsumeChainById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<ConsumeChainResponseDTORaw>> {
  validateUuid(id, 'id');
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
  validateConsumeChainFilters(filters, pagination);
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
  validateUuid(startId, 'startId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('startId', startId, query);
  validateConsumeChainFilters(params as ConsumeChainQueryFilters);
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    params,
  );
}

export async function getConsumeChainByEnd(
  client: ApiClient,
  endId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  validateUuid(endId, 'endId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('endId', endId, query);
  validateConsumeChainFilters(params as ConsumeChainQueryFilters);
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    params,
  );
}

export async function getConsumeChainByNode(
  client: ApiClient,
  nodeId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  validateUuid(nodeId, 'nodeId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('nodeId', nodeId, query);
  validateConsumeChainFilters(params as ConsumeChainQueryFilters);
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>(
    '/consume-chains',
    params,
  );
}

/**
 * 消费链边查询（流入某 target 的边集合，返回分页 Slice）。target 必填。
 */
export async function getConsumeChainEdges(
  client: ApiClient,
  params: ConsumeChainEdgeQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>> {
  validateConsumeChainEdgeQuery(params);
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
  const params: QueryParams = { [key]: value, ...query };
  params[key] = value;
  return params;
}
