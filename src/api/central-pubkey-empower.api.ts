import { ApiClient, ApiResponse } from './client';
import type { CentralPubkeyEmpowerMsg } from './types';

export type CentralPubkeyEmpowerMsgResponse = ApiResponse<CentralPubkeyEmpowerMsg>;

export async function sendCentralPubkeyEmpowerMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<CentralPubkeyEmpowerMsg>> {
  return client.postBinary<CentralPubkeyEmpowerMsg>('/central-pubkey-empower-msg/send', body);
}

export async function getCentralPubkeyEmpowerMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyEmpowerMsg>> {
  return client.get<CentralPubkeyEmpowerMsg>(`/central-pubkey-empower-msg/id/${encodeURIComponent(id)}`);
}

export async function getCentralPubkeyEmpowerMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<CentralPubkeyEmpowerMsg>> {
  return client.get<CentralPubkeyEmpowerMsg>(`/central-pubkey-empower-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}
