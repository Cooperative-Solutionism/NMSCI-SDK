import { describe, expect, it } from 'vitest';
import {
  normalizeApiResponse,
  normalizeBlockInfo,
  normalizeConsumeChainResponseDTO,
  normalizeReturningFlowRateResponseDTO,
  normalizeTransactionRecordMsg,
} from '../src';
import type {
  ApiResponse,
  BlockInfoRaw,
  ConsumeChainResponseDTORaw,
  ReturningFlowRateResponseDTORaw,
  TransactionRecordMsgRaw,
} from '../src';

const pubkey = `02${'11'.repeat(32)}` as const;
const signature = 'aa'.repeat(64);

describe('API DTO normalization', () => {
  it('converts transaction 64-bit numeric fields to bigint', () => {
    const raw: TransactionRecordMsgRaw = {
      id: 'id',
      msgType: 4,
      amount: 100,
      currencyType: 1,
      transactionDifficultyTarget: '1effffff',
      nonce: 1,
      consumeNodePubkey: pubkey,
      flowNodePubkey: pubkey,
      centralPubkey: pubkey,
      consumeNodeSignature: signature,
      flowNodeSignature: signature,
      confirmTimestamp: 1_700_000_000_000_000,
      centralSignature: signature,
      txid: '11',
    };

    const normalized = normalizeTransactionRecordMsg(raw);

    expect(normalized.amount).toBe(100n);
    expect(normalized.confirmTimestamp).toBe(1_700_000_000_000_000n);
  });

  it('normalizes nested consume-chain DTOs', () => {
    const raw: ConsumeChainResponseDTORaw = {
      consumeChain: {
        id: 'chain',
        start: 'a',
        end: 'b',
        amount: 200,
        currencyType: 1,
        isLoop: true,
        tailMountTimestamp: 300,
      },
      consumeChainEdges: [{
        id: 'edge',
        source: 'a',
        target: 'b',
        amount: 400,
        currencyType: 1,
        chain: 'chain',
        relatedTransactionRecord: 'record',
        relatedTransactionMount: 'mount',
        relatedTransactionMountTimestamp: 500,
        isLoop: true,
      }],
    };

    const normalized = normalizeConsumeChainResponseDTO(raw);

    expect(normalized.consumeChain.amount).toBe(200n);
    expect(normalized.consumeChain.tailMountTimestamp).toBe(300n);
    expect(normalized.consumeChainEdges[0]?.amount).toBe(400n);
    expect(normalized.consumeChainEdges[0]?.relatedTransactionMountTimestamp).toBe(500n);
  });

  it('normalizes block and returning-flow-rate DTOs', () => {
    const blockRaw: BlockInfoRaw = {
      id: 'block',
      version: 1,
      height: 10,
      sourceCodeZipHash: 'aa',
      previousBlockHash: 'bb',
      merkleRoot: 'cc',
      maxMsgTimestamp: 20,
      registerDifficultyTarget: '1effffff',
      transactionDifficultyTarget: '1effffff',
      centralPubkey: pubkey,
      timestamp: 30,
      centralSignature: signature,
      datFilepath: '/tmp/a.dat',
      sourceCodeZipFilepath: '/tmp/a.zip',
    };
    const rateRaw: ReturningFlowRateResponseDTORaw = {
      returningFlowRate: 0.5,
      loopedAmount: 1,
      unloopedAmount: 2,
      targetTotalLoopedAmount: 3,
      targetTotalUnloopedAmount: 4,
      currencyType: 1,
    };

    expect(normalizeBlockInfo(blockRaw).height).toBe(10n);
    expect(normalizeReturningFlowRateResponseDTO(rateRaw).targetTotalUnloopedAmount).toBe(4);
  });

  it('normalizes ApiResponse data generically', () => {
    const response: ApiResponse<number> = { code: 200, message: 'ok', data: 1 };

    expect(normalizeApiResponse(response, value => BigInt(value)).data).toBe(1n);
  });

  it('rejects unsafe integers to avoid silent precision loss', () => {
    expect(() => normalizeTransactionRecordMsg({
      id: 'id',
      msgType: 4,
      amount: Number.MAX_SAFE_INTEGER + 1,
      currencyType: 1,
      transactionDifficultyTarget: '1effffff',
      nonce: 1,
      consumeNodePubkey: pubkey,
      flowNodePubkey: pubkey,
      centralPubkey: pubkey,
      consumeNodeSignature: signature,
      flowNodeSignature: signature,
      confirmTimestamp: 1,
      centralSignature: signature,
      txid: '11',
    })).toThrow(/MAX_SAFE_INTEGER/);
  });
});
