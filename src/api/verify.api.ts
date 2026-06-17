import { ApiClient, ApiResponse } from './client';
import type { ChainVerificationQuery, ChainVerificationSummaryDTORaw } from './types';

export type ChainVerificationSummaryResponse = ApiResponse<ChainVerificationSummaryDTORaw>;

export async function verifyChain(
  client: ApiClient,
  query?: ChainVerificationQuery,
): Promise<ApiResponse<ChainVerificationSummaryDTORaw>> {
  return client.get<ChainVerificationSummaryDTORaw>('/verify/chain', query);
}
