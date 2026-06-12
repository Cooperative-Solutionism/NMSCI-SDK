import {
  getBlockByHash,
  getBlockByHeight,
  getLastBlock,
} from './api/block.api';
import {
  getCentralPubkeyEmpowerMsgByFlowNodePubkey,
  getCentralPubkeyEmpowerMsgById,
  sendCentralPubkeyEmpowerMsg,
} from './api/central-pubkey-empower.api';
import {
  getCentralPubkeyLockedMsgByCentralPubkey,
  getCentralPubkeyLockedMsgById,
  sendCentralPubkeyLockedMsg,
} from './api/central-pubkey-locked.api';
import { ApiClient, type SdkConfig } from './api/client';
import {
  getConsumeChainByEnd,
  getConsumeChainById,
  getConsumeChainByMountedTransaction,
  getConsumeChainByStart,
} from './api/consume-chain.api';
import { getFlowNodeState } from './api/flow-node.api';
import {
  getFlowNodeLockedMsgByFlowNodePubkey,
  getFlowNodeLockedMsgById,
  sendFlowNodeLockedMsg,
} from './api/flow-node-locked.api';
import {
  getFlowNodeRegisterMsgByFlowNodePubkey,
  getFlowNodeRegisterMsgById,
  sendFlowNodeRegisterMsg,
} from './api/flow-node-register.api';
import {
  getReturningFlowRateById,
  getReturningFlowRateByPubkey,
} from './api/returning-flow-rate.api';
import {
  getTransactionMountMsgByBothPubkeys,
  getTransactionMountMsgByConsumeNodePubkey,
  getTransactionMountMsgByFlowNodePubkey,
  getTransactionMountMsgById,
  getTransactionMountMsgByMountedTransactionRecordId,
  sendTransactionMountMsg,
} from './api/transaction-mount.api';
import {
  getTransactionRecordMsgByBothPubkeys,
  getTransactionRecordMsgByConsumeNodePubkey,
  getTransactionRecordMsgByFlowNodePubkey,
  getTransactionRecordMsgById,
  sendTransactionRecordMsg,
} from './api/transaction-record.api';

export class NmsciSdk {
  readonly client: ApiClient;

  readonly flowNode = {
    getState: (flowNodePubkey: string) => getFlowNodeState(this.client, flowNodePubkey),
  };

  readonly flowNodeRegister = {
    send: (body: Uint8Array | number[]) => sendFlowNodeRegisterMsg(this.client, body),
    getById: (id: string) => getFlowNodeRegisterMsgById(this.client, id),
    getByFlowNodePubkey: (flowNodePubkey: string) => getFlowNodeRegisterMsgByFlowNodePubkey(this.client, flowNodePubkey),
  };

  readonly centralPubkeyEmpower = {
    send: (body: Uint8Array | number[]) => sendCentralPubkeyEmpowerMsg(this.client, body),
    getById: (id: string) => getCentralPubkeyEmpowerMsgById(this.client, id),
    getByFlowNodePubkey: (flowNodePubkey: string) => getCentralPubkeyEmpowerMsgByFlowNodePubkey(this.client, flowNodePubkey),
  };

  readonly centralPubkeyLocked = {
    send: (body: Uint8Array | number[]) => sendCentralPubkeyLockedMsg(this.client, body),
    getById: (id: string) => getCentralPubkeyLockedMsgById(this.client, id),
    getByCentralPubkey: (centralPubkey: string) => getCentralPubkeyLockedMsgByCentralPubkey(this.client, centralPubkey),
  };

  readonly flowNodeLocked = {
    send: (body: Uint8Array | number[]) => sendFlowNodeLockedMsg(this.client, body),
    getById: (id: string) => getFlowNodeLockedMsgById(this.client, id),
    getByFlowNodePubkey: (flowNodePubkey: string) => getFlowNodeLockedMsgByFlowNodePubkey(this.client, flowNodePubkey),
  };

  readonly transactionRecord = {
    send: (body: Uint8Array | number[]) => sendTransactionRecordMsg(this.client, body),
    getById: (id: string) => getTransactionRecordMsgById(this.client, id),
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
    getByMountedTransactionRecordId: (id: string) => getTransactionMountMsgByMountedTransactionRecordId(this.client, id),
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
    getByMountedTransaction: (
      relatedTransactionMount: string,
      pagination?: Parameters<typeof getConsumeChainByMountedTransaction>[2],
    ) => getConsumeChainByMountedTransaction(this.client, relatedTransactionMount, pagination),
    getById: (id: string) => getConsumeChainById(this.client, id),
    getByStart: (start: string, query?: Parameters<typeof getConsumeChainByStart>[2]) => getConsumeChainByStart(this.client, start, query),
    getByEnd: (end: string, query?: Parameters<typeof getConsumeChainByEnd>[2]) => getConsumeChainByEnd(this.client, end, query),
  };

  readonly returningFlowRate = {
    getById: (params: Parameters<typeof getReturningFlowRateById>[1]) => getReturningFlowRateById(this.client, params),
    getByPubkey: (params: Parameters<typeof getReturningFlowRateByPubkey>[1]) => getReturningFlowRateByPubkey(this.client, params),
  };

  constructor(configOrClient: SdkConfig | ApiClient) {
    this.client = configOrClient instanceof ApiClient ? configOrClient : new ApiClient(configOrClient);
  }
}
