import {
  getActuatorHealth,
  getActuatorInfo,
  getActuatorMetric,
  getActuatorMetrics,
  getActuatorPrometheus,
} from './api/actuator.api';
import {
  getBlockByHash,
  getBlockByHeight,
  getLastBlock,
} from './api/block.api';
import {
  getCentralPubkeyEmpowerMsgByFlowNodePubkey,
  getCentralPubkeyEmpowerMsgById,
  listCentralPubkeyEmpowerMsgs,
  sendCentralPubkeyEmpowerMsg,
} from './api/central-pubkey-empower.api';
import {
  getCentralPubkeyLockedMsgByCentralPubkey,
  getCentralPubkeyLockedMsgById,
  listCentralPubkeyLockedMsgs,
  sendCentralPubkeyLockedMsg,
} from './api/central-pubkey-locked.api';
import { ApiClient, type SdkConfig } from './api/client';
import {
  getConsumeChainByEnd,
  getConsumeChainById,
  getConsumeChainByMountedTransaction,
  getConsumeChainByNode,
  getConsumeChainByStart,
  getConsumeChainEdges,
  queryConsumeChains,
} from './api/consume-chain.api';
import { getFlowNodeState, listFlowNodes } from './api/flow-node.api';
import {
  getFlowNodeLockedMsgByFlowNodePubkey,
  getFlowNodeLockedMsgById,
  listFlowNodeLockedMsgs,
  sendFlowNodeLockedMsg,
} from './api/flow-node-locked.api';
import {
  getFlowNodeRegisterMsgByFlowNodePubkey,
  getFlowNodeRegisterMsgById,
  listFlowNodeRegisterMsgs,
  sendFlowNodeRegisterMsg,
} from './api/flow-node-register.api';
import {
  getBlockFormat,
  getCurrencyTypes,
  getDifficulty,
  getMessageTypes,
} from './api/metadata.api';
import {
  normalizeApiResponse,
  normalizeApiResponseSlice,
  normalizeBlockInfo,
  normalizeChainVerificationSummary,
  normalizeCentralPubkeyEmpowerMsg,
  normalizeCentralPubkeyLockedMsg,
  normalizeConsumeChainEdge,
  normalizeConsumeChainResponseDTO,
  normalizeFlowNodeLockedMsg,
  normalizeLockedMessageResponseDTO,
  normalizeStorageStatus,
  normalizeSystemParams,
  normalizeSystemStatus,
  normalizeTransactionMountMsg,
  normalizeTransactionRecordMsg,
} from './api/normalize';
import {
  getReturningFlowRateById,
  getReturningFlowRateByPubkey,
} from './api/returning-flow-rate.api';
import {
  getSystemParams,
  getSystemStatus,
  getSystemStorage,
} from './api/system.api';
import {
  getTransactionMountMsgByBothPubkeys,
  getTransactionMountMsgByConsumeNodePubkey,
  getTransactionMountMsgByFlowNodePubkey,
  getTransactionMountMsgById,
  getTransactionMountMsgByMountedTransactionRecordId,
  searchTransactionMountMsgs,
  sendTransactionMountMsg,
} from './api/transaction-mount.api';
import {
  getTransactionRecordMsgByBothPubkeys,
  getTransactionRecordMsgByConsumeNodePubkey,
  getTransactionRecordMsgByFlowNodePubkey,
  getTransactionRecordMsgById,
  searchTransactionRecordMsgs,
  sendTransactionRecordMsg,
} from './api/transaction-record.api';
import { verifyChain } from './api/verify.api';

export class NmsciSdk {
  readonly client: ApiClient;

  readonly flowNode = {
    getState: (flowNodePubkey: string) => getFlowNodeState(this.client, flowNodePubkey),
    list: (query?: Parameters<typeof listFlowNodes>[1]) => listFlowNodes(this.client, query),
  };

  readonly flowNodeRegister = {
    send: (body: Uint8Array | number[]) => sendFlowNodeRegisterMsg(this.client, body),
    getById: (id: string) => getFlowNodeRegisterMsgById(this.client, id),
    list: (query?: Parameters<typeof listFlowNodeRegisterMsgs>[1]) => listFlowNodeRegisterMsgs(this.client, query),
    getByFlowNodePubkey: (
      flowNodePubkey: string,
      pagination?: Parameters<typeof getFlowNodeRegisterMsgByFlowNodePubkey>[2],
    ) => getFlowNodeRegisterMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
  };

  readonly centralPubkeyEmpower = {
    send: (body: Uint8Array | number[]) => sendCentralPubkeyEmpowerMsg(this.client, body),
    getById: (id: string) => getCentralPubkeyEmpowerMsgById(this.client, id),
    list: (query?: Parameters<typeof listCentralPubkeyEmpowerMsgs>[1]) =>
      listCentralPubkeyEmpowerMsgs(this.client, query),
    getByFlowNodePubkey: (
      flowNodePubkey: string,
      pagination?: Parameters<typeof getCentralPubkeyEmpowerMsgByFlowNodePubkey>[2],
    ) => getCentralPubkeyEmpowerMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
  };

  readonly centralPubkeyLocked = {
    send: (body: Uint8Array | number[]) => sendCentralPubkeyLockedMsg(this.client, body),
    getById: (id: string) => getCentralPubkeyLockedMsgById(this.client, id),
    list: (pagination?: Parameters<typeof listCentralPubkeyLockedMsgs>[1]) =>
      listCentralPubkeyLockedMsgs(this.client, pagination),
    getByCentralPubkey: (centralPubkey: string) => getCentralPubkeyLockedMsgByCentralPubkey(this.client, centralPubkey),
  };

  readonly flowNodeLocked = {
    send: (body: Uint8Array | number[]) => sendFlowNodeLockedMsg(this.client, body),
    getById: (id: string) => getFlowNodeLockedMsgById(this.client, id),
    list: (pagination?: Parameters<typeof listFlowNodeLockedMsgs>[1]) =>
      listFlowNodeLockedMsgs(this.client, pagination),
    getByFlowNodePubkey: (flowNodePubkey: string) => getFlowNodeLockedMsgByFlowNodePubkey(this.client, flowNodePubkey),
  };

  readonly transactionRecord = {
    send: (body: Uint8Array | number[]) => sendTransactionRecordMsg(this.client, body),
    getById: (id: string) => getTransactionRecordMsgById(this.client, id),
    search: (
      filters?: Parameters<typeof searchTransactionRecordMsgs>[1],
      pagination?: Parameters<typeof searchTransactionRecordMsgs>[2],
    ) => searchTransactionRecordMsgs(this.client, filters, pagination),
    getByConsumeNodePubkey: (
      consumeNodePubkey: string,
      pagination?: Parameters<typeof getTransactionRecordMsgByConsumeNodePubkey>[2],
    ) => getTransactionRecordMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
    getByFlowNodePubkey: (
      flowNodePubkey: string,
      pagination?: Parameters<typeof getTransactionRecordMsgByFlowNodePubkey>[2],
    ) => getTransactionRecordMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
    getByBothPubkeys: (
      consumeNodePubkey: string,
      flowNodePubkey: string,
      pagination?: Parameters<typeof getTransactionRecordMsgByBothPubkeys>[3],
    ) => getTransactionRecordMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
  };

  readonly transactionMount = {
    send: (body: Uint8Array | number[]) => sendTransactionMountMsg(this.client, body),
    getById: (id: string) => getTransactionMountMsgById(this.client, id),
    search: (
      filters?: Parameters<typeof searchTransactionMountMsgs>[1],
      pagination?: Parameters<typeof searchTransactionMountMsgs>[2],
    ) => searchTransactionMountMsgs(this.client, filters, pagination),
    getByMountedTransactionRecordId: (
      id: string,
      pagination?: Parameters<typeof getTransactionMountMsgByMountedTransactionRecordId>[2],
    ) => getTransactionMountMsgByMountedTransactionRecordId(this.client, id, pagination),
    getByConsumeNodePubkey: (
      consumeNodePubkey: string,
      pagination?: Parameters<typeof getTransactionMountMsgByConsumeNodePubkey>[2],
    ) => getTransactionMountMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
    getByFlowNodePubkey: (
      flowNodePubkey: string,
      pagination?: Parameters<typeof getTransactionMountMsgByFlowNodePubkey>[2],
    ) => getTransactionMountMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
    getByBothPubkeys: (
      consumeNodePubkey: string,
      flowNodePubkey: string,
      pagination?: Parameters<typeof getTransactionMountMsgByBothPubkeys>[3],
    ) => getTransactionMountMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
  };

  readonly block = {
    getLast: () => getLastBlock(this.client),
    getByHeight: (height: number) => getBlockByHeight(this.client, height),
    getByHash: (hash: string) => getBlockByHash(this.client, hash),
  };

  readonly consumeChain = {
    query: (
      filters: Parameters<typeof queryConsumeChains>[1],
      pagination?: Parameters<typeof queryConsumeChains>[2],
    ) => queryConsumeChains(this.client, filters, pagination),
    getById: (id: string) => getConsumeChainById(this.client, id),
    getByMountedTransaction: (
      mountedTransactionId: string,
      pagination?: Parameters<typeof getConsumeChainByMountedTransaction>[2],
    ) => getConsumeChainByMountedTransaction(this.client, mountedTransactionId, pagination),
    getByStart: (startId: string, query?: Parameters<typeof getConsumeChainByStart>[2]) =>
      getConsumeChainByStart(this.client, startId, query),
    getByEnd: (endId: string, query?: Parameters<typeof getConsumeChainByEnd>[2]) =>
      getConsumeChainByEnd(this.client, endId, query),
    getByNode: (nodeId: string, query?: Parameters<typeof getConsumeChainByNode>[2]) =>
      getConsumeChainByNode(this.client, nodeId, query),
    getEdges: (params: Parameters<typeof getConsumeChainEdges>[1]) => getConsumeChainEdges(this.client, params),
  };

  readonly returningFlowRate = {
    getById: (params: Parameters<typeof getReturningFlowRateById>[1]) => getReturningFlowRateById(this.client, params),
    getByPubkey: (params: Parameters<typeof getReturningFlowRateByPubkey>[1]) =>
      getReturningFlowRateByPubkey(this.client, params),
  };

  readonly system = {
    getParams: () => getSystemParams(this.client),
    getStatus: () => getSystemStatus(this.client),
    getStorage: () => getSystemStorage(this.client),
  };

  readonly verify = {
    chain: (query?: Parameters<typeof verifyChain>[1]) => verifyChain(this.client, query),
  };

  readonly actuator = {
    health: () => getActuatorHealth(this.client),
    info: () => getActuatorInfo(this.client),
    metrics: () => getActuatorMetrics(this.client),
    metric: (name: string) => getActuatorMetric(this.client, name),
    prometheus: () => getActuatorPrometheus(this.client),
  };

  readonly metadata = {
    getMessageTypes: () => getMessageTypes(this.client),
    getCurrencyTypes: () => getCurrencyTypes(this.client),
    getBlockFormat: () => getBlockFormat(this.client),
    getDifficulty: () => getDifficulty(this.client),
  };

  readonly normalized = {
    centralPubkeyEmpower: {
      getById: async (id: string) =>
        normalizeApiResponse(await getCentralPubkeyEmpowerMsgById(this.client, id), normalizeCentralPubkeyEmpowerMsg),
      list: async (query?: Parameters<typeof listCentralPubkeyEmpowerMsgs>[1]) =>
        normalizeApiResponseSlice(
          await listCentralPubkeyEmpowerMsgs(this.client, query),
          normalizeCentralPubkeyEmpowerMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getCentralPubkeyEmpowerMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getCentralPubkeyEmpowerMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeCentralPubkeyEmpowerMsg,
        ),
    },
    centralPubkeyLocked: {
      getById: async (id: string) =>
        normalizeApiResponse(await getCentralPubkeyLockedMsgById(this.client, id), normalizeCentralPubkeyLockedMsg),
      list: async (pagination?: Parameters<typeof listCentralPubkeyLockedMsgs>[1]) =>
        normalizeApiResponseSlice(
          await listCentralPubkeyLockedMsgs(this.client, pagination),
          normalizeCentralPubkeyLockedMsg,
        ),
      getByCentralPubkey: async (centralPubkey: string) =>
        normalizeApiResponse(
          await getCentralPubkeyLockedMsgByCentralPubkey(this.client, centralPubkey),
          locked => normalizeLockedMessageResponseDTO(locked, normalizeCentralPubkeyLockedMsg),
        ),
    },
    flowNodeLocked: {
      getById: async (id: string) =>
        normalizeApiResponse(await getFlowNodeLockedMsgById(this.client, id), normalizeFlowNodeLockedMsg),
      list: async (pagination?: Parameters<typeof listFlowNodeLockedMsgs>[1]) =>
        normalizeApiResponseSlice(await listFlowNodeLockedMsgs(this.client, pagination), normalizeFlowNodeLockedMsg),
      getByFlowNodePubkey: async (flowNodePubkey: string) =>
        normalizeApiResponse(
          await getFlowNodeLockedMsgByFlowNodePubkey(this.client, flowNodePubkey),
          locked => normalizeLockedMessageResponseDTO(locked, normalizeFlowNodeLockedMsg),
        ),
    },
    transactionRecord: {
      getById: async (id: string) =>
        normalizeApiResponse(await getTransactionRecordMsgById(this.client, id), normalizeTransactionRecordMsg),
      search: async (
        filters?: Parameters<typeof searchTransactionRecordMsgs>[1],
        pagination?: Parameters<typeof searchTransactionRecordMsgs>[2],
      ) =>
        normalizeApiResponseSlice(
          await searchTransactionRecordMsgs(this.client, filters, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByConsumeNodePubkey: async (
        consumeNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByConsumeNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
      getByBothPubkeys: async (
        consumeNodePubkey: string,
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionRecordMsgByBothPubkeys>[3],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionRecordMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
          normalizeTransactionRecordMsg,
        ),
    },
    transactionMount: {
      getById: async (id: string) =>
        normalizeApiResponse(await getTransactionMountMsgById(this.client, id), normalizeTransactionMountMsg),
      search: async (
        filters?: Parameters<typeof searchTransactionMountMsgs>[1],
        pagination?: Parameters<typeof searchTransactionMountMsgs>[2],
      ) =>
        normalizeApiResponseSlice(
          await searchTransactionMountMsgs(this.client, filters, pagination),
          normalizeTransactionMountMsg,
        ),
      getByMountedTransactionRecordId: async (
        id: string,
        pagination?: Parameters<typeof getTransactionMountMsgByMountedTransactionRecordId>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByMountedTransactionRecordId(this.client, id, pagination),
          normalizeTransactionMountMsg,
        ),
      getByConsumeNodePubkey: async (
        consumeNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByConsumeNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByConsumeNodePubkey(this.client, consumeNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
      getByFlowNodePubkey: async (
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByFlowNodePubkey>[2],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByFlowNodePubkey(this.client, flowNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
      getByBothPubkeys: async (
        consumeNodePubkey: string,
        flowNodePubkey: string,
        pagination?: Parameters<typeof getTransactionMountMsgByBothPubkeys>[3],
      ) =>
        normalizeApiResponseSlice(
          await getTransactionMountMsgByBothPubkeys(this.client, consumeNodePubkey, flowNodePubkey, pagination),
          normalizeTransactionMountMsg,
        ),
    },
    block: {
      getLast: async () => normalizeApiResponse(await getLastBlock(this.client), normalizeBlockInfo),
      getByHeight: async (height: number) =>
        normalizeApiResponse(await getBlockByHeight(this.client, height), normalizeBlockInfo),
      getByHash: async (hash: string) =>
        normalizeApiResponse(await getBlockByHash(this.client, hash), normalizeBlockInfo),
    },
    consumeChain: {
      getById: async (id: string) =>
        normalizeApiResponse(await getConsumeChainById(this.client, id), normalizeConsumeChainResponseDTO),
      query: async (
        filters: Parameters<typeof queryConsumeChains>[1],
        pagination?: Parameters<typeof queryConsumeChains>[2],
      ) =>
        normalizeApiResponseSlice(
          await queryConsumeChains(this.client, filters, pagination),
          normalizeConsumeChainResponseDTO,
        ),
      getByMountedTransaction: async (
        mountedTransactionId: string,
        pagination?: Parameters<typeof getConsumeChainByMountedTransaction>[2],
      ) =>
        normalizeApiResponseSlice(
          await getConsumeChainByMountedTransaction(this.client, mountedTransactionId, pagination),
          normalizeConsumeChainResponseDTO,
        ),
      getByStart: async (startId: string, query?: Parameters<typeof getConsumeChainByStart>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByStart(this.client, startId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getByEnd: async (endId: string, query?: Parameters<typeof getConsumeChainByEnd>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByEnd(this.client, endId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getByNode: async (nodeId: string, query?: Parameters<typeof getConsumeChainByNode>[2]) =>
        normalizeApiResponseSlice(
          await getConsumeChainByNode(this.client, nodeId, query),
          normalizeConsumeChainResponseDTO,
        ),
      getEdges: async (params: Parameters<typeof getConsumeChainEdges>[1]) =>
        normalizeApiResponseSlice(await getConsumeChainEdges(this.client, params), normalizeConsumeChainEdge),
    },
    system: {
      getParams: async () => normalizeApiResponse(await getSystemParams(this.client), normalizeSystemParams),
      getStatus: async () => normalizeApiResponse(await getSystemStatus(this.client), normalizeSystemStatus),
      getStorage: async () => normalizeApiResponse(await getSystemStorage(this.client), normalizeStorageStatus),
    },
    verify: {
      chain: async (query?: Parameters<typeof verifyChain>[1]) =>
        normalizeApiResponse(await verifyChain(this.client, query), normalizeChainVerificationSummary),
    },
  };

  constructor(configOrClient: SdkConfig | ApiClient) {
    this.client = configOrClient instanceof ApiClient ? configOrClient : new ApiClient(configOrClient);
  }
}
