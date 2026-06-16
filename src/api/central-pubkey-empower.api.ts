import { ApiClient, ApiResponse } from './client';
import {
  validateCompressedPubkey,
  validatePageQuery,
  validateRequiredCompressedPubkey,
  validateRequiredUuid,
} from './query-validation';
import type { CentralPubkeyEmpowerMsgRaw, PageQuery, SliceResponseDTO } from './types';

export type CentralPubkeyEmpowerMsgResponse = ApiResponse<CentralPubkeyEmpowerMsgRaw>;
export type CentralPubkeyEmpowerMsgListResponse = ApiResponse<SliceResponseDTO<CentralPubkeyEmpowerMsgRaw>>;

export interface CentralPubkeyEmpowerMsgListQuery extends PageQuery {
  flowNodePubkey?: string;
}

export async function sendCentralPubkeyEmpowerMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>> {
  return client.postBinary<CentralPubkeyEmpowerMsgRaw>('/central-pubkey-empowerments', body);
}

export async function getCentralPubkeyEmpowerMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>> {
  validateRequiredUuid(id, 'id');
  return client.get<CentralPubkeyEmpowerMsgRaw>(`/central-pubkey-empowerments/${encodeURIComponent(id)}`);
}

export async function listCentralPubkeyEmpowerMsgs(
  client: ApiClient,
  query?: CentralPubkeyEmpowerMsgListQuery,
): Promise<ApiResponse<SliceResponseDTO<CentralPubkeyEmpowerMsgRaw>>> {
  validatePageQuery(query, 'central-pubkey-empowerments');
  validateCompressedPubkey(query?.flowNodePubkey, 'flowNodePubkey');
  return client.get<SliceResponseDTO<CentralPubkeyEmpowerMsgRaw>>('/central-pubkey-empowerments', query);
}

/**
 * 按流转节点公钥查询授权信息。后端集合根返回分页 Slice（不再是单对象）。
 */
export async function getCentralPubkeyEmpowerMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<CentralPubkeyEmpowerMsgRaw>>> {
  validateRequiredCompressedPubkey(flowNodePubkey, 'flowNodePubkey');
  return listCentralPubkeyEmpowerMsgs(client, { flowNodePubkey, ...pagination });
}
