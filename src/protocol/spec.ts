export const MSG_SPECS = {
  FLOW_NODE_REGISTRATION: {
    msgType: 0,
    submitLength: 123,
    fullLength: 123,
    preSignLength: 59,
  },
  CENTRAL_KEY_AUTH: {
    msgType: 1,
    submitLength: 148,
    fullLength: 220,
    preSignLength: 84,
    centralSignPayloadLength: 156,
  },
  CENTRAL_KEY_FREEZE: {
    msgType: 2,
    submitLength: 115,
    fullLength: 187,
    preSignLength: 51,
    centralSignPayloadLength: 123,
  },
  FLOW_NODE_FREEZE: {
    msgType: 3,
    submitLength: 148,
    fullLength: 220,
    preSignLength: 84,
    centralSignPayloadLength: 156,
  },
  TRANSACTION_RECORD: {
    msgType: 4,
    submitLength: 263,
    fullLength: 335,
    preSignLength: 135,
    centralSignPayloadLength: 271,
  },
  TRANSACTION_MOUNT: {
    msgType: 5,
    submitLength: 269,
    fullLength: 341,
    preSignLength: 141,
    centralSignPayloadLength: 277,
  },
} as const;

export type MsgSpecName = keyof typeof MSG_SPECS;
export type MsgSpec = (typeof MSG_SPECS)[MsgSpecName];
