import { ApiClient, ApiResponse } from './client';
import type { CentralPubkeyLockedMsgRaw, LockedMessageResponseDTO } from './types';

export type CentralPubkeyLockedMsgResponse = ApiResponse<CentralPubkeyLockedMsgRaw>;
export type CentralPubkeyLockedMsgLookupResponse = ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>;

export async function sendCentralPubkeyLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<void> {
  return client.postBinaryNoResponse('/central-pubkey-locked-msg/send', body);
}

export async function getCentralPubkeyLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyLockedMsgRaw>> {
  return client.get<CentralPubkeyLockedMsgRaw>(`/central-pubkey-locked-msg/id/${encodeURIComponent(id)}`);
}

export async function getCentralPubkeyLockedMsgByCentralPubkey(
  client: ApiClient,
  centralPubkey: string,
): Promise<ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>> {
  return client.get<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>(
    `/central-pubkey-locked-msg/central-pubkey/${encodeURIComponent(centralPubkey)}`,
  );
}
