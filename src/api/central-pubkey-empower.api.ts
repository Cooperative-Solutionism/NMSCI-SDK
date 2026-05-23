import { ApiClient, ApiResponse } from './client';
import type { CentralPubkeyEmpowerMsgRaw } from './types';

export type CentralPubkeyEmpowerMsgResponse = ApiResponse<CentralPubkeyEmpowerMsgRaw>;

export async function sendCentralPubkeyEmpowerMsg(
  client: ApiClient,
  body: Uint8Array | number[],
): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>> {
  return client.postBinary<CentralPubkeyEmpowerMsgRaw>('/central-pubkey-empower-msg/send', body);
}

export async function getCentralPubkeyEmpowerMsgById(
  client: ApiClient,
  id: string,
): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>> {
  return client.get<CentralPubkeyEmpowerMsgRaw>(`/central-pubkey-empower-msg/id/${encodeURIComponent(id)}`);
}

export async function getCentralPubkeyEmpowerMsgByFlowNodePubkey(
  client: ApiClient,
  flowNodePubkey: string,
): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>> {
  return client.get<CentralPubkeyEmpowerMsgRaw>(`/central-pubkey-empower-msg/flow-node-pubkey/${encodeURIComponent(flowNodePubkey)}`);
}
