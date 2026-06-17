import { expectTypeOf } from 'vitest';
import {
  ApiClient,
  getLastBlock,
  normalizeBlockInfo,
  type ApiResponse,
  type BlockInfo,
  type BlockInfoRaw,
} from '../src/api';
import {
  MsgType,
  buildFlowNodeRegisterPayload,
  signFlowNodeRegisterPayload,
  type FlowNodeRegisterMessage,
} from '../src/messages';
import {
  MSG_SPECS,
  verifyReturnedFullMessageLength,
  verifyTxid,
  type MsgSpec,
} from '../src/protocol';

declare const client: ApiClient;
declare const blockRaw: BlockInfoRaw;
declare const flowNodeRegister: FlowNodeRegisterMessage;
declare const payload: Uint8Array;
declare const privateKey: string;

expectTypeOf<ReturnType<typeof getLastBlock>>().toEqualTypeOf<Promise<ApiResponse<BlockInfoRaw>>>();
expectTypeOf<ReturnType<typeof normalizeBlockInfo>>().toEqualTypeOf<BlockInfo>();
expectTypeOf<Parameters<typeof normalizeBlockInfo>[0]>().toEqualTypeOf<BlockInfoRaw>();
expectTypeOf<ReturnType<typeof buildFlowNodeRegisterPayload>>().toEqualTypeOf<Uint8Array>();
expectTypeOf<ReturnType<typeof signFlowNodeRegisterPayload>>().toEqualTypeOf<Promise<string>>();
expectTypeOf<ReturnType<typeof verifyReturnedFullMessageLength>>().toEqualTypeOf<boolean>();
expectTypeOf<ReturnType<typeof verifyTxid>>().toEqualTypeOf<Promise<boolean>>();
expectTypeOf<(typeof MSG_SPECS)['FLOW_NODE_REGISTRATION']>().toMatchTypeOf<MsgSpec>();

void getLastBlock(client);
void normalizeBlockInfo(blockRaw);
void buildFlowNodeRegisterPayload(flowNodeRegister);
void signFlowNodeRegisterPayload(payload, privateKey);

const msgType: MsgType = MsgType.FLOW_NODE_REGISTRATION;
void msgType;
