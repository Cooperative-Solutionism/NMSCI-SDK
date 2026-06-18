import { ApiClient, ApiResponse, type QueryParams } from './client';
import {
  validateCompressedPubkey,
  validateNoIdPubkeyMix,
  validatePageQuery,
  validateRequiredCompressedPubkey,
  validateRequiredParams,
  validateRequiredTargetMode,
  validateRequiredUuid,
  validateTimeRange,
  validateUuid,
} from './query-validation';
import type {
  ConsumeChainEdgeRaw,
  ConsumeChainResponseDTORaw,
  PageQuery,
  PaginationQuery,
  SliceResponseDTO,
} from './types';

export type ConsumeChainResponse = ApiResponse<ConsumeChainResponseDTORaw>;
export type ConsumeChainListResponse = ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>;
export type ConsumeChainEdgeListResponse = ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>;

export interface ConsumeChainQuery extends PaginationQuery {
  isLoop?: boolean;
}

/**
 * 消费链集合根过滤参数。id 模式（startId/endId/nodeId）与 pubkey 模式
 * （startPubkey/endPubkey/nodePubkey）不可混用，混用后端返回 400。
 */
interface ConsumeChainQueryCommon extends PaginationQuery {
  isLoop?: boolean;
}

type ConsumeChainQueryFilterSelectors =
  | {
      startId: string;
      endId?: never;
      nodeId?: never;
      startPubkey?: never;
      endPubkey?: never;
      nodePubkey?: never;
      mountedTransactionId?: never;
    }
  | {
      endId: string;
      startId?: never;
      nodeId?: never;
      startPubkey?: never;
      endPubkey?: never;
      nodePubkey?: never;
      mountedTransactionId?: never;
    }
  | {
      nodeId: string;
      startId?: never;
      endId?: never;
      startPubkey?: never;
      endPubkey?: never;
      nodePubkey?: never;
      mountedTransactionId?: never;
    }
  | {
      startPubkey: string;
      endPubkey?: never;
      nodePubkey?: never;
      startId?: never;
      endId?: never;
      nodeId?: never;
      mountedTransactionId?: never;
    }
  | {
      endPubkey: string;
      startPubkey?: never;
      nodePubkey?: never;
      startId?: never;
      endId?: never;
      nodeId?: never;
      mountedTransactionId?: never;
    }
  | {
      nodePubkey: string;
      startPubkey?: never;
      endPubkey?: never;
      startId?: never;
      endId?: never;
      nodeId?: never;
      mountedTransactionId?: never;
    }
  | {
      mountedTransactionId: string;
      startId?: never;
      endId?: never;
      nodeId?: never;
      startPubkey?: never;
      endPubkey?: never;
      nodePubkey?: never;
    };

export type ConsumeChainQueryFilters = ConsumeChainQueryCommon & ConsumeChainQueryFilterSelectors;

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

const consumeChainIdNodeFilterKeys = ['startId', 'endId', 'nodeId'] as const;
const consumeChainPubkeyNodeFilterKeys = ['startPubkey', 'endPubkey', 'nodePubkey'] as const;
const consumeChainNodeFilterKeys = [...consumeChainIdNodeFilterKeys, ...consumeChainPubkeyNodeFilterKeys] as const;
const consumeChainConvenienceForbiddenQueryKeys = [...consumeChainNodeFilterKeys, 'mountedTransactionId'] as const;

function validateConsumeChainFilters(filters?: ConsumeChainQueryFilters, pagination?: PaginationQuery): void {
  validatePageQuery(filters, 'consume-chains');
  validatePageQuery(pagination, 'consume-chains');
  const mergedFilters = { ...filters, ...pagination } as ConsumeChainQueryFilters;
  validatePageQuery(mergedFilters, 'consume-chains');

  const nodeFilterCount = consumeChainNodeFilterKeys.filter(key => mergedFilters[key] !== undefined).length;
  const hasMountedTransactionFilter = mergedFilters.mountedTransactionId !== undefined;
  if (hasMountedTransactionFilter && nodeFilterCount > 0) {
    throw new Error('mountedTransactionId cannot be combined with node filters');
  }

  validateNoIdPubkeyMix(
    mergedFilters as unknown as Record<string, unknown>,
    consumeChainIdNodeFilterKeys,
    consumeChainPubkeyNodeFilterKeys,
    'consume-chains',
  );
  if (!hasMountedTransactionFilter && nodeFilterCount === 0) {
    throw new Error('consume-chains requires mountedTransactionId or exactly one node filter');
  }
  if (nodeFilterCount > 1) {
    throw new Error('consume-chains requires exactly one node filter');
  }

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

function validateConsumeChainEdgeQuery(params: ConsumeChainEdgeQuery | undefined): void {
  validateRequiredParams(params, 'consume-chains/edges');
  validatePageQuery(params, 'consume-chains/edges');
  validateTimeRange(params.startTime, params.endTime, 'consume-chains/edges');
  const mode = validateRequiredTargetMode(params as Record<string, unknown>, 'consume-chains/edges');
  if (mode === 'id') {
    validateRequiredUuid(params.targetId, 'targetId');
    validateUuid(params.sourceId, 'sourceId');
  } else {
    validateRequiredCompressedPubkey(params.targetPubkey, 'targetPubkey');
    validateCompressedPubkey(params.sourcePubkey, 'sourcePubkey');
  }
}

export async function getConsumeChainById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<ConsumeChainResponseDTORaw>> {
  validateRequiredUuid(id, 'id');
  return client.get<ConsumeChainResponseDTORaw>(`/consume-chains/${encodeURIComponent(id)}`);
}

/**
 * 消费链集合根（分页）。按起点/终点/途经节点（id 或 pubkey）或挂载交易过滤。
 */
export async function queryConsumeChains(
  client: ApiClient,
  filters: ConsumeChainQueryFilters,
  pagination?: PaginationQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  validateConsumeChainFilters(filters, pagination);
  return client.get<SliceResponseDTO<ConsumeChainResponseDTORaw>>('/consume-chains', {
    ...filters,
    ...pagination,
  } as QueryParams);
}

export async function getConsumeChainByMountedTransaction(
  client: ApiClient,
  mountedTransactionId: string,
  pagination?: PaginationQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  validateRequiredUuid(mountedTransactionId, 'mountedTransactionId');
  return queryConsumeChains(client, { mountedTransactionId }, pagination);
}

export async function getConsumeChainByStart(
  client: ApiClient,
  startId: string,
  query?: boolean | ConsumeChainQuery,
): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>> {
  validateRequiredUuid(startId, 'startId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('startId', startId, query);
  validateConsumeChainFilters(params as unknown as ConsumeChainQueryFilters);
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
  validateRequiredUuid(endId, 'endId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('endId', endId, query);
  validateConsumeChainFilters(params as unknown as ConsumeChainQueryFilters);
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
  validateRequiredUuid(nodeId, 'nodeId');
  validateConsumeChainConvenienceQuery(query);
  const params = consumeChainQueryParams('nodeId', nodeId, query);
  validateConsumeChainFilters(params as unknown as ConsumeChainQueryFilters);
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
