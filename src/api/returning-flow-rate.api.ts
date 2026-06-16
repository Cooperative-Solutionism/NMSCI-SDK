import { ApiClient, ApiResponse, type QueryParams } from './client';
import {
  validateCompressedPubkey,
  validateNoIdPubkeyMix,
  validateRequiredCompressedPubkey,
  validateRequiredParams,
  validateRequiredUuid,
  validateTimeRange,
  validateUuid,
} from './query-validation';
import type { ReturningFlowRateResponseDTORaw } from './types';

export type ReturningFlowRateResponse = ApiResponse<ReturningFlowRateResponseDTORaw>;

/**
 * 按流转节点 UUID 查询回流率/滞留指数。
 * 提供 sourceId 时返回 source→target 回流率；仅 targetId 时返回 target 总成环/总滞留。
 */
export async function getReturningFlowRateById(
  client: ApiClient,
  params: {
    sourceId?: string;
    targetId: string;
    startTime?: number;
    endTime?: number;
    currencyType?: number;
  },
): Promise<ApiResponse<ReturningFlowRateResponseDTORaw>> {
  validateRequiredParams(params, 'returning-flow-rates');
  const mode = validateNoIdPubkeyMix(
    params as Record<string, unknown>,
    ['targetId', 'sourceId'],
    ['targetPubkey', 'sourcePubkey'],
    'returning-flow-rates',
  );
  if (mode === 'pubkey') {
    throw new Error('returning-flow-rates cannot mix id and pubkey query parameters');
  }
  validateRequiredUuid(params.targetId, 'targetId');
  validateUuid(params.sourceId, 'sourceId');
  validateTimeRange(params.startTime, params.endTime, 'returning-flow-rates');
  const query: QueryParams = { targetId: params.targetId };
  if (params.sourceId) query['sourceId'] = params.sourceId;
  if (params.startTime !== undefined) query['startTime'] = params.startTime;
  if (params.endTime !== undefined) query['endTime'] = params.endTime;
  if (params.currencyType !== undefined) query['currencyType'] = params.currencyType;
  return client.get<ReturningFlowRateResponseDTORaw>('/returning-flow-rates', query);
}

/**
 * 按流转节点公钥查询回流率/滞留指数。
 * 提供 sourcePubkey 时返回 source→target 回流率；仅 targetPubkey 时返回 target 总成环/总滞留。
 */
export async function getReturningFlowRateByPubkey(
  client: ApiClient,
  params: {
    sourcePubkey?: string;
    targetPubkey: string;
    startTime?: number;
    endTime?: number;
    currencyType?: number;
  },
): Promise<ApiResponse<ReturningFlowRateResponseDTORaw>> {
  validateRequiredParams(params, 'returning-flow-rates');
  const mode = validateNoIdPubkeyMix(
    params as Record<string, unknown>,
    ['targetId', 'sourceId'],
    ['targetPubkey', 'sourcePubkey'],
    'returning-flow-rates',
  );
  if (mode === 'id') {
    throw new Error('returning-flow-rates cannot mix id and pubkey query parameters');
  }
  validateRequiredCompressedPubkey(params.targetPubkey, 'targetPubkey');
  validateCompressedPubkey(params.sourcePubkey, 'sourcePubkey');
  validateTimeRange(params.startTime, params.endTime, 'returning-flow-rates');
  const query: QueryParams = { targetPubkey: params.targetPubkey };
  if (params.sourcePubkey) query['sourcePubkey'] = params.sourcePubkey;
  if (params.startTime !== undefined) query['startTime'] = params.startTime;
  if (params.endTime !== undefined) query['endTime'] = params.endTime;
  if (params.currencyType !== undefined) query['currencyType'] = params.currencyType;
  return client.get<ReturningFlowRateResponseDTORaw>('/returning-flow-rates', query);
}
