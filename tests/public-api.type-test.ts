import { expectTypeOf } from 'vitest';
import {
  ApiClient,
  NmsciSdk,
  getConsumeChainEdges,
  getReturningFlowRateById,
  getReturningFlowRateByPubkey,
  type ApiResponse,
  type ConsumeChainEdgeListResponse,
  type ConsumeChainEdgeQuery,
  type ConsumeChainEdgeRaw,
  type ReturningFlowRateResponse,
  type SliceResponseDTO,
} from '../src';

declare const client: ApiClient;
declare const sdk: NmsciSdk;
declare const uuidA: string;
declare const uuidB: string;
declare const pubkeyA: string;
declare const pubkeyB: string;

const consumeEdgeById: ConsumeChainEdgeQuery = {
  targetId: uuidA,
  sourceId: uuidB,
  currencyType: 1,
  startTime: 0,
  endTime: 10,
  page: 0,
  size: 50,
};

const consumeEdgeByPubkey: ConsumeChainEdgeQuery = {
  targetPubkey: pubkeyA,
  sourcePubkey: pubkeyB,
  currencyType: 1,
  startTime: 0,
  endTime: 10,
  page: 0,
  size: 50,
};

expectTypeOf<Parameters<typeof getConsumeChainEdges>[1]>().toEqualTypeOf<ConsumeChainEdgeQuery>();
expectTypeOf<ReturnType<typeof getConsumeChainEdges>>().toEqualTypeOf<Promise<ConsumeChainEdgeListResponse>>();
expectTypeOf<ConsumeChainEdgeListResponse>().toEqualTypeOf<
  ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>
>();

void getConsumeChainEdges(client, consumeEdgeById);
void getConsumeChainEdges(client, consumeEdgeByPubkey);
void sdk.consumeChain.getEdges(consumeEdgeById);
void sdk.consumeChain.getEdges(consumeEdgeByPubkey);

// @ts-expect-error targetId or targetPubkey is required.
void getConsumeChainEdges(client, {});

// @ts-expect-error id mode and pubkey mode cannot be mixed.
void getConsumeChainEdges(client, { targetId: uuidA, targetPubkey: pubkeyA });

// @ts-expect-error id mode cannot include sourcePubkey.
void getConsumeChainEdges(client, { targetId: uuidA, sourcePubkey: pubkeyA });

// @ts-expect-error pubkey mode cannot include sourceId.
void getConsumeChainEdges(client, { targetPubkey: pubkeyA, sourceId: uuidA });

expectTypeOf<Parameters<typeof getReturningFlowRateById>[1]>().toEqualTypeOf<{
  sourceId?: string;
  targetId: string;
  startTime?: number;
  endTime?: number;
  currencyType?: number;
}>();
expectTypeOf<ReturnType<typeof getReturningFlowRateById>>().toEqualTypeOf<Promise<ReturningFlowRateResponse>>();

void getReturningFlowRateById(client, { targetId: uuidA });
void getReturningFlowRateById(client, { targetId: uuidA, sourceId: uuidB, startTime: 0, endTime: 10 });

// @ts-expect-error targetId is required for id mode.
void getReturningFlowRateById(client, { sourceId: uuidB });

// @ts-expect-error pubkey fields are not accepted by id mode.
void getReturningFlowRateById(client, { targetId: uuidA, targetPubkey: pubkeyA });

expectTypeOf<Parameters<typeof getReturningFlowRateByPubkey>[1]>().toEqualTypeOf<{
  sourcePubkey?: string;
  targetPubkey: string;
  startTime?: number;
  endTime?: number;
  currencyType?: number;
}>();
expectTypeOf<ReturnType<typeof getReturningFlowRateByPubkey>>().toEqualTypeOf<Promise<ReturningFlowRateResponse>>();

void getReturningFlowRateByPubkey(client, { targetPubkey: pubkeyA });
void getReturningFlowRateByPubkey(client, {
  targetPubkey: pubkeyA,
  sourcePubkey: pubkeyB,
  startTime: 0,
  endTime: 10,
});

// @ts-expect-error targetPubkey is required for pubkey mode.
void getReturningFlowRateByPubkey(client, { sourcePubkey: pubkeyB });

// @ts-expect-error id fields are not accepted by pubkey mode.
void getReturningFlowRateByPubkey(client, { targetPubkey: pubkeyA, targetId: uuidA });
