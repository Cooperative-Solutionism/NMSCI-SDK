import { ApiClient, ApiResponse } from './client';
import { validatePageQuery, validateRequiredCompressedPubkey, validateRequiredUuid } from './query-validation';
import type { CentralPubkeyLockedMsgRaw, LockedMessageResponseDTO, PageQuery, SliceResponseDTO } from './types';

export type CentralPubkeyLockedMsgResponse = ApiResponse<CentralPubkeyLockedMsgRaw>;
export type CentralPubkeyLockedMsgListResponse = ApiResponse<SliceResponseDTO<CentralPubkeyLockedMsgRaw>>;
export type CentralPubkeyLockedMsgLookupResponse = ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>;

export async function sendCentralPubkeyLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<CentralPubkeyLockedMsgRaw>> {
  return client.postBinary<CentralPubkeyLockedMsgRaw>('/central-pubkey-locks', body);
}

export async function getCentralPubkeyLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyLockedMsgRaw>> {
  validateRequiredUuid(id, 'id');
  return client.get<CentralPubkeyLockedMsgRaw>(`/central-pubkey-locks/${encodeURIComponent(id)}`);
}

export async function listCentralPubkeyLockedMsgs(
  client: ApiClient,
  pagination?: PageQuery,
): Promise<ApiResponse<SliceResponseDTO<CentralPubkeyLockedMsgRaw>>> {
  validatePageQuery(pagination, 'central-pubkey-locks');
  return client.get<SliceResponseDTO<CentralPubkeyLockedMsgRaw>>('/central-pubkey-locks', pagination);
}

/**
 * 按中心公钥查询冻结状态，返回 { locked, lockedMsg } 包装。
 */
export async function getCentralPubkeyLockedMsgByCentralPubkey(
  client: ApiClient,
  centralPubkey: string,
): Promise<ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>> {
  validateRequiredCompressedPubkey(centralPubkey, 'centralPubkey');
  return client.get<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>('/central-pubkey-locks/status', {
    centralPubkey,
  });
}
