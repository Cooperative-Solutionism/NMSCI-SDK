import { ApiClient, ApiResponse } from './client';
import type { CentralPubkeyLockedMsgRaw, LockedMessageResponseDTO } from './types';

export type CentralPubkeyLockedMsgResponse = ApiResponse<CentralPubkeyLockedMsgRaw>;
export type CentralPubkeyLockedMsgLookupResponse = ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>;

export async function sendCentralPubkeyLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<void> {
  return client.postBinaryNoResponse('/central-pubkey-locks', body);
}

export async function getCentralPubkeyLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyLockedMsgRaw>> {
  return client.get<CentralPubkeyLockedMsgRaw>(`/central-pubkey-locks/${encodeURIComponent(id)}`);
}

/**
 * 按中心公钥查询冻结状态，返回 { locked, lockedMsg } 包装。
 */
export async function getCentralPubkeyLockedMsgByCentralPubkey(
  client: ApiClient,
  centralPubkey: string,
): Promise<ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>> {
  return client.get<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>('/central-pubkey-locks/status', {
    centralPubkey,
  });
}
