import { ApiClient, ApiResponse } from './client';
import type { StorageStatusDTORaw, SystemParamsDTORaw, SystemStatusDTORaw } from './types';

export type SystemParamsResponse = ApiResponse<SystemParamsDTORaw>;
export type SystemStatusResponse = ApiResponse<SystemStatusDTORaw>;
export type StorageStatusResponse = ApiResponse<StorageStatusDTORaw>;

export async function getSystemParams(client: ApiClient): Promise<ApiResponse<SystemParamsDTORaw>> {
  return client.get<SystemParamsDTORaw>('/system/params');
}

export async function getSystemStatus(client: ApiClient): Promise<ApiResponse<SystemStatusDTORaw>> {
  return client.get<SystemStatusDTORaw>('/system/status');
}

export async function getSystemStorage(client: ApiClient): Promise<ApiResponse<StorageStatusDTORaw>> {
  return client.get<StorageStatusDTORaw>('/system/storage');
}
