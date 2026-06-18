import { expectTypeOf } from 'vitest';
import {
  ApiClient,
  NmsciSdk,
  getActuatorHealth,
  getActuatorInfo,
  getActuatorMetric,
  getActuatorMetrics,
  getActuatorPrometheus,
  getConsumeChainEdges,
  queryConsumeChains,
  getReturningFlowRateById,
  getReturningFlowRateByPubkey,
  verifyChain,
  type ApiResponse,
  type BlockInfo,
  type BlockInfoRaw,
  type CentralPubkeyEmpowerMsg,
  type CentralPubkeyEmpowerMsgRaw,
  type CentralPubkeyLockedMsg,
  type CentralPubkeyLockedMsgRaw,
  type ConsumeChainEdge,
  type ConsumeChainEdgeListResponse,
  type ConsumeChainEdgeQuery,
  type ConsumeChainEdgeRaw,
  type FlowNodeLockedMsg,
  type FlowNodeLockedMsgRaw,
  type FlowNodeRegisterMsgRaw,
  type LockedMessageResponseDTO,
  type ReturningFlowRateResponse,
  type SliceResponseDTO,
  type StorageStatusDTO,
  type SystemParamsDTO,
  type SystemStatusDTO,
  type TransactionMountMsg,
  type TransactionMountMsgRaw,
  type TransactionRecordMsg,
  type TransactionRecordMsgRaw,
  type ChainVerificationQuery,
  type ChainVerificationSummaryDTO,
  type ChainVerificationSummaryDTORaw,
  type ConsumeChainQueryFilters,
  type ActuatorHealthDTO,
  type ActuatorInfoDTO,
  type ActuatorMetricDTO,
  type ActuatorMetricsDTO,
} from '../src';

declare const client: ApiClient;
declare const sdk: NmsciSdk;
declare const uuidA: string;
declare const uuidB: string;
declare const pubkeyA: string;
declare const pubkeyB: string;
declare const flowNodeRegisterRaw: FlowNodeRegisterMsgRaw;
declare const centralPubkeyEmpowerRaw: CentralPubkeyEmpowerMsgRaw;
declare const centralPubkeyLockedRaw: CentralPubkeyLockedMsgRaw;
declare const flowNodeLockedRaw: FlowNodeLockedMsgRaw;
declare const transactionRecordRaw: TransactionRecordMsgRaw;
declare const transactionMountRaw: TransactionMountMsgRaw;

expectTypeOf<ReturnType<typeof client.getRaw>>().toEqualTypeOf<Promise<Response>>();
expectTypeOf<ReturnType<typeof client.download>>().toEqualTypeOf<Promise<ArrayBuffer>>();

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

const consumeChainByStart: ConsumeChainQueryFilters = {
  startId: uuidA,
  isLoop: false,
  page: 0,
  size: 50,
};

const consumeChainByMountedTransaction: ConsumeChainQueryFilters = {
  mountedTransactionId: uuidA,
  page: 0,
  size: 50,
};

expectTypeOf<Parameters<typeof queryConsumeChains>[1]>().toEqualTypeOf<ConsumeChainQueryFilters>();
void queryConsumeChains(client, consumeChainByStart);
void queryConsumeChains(client, consumeChainByMountedTransaction);
void sdk.consumeChain.query(consumeChainByStart);

// @ts-expect-error consume-chain root queries require one selector.
void queryConsumeChains(client);

// @ts-expect-error consume-chain node mode accepts exactly one selector.
void queryConsumeChains(client, { startId: uuidA, endId: uuidB });

// @ts-expect-error mountedTransactionId cannot be combined with node filters.
void queryConsumeChains(client, { mountedTransactionId: uuidA, nodeId: uuidB });

// @ts-expect-error selector filters cannot be smuggled through the pagination argument.
void queryConsumeChains(client, { startId: uuidA }, { endId: uuidB });

// @ts-expect-error selector filters cannot be smuggled through grouped SDK pagination.
void sdk.consumeChain.query({ startId: uuidA }, { nodeId: uuidB });

expectTypeOf<Parameters<typeof getConsumeChainEdges>[1]>().toEqualTypeOf<ConsumeChainEdgeQuery>();
expectTypeOf<ReturnType<typeof getConsumeChainEdges>>().toEqualTypeOf<Promise<ConsumeChainEdgeListResponse>>();
expectTypeOf<ConsumeChainEdgeListResponse>().toEqualTypeOf<
  ApiResponse<SliceResponseDTO<ConsumeChainEdgeRaw>>
>();

void getConsumeChainEdges(client, consumeEdgeById);
void getConsumeChainEdges(client, consumeEdgeByPubkey);
void sdk.consumeChain.getEdges(consumeEdgeById);
void sdk.consumeChain.getEdges(consumeEdgeByPubkey);

expectTypeOf<ReturnType<typeof sdk.block.getLast>>().toEqualTypeOf<Promise<ApiResponse<BlockInfoRaw>>>();
expectTypeOf<ReturnType<typeof sdk.normalized.block.getLast>>().toEqualTypeOf<Promise<ApiResponse<BlockInfo>>>();
expectTypeOf<ReturnType<typeof sdk.normalized.transactionRecord.search>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.transactionMount.search>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<TransactionMountMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.consumeChain.getEdges>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<ConsumeChainEdge>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.centralPubkeyEmpower.list>>().toEqualTypeOf<
  Promise<ApiResponse<SliceResponseDTO<CentralPubkeyEmpowerMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.centralPubkeyLocked.getByCentralPubkey>>().toEqualTypeOf<
  Promise<ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.flowNodeLocked.getByFlowNodePubkey>>().toEqualTypeOf<
  Promise<ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsg>>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.system.getParams>>().toEqualTypeOf<
  Promise<ApiResponse<SystemParamsDTO>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.system.getStatus>>().toEqualTypeOf<
  Promise<ApiResponse<SystemStatusDTO>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.system.getStorage>>().toEqualTypeOf<
  Promise<ApiResponse<StorageStatusDTO>>
>();
expectTypeOf<Parameters<typeof verifyChain>[1]>().toEqualTypeOf<ChainVerificationQuery | undefined>();
expectTypeOf<ReturnType<typeof verifyChain>>().toEqualTypeOf<Promise<ApiResponse<ChainVerificationSummaryDTORaw>>>();
expectTypeOf<ReturnType<typeof sdk.verify.chain>>().toEqualTypeOf<
  Promise<ApiResponse<ChainVerificationSummaryDTORaw>>
>();
expectTypeOf<ReturnType<typeof sdk.normalized.verify.chain>>().toEqualTypeOf<
  Promise<ApiResponse<ChainVerificationSummaryDTO>>
>();
expectTypeOf<ReturnType<typeof getActuatorHealth>>().toEqualTypeOf<Promise<ActuatorHealthDTO>>();
expectTypeOf<ReturnType<typeof getActuatorInfo>>().toEqualTypeOf<Promise<ActuatorInfoDTO>>();
expectTypeOf<ReturnType<typeof getActuatorMetrics>>().toEqualTypeOf<Promise<ActuatorMetricsDTO>>();
expectTypeOf<ReturnType<typeof getActuatorMetric>>().toEqualTypeOf<Promise<ActuatorMetricDTO>>();
expectTypeOf<ReturnType<typeof getActuatorPrometheus>>().toEqualTypeOf<Promise<string>>();
expectTypeOf<ReturnType<typeof sdk.actuator.health>>().toEqualTypeOf<Promise<ActuatorHealthDTO>>();
expectTypeOf<ReturnType<typeof sdk.actuator.info>>().toEqualTypeOf<Promise<ActuatorInfoDTO>>();
expectTypeOf<ReturnType<typeof sdk.actuator.metrics>>().toEqualTypeOf<Promise<ActuatorMetricsDTO>>();
expectTypeOf<ReturnType<typeof sdk.actuator.metric>>().toEqualTypeOf<Promise<ActuatorMetricDTO>>();
expectTypeOf<ReturnType<typeof sdk.actuator.prometheus>>().toEqualTypeOf<Promise<string>>();

void verifyChain(client);
void verifyChain(client, { stateful: false });
void sdk.verify.chain({ stateful: true });
void getActuatorHealth(client);
void getActuatorMetric(client, 'http.server.requests');
void sdk.actuator.prometheus();

// Message entities follow docs/API.md: rawBytes is an internal backend cache and is not serialized.
// @ts-expect-error rawBytes is not part of FlowNodeRegisterMsgRaw.
void flowNodeRegisterRaw.rawBytes;
// @ts-expect-error rawBytes is not part of CentralPubkeyEmpowerMsgRaw.
void centralPubkeyEmpowerRaw.rawBytes;
// @ts-expect-error rawBytes is not part of CentralPubkeyLockedMsgRaw.
void centralPubkeyLockedRaw.rawBytes;
// @ts-expect-error rawBytes is not part of FlowNodeLockedMsgRaw.
void flowNodeLockedRaw.rawBytes;
// @ts-expect-error rawBytes is not part of TransactionRecordMsgRaw.
void transactionRecordRaw.rawBytes;
// @ts-expect-error rawBytes is not part of TransactionMountMsgRaw.
void transactionMountRaw.rawBytes;

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
