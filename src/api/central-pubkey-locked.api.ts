import { ApiClient, ApiResponse } from './client';
import type { CentralPubkeyLockedMsg } from './types';

export type CentralPubkeyLockedMsgResponse = ApiResponse<CentralPubkeyLockedMsg>;

export async function sendCentralPubkeyLockedMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<void> {
  return client.postBinaryNoResponse('/central-pubkey-locked-msg/send', body);
}

export async function getCentralPubkeyLockedMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyLockedMsg>> {
  return client.get<CentralPubkeyLockedMsg>(`/central-pubkey-locked-msg/id/${encodeURIComponent(id)}`);
}

export async function getCentralPubkeyLockedMsgByCentralPubkey(
  client: ApiClient,
  centralPubkey: string,
): Promise<ApiResponse<CentralPubkeyLockedMsg>> {
  return client.get<CentralPubkeyLockedMsg>(`/central-pubkey-locked-msg/central-pubkey/${encodeURIComponent(centralPubkey)}`);
}
