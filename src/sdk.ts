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
      filters?: Parameters<typeof queryConsumeChains>[1],
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

  readonly metadata = {
    getMessageTypes: () => getMessageTypes(this.client),
    getCurrencyTypes: () => getCurrencyTypes(this.client),
    getBlockFormat: () => getBlockFormat(this.client),
    getDifficulty: () => getDifficulty(this.client),
  };

  constructor(configOrClient: SdkConfig | ApiClient) {
    this.client = configOrClient instanceof ApiClient ? configOrClient : new ApiClient(configOrClient);
  }
}
