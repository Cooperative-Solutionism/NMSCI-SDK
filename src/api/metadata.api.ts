import { ApiClient, ApiResponse } from './client';
import type {
  BlockFormatMetadataDTO,
  CurrencyTypeMetadataDTO,
  DifficultyMetadataDTO,
  MsgTypeMetadataDTO,
} from './types';

export type MessageTypesResponse = ApiResponse<MsgTypeMetadataDTO[]>;
export type CurrencyTypesResponse = ApiResponse<CurrencyTypeMetadataDTO[]>;
export type BlockFormatResponse = ApiResponse<BlockFormatMetadataDTO>;
export type DifficultyResponse = ApiResponse<DifficultyMetadataDTO>;

/** 消息类型元数据。size=落库字节数，inboundSize=入站 POST 字节数。 */
export async function getMessageTypes(client: ApiClient): Promise<ApiResponse<MsgTypeMetadataDTO[]>> {
  return client.get<MsgTypeMetadataDTO[]>('/metadata/message-types');
}

export async function getCurrencyTypes(client: ApiClient): Promise<ApiResponse<CurrencyTypeMetadataDTO[]>> {
  return client.get<CurrencyTypeMetadataDTO[]>('/metadata/currency-types');
}

export async function getBlockFormat(client: ApiClient): Promise<ApiResponse<BlockFormatMetadataDTO>> {
  return client.get<BlockFormatMetadataDTO>('/metadata/block-format');
}

export async function getDifficulty(client: ApiClient): Promise<ApiResponse<DifficultyMetadataDTO>> {
  return client.get<DifficultyMetadataDTO>('/metadata/difficulty');
}
