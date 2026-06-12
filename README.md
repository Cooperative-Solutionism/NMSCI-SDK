# NMSCI SDK

消费意愿数值化衡量系统（Numerical Measurement System for Consumption Intention, NMSCI）TypeScript/JS SDK。

提供与 NMSCI 后端 REST API 交互的完整能力，包括消息构造、签名、PoW 挖矿、区块链查询等功能。

> **参考文档**：`api-docs/NMSCI/openapi.yaml`（位于项目根目录）

---

## 目录

- [安装](#安装)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 客户端](#api-客户端)
- [核心工具模块](#核心工具模块)
- [消息序列化](#消息序列化)
- [API 接口一览](#api-接口一览)
- [完整使用示例](#完整使用示例)

---

## 安装

```bash
npm install @nmsci/sdk
```

或使用 yarn / pnpm：

```bash
yarn add @nmsci/sdk
pnpm add @nmsci/sdk
```

> **前置要求**：Node.js >= 18（需要 `crypto.subtle` API），或任何现代浏览器环境。

---

## 快速开始

```typescript
import { ApiClient } from '@nmsci/sdk';

const client = new ApiClient({ baseUrl: 'http://localhost:8080' });

// 查询最新区块
const { data: block } = await client.get('/block-chain/last');
console.log('Latest block height:', block.height);

// 发送原始字节数据
const res = await client.postBinary('/flow-node-register-msg/send', bytes);
```

---

## 核心概念

### 系统角色

| 角色 | 说明 |
|------|------|
| **流转节点** | 商家/个人的账号节点，参与消费流转，需注册 |
| **消费节点** | 发起交易的节点，无需注册 |
| **中心节点** | 系统核心节点，负责信息公证与区块固定 |

### 协议规范

- **签名算法**：ECDSA (secp256k1)
- **哈希算法**：dblsha256（BTC风格：SHA-256 × 2）
- **字节序**：大端序（Big-Endian）
- **时间戳单位**：微秒（μs），时区 UTC+0
- **签名格式**：Low-S（强制）

### 消息类型

| 值 | 名称 | 协议完整字节数 | 客户端提交字节数 |
|----|------|---:|---:|
| 0 | 流转节点注册信息 | 123 | 123 |
| 1 | 中心公钥公证信息 | 220 | 148 |
| 2 | 中心公钥冻结信息 | 187 | 115 |
| 3 | 流转节点冻结信息 | 220 | 148 |
| 4 | 交易记录信息 | 335 | 263 |
| 5 | 交易挂载信息 | 341 | 269 |

协议完整消息包含 `confirmTimestamp` 和 `centralSignature`，用于后端存储、区块固定、`rawBytes` 和 `txid`。客户端 POST `/send` 时发送的是提交载荷，后端会补齐中心时间戳和中心签名；因此交易记录的完整消息是 335 字节，但发送给当前后端的是 263 字节。

### 货币类型

| 值 | 名称 | 说明 |
|----|------|------|
| 0 | 黄金 | 微克（μg） |
| 1 | 人民币 | 分 |

---

## API 客户端

### 配置

```typescript
import { ApiClient, type SdkConfig } from '@nmsci/sdk';

const config: SdkConfig = {
  baseUrl: 'http://localhost:8080', // 后端地址
  authToken: 'xxx',                 // 可选：裸 JWT Token，SDK 自动添加 Bearer
  timeout: 15000,                   // 可选：请求超时（毫秒），默认 15000
};

const client = new ApiClient(config);
```

### 认证

```typescript
client.setAuthToken('new-jwt-token');
client.clearAuthToken();
```

### HTTP 方法

所有方法返回 `Promise<ApiResponse<T>>`，结构如下：

```typescript
interface ApiResponse<T = unknown> {
  code: number;    // 200 = 成功
  message: string;  // 响应信息
  data: T;          // 实际数据
}

// GET 请求
const res = await client.get<T>('/path', { param: 'value' });
if (res.code !== 200) throw new Error(res.message);
console.log(res.data);

// POST 请求
const res = await client.post<T>('/path', bodyData);
```

### Raw 与 Normalized DTO

后端 JSON 中的 `amount`、`confirmTimestamp`、`height` 等 64 位整数以 `number` 返回，可能超过 `Number.MAX_SAFE_INTEGER`。SDK 的函数式 API 保持 wire JSON 形态并返回 `*Raw` 类型；如需 bigint，可显式调用 normalize 函数。`ReturningFlowRateResponseDTO` 的金额指标是后端 `double`，normalize 后仍保持 `number`。

```typescript
import {
  getTransactionRecordMsgById,
  normalizeApiResponse,
  normalizeTransactionRecordMsg,
} from '@nmsci/sdk';

const raw = await getTransactionRecordMsgById(client, id); // ApiResponse<TransactionRecordMsgRaw>
const normalized = normalizeApiResponse(raw, normalizeTransactionRecordMsg); // ApiResponse<TransactionRecordMsg>

// normalized.data.amount 与 normalized.data.confirmTimestamp 均为 bigint
```

如果需要规范化分页查询结果，可使用 `normalizeApiResponseSlice(response, normalizeItem)`；冻结状态查询的 `locked/lockedMsg` 包装可使用 `normalizeLockedMessageResponseDTO(raw, normalizeItem)`。如果原始 number 已超过安全整数范围，normalize 会抛错，避免把已经丢精度的值静默转换成 bigint。difficulty target 保持 hex string，与后端序列化保持一致。

### 组合型 SDK

除了函数式 API，也可以使用 `NmsciSdk` 组合入口，避免每次手动传入 `client`：

```typescript
import { NmsciSdk } from '@nmsci/sdk';

const sdk = new NmsciSdk({ baseUrl: 'http://localhost:8080' });

await sdk.flowNodeRegister.send(submitPayload);
await sdk.flowNode.getState(flowNodePubkey);
await sdk.transactionRecord.getByFlowNodePubkey(flowNodePubkey, { page: 0, size: 50 });
await sdk.returningFlowRate.getByPubkey({ target: flowNodePubkey, currencyType: 1 });
```

也可以按子路径导入：

```typescript
import { ApiClient } from '@nmsci/sdk/api';
import { serializeTransactionRecordSubmitPayload } from '@nmsci/sdk/messages';
import { MSG_SPECS } from '@nmsci/sdk/protocol';
```

---

## 核心工具模块

### 密钥生成

```typescript
import { generateKeyPair, getPublicKeyFromPrivate, validatePublicKey, validatePrivateKey } from '@nmsci/sdk';

// 生成随机密钥对
const { privateKey, publicKey } = generateKeyPair();
// privateKey: 64字符十六进制字符串（32字节）
// publicKey:  66字符十六进制字符串（33字节压缩公钥）

// 从私钥推导公钥
const pubkey = getPublicKeyFromPrivate(privateKey);

// 验证公钥合法性
const result = validatePublicKey(publicKey);
if (!result.isValid) console.error(result.error);

// 验证私钥合法性
if (!validatePrivateKey(privateKey)) throw new Error('Invalid private key');
```

### 签名与验签

```typescript
import { signData, verifySignature } from '@nmsci/sdk';

const data = new Uint8Array([0x00, 0x01, 0x02]);

// 签名（自动 Low-S 规范化）
const signatureBytes = await signData(data, privateKeyHex);
const signatureHex = Array.from(signatureBytes)
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// 验签
const isValid = await verifySignature(data, signatureBytes, publicKeyHex);
```

### 字节编码

```typescript
import { toBytesBigEndian, fromHex, toHex, concat, uuidToBytes, bytesToUuid } from '@nmsci/sdk';

// 整数 → 大端字节
const u8 = toBytesBigEndian(65535, 2); // Uint8Array(2)
const u32 = toBytesBigEndian(0x12345678, 4);
const u64 = toBytesBigEndian(1_000_000n, 8);

// 十六进制 ↔ 字节
const bytes = fromHex('02aabbcc');        // Hex → Uint8Array
const hex   = toHex(new Uint8Array([1,2,3])); // Uint8Array → Hex

// UUID 互转
const uuidBytes = uuidToBytes('550e8400-e29b-41d4-a716-446655440000');
const uuid = bytesToUuid(uuidBytes);

// 字节拼接
const combined = concat(u8, u32, bytes);
```

### 工作量证明（PoW）

```typescript
import { mineNonce, calculateTargetFromNBits, doubleSha256Hex, compareHex } from '@nmsci/sdk';

// 从 nBits（紧凑格式）计算难度目标
const targetHex = calculateTargetFromNBits('0x1effffff'); // "0000ffff..."

// 挖矿：寻找满足 dblsha256(prefix + nonce + suffix) < target 的 nonce
const nonce = await mineNonce(
  prefix,     // nonce 之前的字节
  suffix,     // nonce 之后的字节
  targetHex,
  (attempts, hash, nonce) => {
    console.log(`Tried ${attempts}, current hash: ${hash}`);
  }
);
console.log('Found valid nonce:', nonce);

// 直接计算双 SHA-256
const hash = await doubleSha256Hex(data);

// 比较两个十六进制字符串（按大端整数比较）
compareHex('0000ffff...', '00010000...'); // -1
```

---

## 消息序列化

每个消息类型都有两类序列化函数：`serializeXxxSubmitPayload` 生成客户端 POST `/send` 使用的提交载荷，`serializeXxxFullMessage` 生成包含中心确认字段的协议完整消息。旧的 `serializeXxx` 仍保留为完整消息兼容别名。

> **关键**：所有签名均基于特定的**预签名载荷**（不含签名字段的字节序列）计算，具体字段分布见各消息说明。

### 流转节点注册（消息类型 0，123 字节）

```typescript
import {
  MsgType,
  buildFlowNodeRegisterPayload,
  serializeFlowNodeRegister,
  signData,
} from '@nmsci/sdk';
import { toBytesBigEndian, concat, fromHex, toHex } from '@nmsci/sdk';

// 1. 构造注册信息
const msg = {
  msgType: MsgType.FLOW_NODE_REGISTRATION,
  uuid: '550e8400e29b41d4a716446655440000', // 32字符无破折号
  registerDifficultyTarget: '0x1effffff',
  nonce: 12345, // 从 PoW 挖矿得到
  flowNodePubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  flowNodeSignature: undefined, // 待签名后填入
};

// 2. 计算预签名载荷（59字节 = 2+16+4+4+33）
const payload = buildFlowNodeRegisterPayload({
  uuid: msg.uuid,
  registerDifficultyTarget: msg.registerDifficultyTarget,
  nonce: msg.nonce,
  flowNodePubkey: msg.flowNodePubkey,
});

// 3. 签名（dblsha256(data) 后用私钥签名）
const sig = await signData(payload, flowNodePrivateKey);
msg.flowNodeSignature = toHex(sig) as Signature;

// 4. 序列化为 123 字节
const bytes = serializeFlowNodeRegister(msg);

// 5. 提交（ArrayBuffer → number[]）
const res = await client.postBinary('/flow-node-register-msg/send', bytes);
```

**字段布局（123 字节）：**

| 字段 | 字节数 | 说明 |
|------|--------|------|
| msgType | 2 | 固定 `0x0000` |
| uuid | 16 | 信息唯一标识 |
| registerDifficultyTarget | 4 | 注册难度目标（大端序十六进制） |
| nonce | 4 | PoW 随机数（大端序） |
| flowNodePubkey | 33 | 流转节点压缩公钥 |
| flowNodeSignature | 64 | 流转节点对前5项数据的签名 |

### 中心公钥授权（消息类型 1，完整 220 字节，提交 148 字节）

```typescript
import { MsgType, buildCentralPubkeyEmpowerPayload, buildCentralPubkeyEmpowerFullPayload, serializeCentralPubkeyEmpowerSubmitPayload, serializeCentralPubkeyEmpowerFullMessage, signData } from '@nmsci/sdk';
import { fromHex, toHex } from '@nmsci/sdk';

const msg = {
  msgType: MsgType.CENTRAL_KEY_AUTH,
  uuid: '660e8400e29b41d4a716446655440001',
  flowNodePubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  centralPubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  flowNodeSignature: undefined,
  confirmTimestamp: BigInt(Date.now()) * 1000n, // 微秒时间戳
  centralSignature: undefined,
};

// 第一步：流转节点签名（签 preSigPayload = 84字节）
const prePayload = buildCentralPubkeyEmpowerPayload({
  uuid: msg.uuid,
  flowNodePubkey: msg.flowNodePubkey,
  centralPubkey: msg.centralPubkey,
});
msg.flowNodeSignature = toHex(await signData(prePayload, flowNodePrivateKey)) as Signature;

// 后端会生成 confirmTimestamp 和 centralSignature；离线完整消息校验时中心签名对象为 156 字节
const fullPayload = buildCentralPubkeyEmpowerFullPayload({
  uuid: msg.uuid,
  flowNodePubkey: msg.flowNodePubkey,
  centralPubkey: msg.centralPubkey,
  flowNodeSignature: msg.flowNodeSignature,
  confirmTimestamp: msg.confirmTimestamp,
});
msg.centralSignature = toHex(await signData(fullPayload, centralPrivateKey)) as Signature;

await client.postBinary('/central-pubkey-empower-msg/send', serializeCentralPubkeyEmpowerSubmitPayload(msg));
const fullBytes = serializeCentralPubkeyEmpowerFullMessage(msg); // 220 字节，用于校验后端 rawBytes
```

### 中心公钥冻结（消息类型 2，完整 187 字节，提交 115 字节）

```typescript
import { MsgType, buildCentralPubkeyLockedPayload, buildCentralPubkeyLockedFullPayload, serializeCentralPubkeyLockedSubmitPayload, serializeCentralPubkeyLockedFullMessage, signData } from '@nmsci/sdk';

const msg = {
  msgType: MsgType.CENTRAL_KEY_FREEZE,
  uuid: '770e8400e29b41d4a716446655440002',
  centralPubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  centralSignaturePre: undefined,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
  centralSignature: undefined,
};

// 预签名（51字节）：msgType + uuid + centralPubkey
const prePayload = buildCentralPubkeyLockedPayload({
  uuid: msg.uuid,
  centralPubkey: msg.centralPubkey,
});
msg.centralSignaturePre = toHex(await signData(prePayload, centralPrivateKey)) as Signature;

// 离线完整消息校验时中心签名对象为 123 字节
const fullPayload = buildCentralPubkeyLockedFullPayload({
  uuid: msg.uuid,
  centralPubkey: msg.centralPubkey,
  centralSignaturePre: msg.centralSignaturePre,
  confirmTimestamp: msg.confirmTimestamp,
});
msg.centralSignature = toHex(await signData(fullPayload, centralPrivateKey)) as Signature;

await client.postBinary('/central-pubkey-locked-msg/send', serializeCentralPubkeyLockedSubmitPayload(msg));
const fullBytes = serializeCentralPubkeyLockedFullMessage(msg); // 187 字节，用于校验后端 rawBytes
// 注意：此接口成功时无响应体（void）
```

### 流转节点冻结（消息类型 3，完整 220 字节，提交 148 字节）

与中心公钥授权流程类似，需要流转节点和中心节点双重签名。

```typescript
import { MsgType, buildFlowNodeLockedPayload, buildFlowNodeLockedFullPayload, serializeFlowNodeLockedSubmitPayload, serializeFlowNodeLockedFullMessage, signData } from '@nmsci/sdk';

const msg = {
  msgType: MsgType.FLOW_NODE_FREEZE,
  uuid: '880e8400e29b41d4a716446655440003',
  flowNodePubkey: '02aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  centralPubkey: '03bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  flowNodeSignature: undefined,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
  centralSignature: undefined,
};

// 流转节点签名（84字节）
const prePayload = buildFlowNodeLockedPayload({
  uuid: msg.uuid,
  flowNodePubkey: msg.flowNodePubkey,
  centralPubkey: msg.centralPubkey,
});
msg.flowNodeSignature = toHex(await signData(prePayload, flowNodePrivateKey)) as Signature;

// 离线完整消息校验时中心签名对象为 156 字节
const fullPayload = buildFlowNodeLockedFullPayload({
  ...msg,
  flowNodeSignature: msg.flowNodeSignature,
  confirmTimestamp: msg.confirmTimestamp,
});
msg.centralSignature = toHex(await signData(fullPayload, centralPrivateKey)) as Signature;

await client.postBinary('/flow-node-locked-msg/send', serializeFlowNodeLockedSubmitPayload(msg));
const fullBytes = serializeFlowNodeLockedFullMessage(msg); // 220 字节，用于校验后端 rawBytes
```

### 交易记录（消息类型 4，完整 335 字节，提交 263 字节）

需要 PoW + 消费节点签名 + 流转节点签名 + 中心节点签名。

```typescript
import {
  MsgType, CurrencyType,
  buildTransactionRecordPayload, buildTransactionRecordFullPayload,
  serializeTransactionRecordSubmitPayload, serializeTransactionRecordFullMessage,
  signTransactionRecordPayload, mineTransactionRecordNonce,
} from '@nmsci/sdk';
import { fromHex, toHex, toBytesBigEndian, concat } from '@nmsci/sdk';

// 构造 noncePrefix（32字节）和 nonceSuffix（99字节）
const uid = new Uint8Array(16);
crypto.getRandomValues(uid);
const uuid = toHex(uid); // 32字符

const noncePrefix = concat(
  toBytesBigEndian(MsgType.TRANSACTION_RECORD, 2),   // 2 bytes msgType
  uid,                                               // 16 bytes uuid
  toBytesBigEndian(10000n, 8),                        // 8 bytes amount（分 or 微克）
  toBytesBigEndian(CurrencyType.RMB_CENT, 2),         // 2 bytes currencyType
  fromHex('0x1effffff'.padStart(8, '0')),            // 4 bytes difficultyTarget
); // 共 32 字节

const nonceSuffix = concat(
  fromHex(consumeNodePubkey),  // 33 bytes
  fromHex(flowNodePubkey),     // 33 bytes
  fromHex(centralPubkey),      // 33 bytes
); // 共 99 字节

// PoW 挖矿
const nonce = await mineTransactionRecordNonce(
  noncePrefix,
  nonceSuffix,
  '0x1effffff',
  (attempts, hash, n) => {
    if (attempts % 10000 === 0) console.log(`Mining: ${attempts} attempts...`);
  }
);
console.log('PoW nonce found:', nonce);

// 构建完整 135 字节载荷
const payload = buildTransactionRecordPayload({
  uuid,
  amount: 10000n,
  currencyType: CurrencyType.RMB_CENT,
  transactionDifficultyTarget: '0x1effffff',
  nonce,
  consumeNodePubkey,
  flowNodePubkey,
  centralPubkey,
});

// 消费节点签名
const consumeSig = await signTransactionRecordPayload(payload, consumeNodePrivateKey);

// 流转节点签名
const flowSig = await signTransactionRecordPayload(payload, flowNodePrivateKey);

// 离线完整消息校验时中心签名对象为 271 字节
const fullPayload = buildTransactionRecordFullPayload({
  uuid, amount: 10000n, currencyType: CurrencyType.RMB_CENT,
  transactionDifficultyTarget: '0x1effffff', nonce,
  consumeNodePubkey, flowNodePubkey, centralPubkey,
  consumeNodeSignature: consumeSig,
  flowNodeSignature: flowSig,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
});
const centralSig = await signData(fullPayload, centralPrivateKey);

// 组装消息
const msg = {
  msgType: MsgType.TRANSACTION_RECORD,
  uuid, amount: 10000n, currencyType: CurrencyType.RMB_CENT,
  transactionDifficultyTarget: '0x1effffff', nonce,
  consumeNodePubkey, flowNodePubkey, centralPubkey,
  consumeNodeSignature: consumeSig,
  flowNodeSignature: flowSig,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
  centralSignature: toHex(centralSig) as Signature,
};

await client.postBinary('/transaction-record-msg/send', serializeTransactionRecordSubmitPayload(msg));
const fullBytes = serializeTransactionRecordFullMessage(msg); // 335 字节，用于校验后端 rawBytes
```

### 交易挂载（消息类型 5，完整 341 字节，提交 269 字节）

与交易记录类似，但引用一笔已存在的交易记录 ID 作为起点。

```typescript
import {
  MsgType,
  buildTransactionMountPayload, buildTransactionMountFullPayload,
  serializeTransactionMountSubmitPayload, serializeTransactionMountFullMessage,
  signTransactionMountPayload, mineTransactionMountNonce,
} from '@nmsci/sdk';
import { toBytesBigEndian, concat, fromHex, toHex } from '@nmsci/sdk';

// 被挂载的交易记录 ID
const mountedRecordId = '11223344556677889900112233445566';

// 构造 noncePrefix（38字节）和 nonceSuffix（99字节）
const uid = new Uint8Array(16);
crypto.getRandomValues(uid);
const uuid = toHex(uid);

const noncePrefix = concat(
  toBytesBigEndian(MsgType.TRANSACTION_MOUNT, 2),   // 2 bytes
  uid,                                               // 16 bytes
  fromHex(mountedRecordId),                          // 16 bytes
  fromHex('0x1effffff'.padStart(8, '0')),           // 4 bytes
); // 共 38 字节

const nonceSuffix = concat(
  fromHex(consumeNodePubkey),
  fromHex(flowNodePubkey),
  fromHex(centralPubkey),
); // 共 99 字节

// PoW 挖矿
const nonce = await mineTransactionMountNonce(noncePrefix, nonceSuffix, '0x1effffff');

// 构建 141 字节载荷并签名
const payload = buildTransactionMountPayload({
  uuid, mountedTransactionRecordId: mountedRecordId,
  transactionDifficultyTarget: '0x1effffff', nonce,
  consumeNodePubkey, flowNodePubkey, centralPubkey,
});

const consumeSig = await signTransactionMountPayload(payload, consumeNodePrivateKey);
const flowSig    = await signTransactionMountPayload(payload, flowNodePrivateKey);

// 离线完整消息校验时中心签名对象为 277 字节
const fullPayload = buildTransactionMountFullPayload({
  uuid, mountedTransactionRecordId: mountedRecordId,
  transactionDifficultyTarget: '0x1effffff', nonce,
  consumeNodePubkey, flowNodePubkey, centralPubkey,
  consumeNodeSignature: consumeSig, flowNodeSignature: flowSig,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
});
const centralSig = await signData(fullPayload, centralPrivateKey);

const msg = {
  msgType: MsgType.TRANSACTION_MOUNT,
  uuid, mountedTransactionRecordId: mountedRecordId,
  transactionDifficultyTarget: '0x1effffff', nonce,
  consumeNodePubkey, flowNodePubkey, centralPubkey,
  consumeNodeSignature: consumeSig,
  flowNodeSignature: flowSig,
  confirmTimestamp: BigInt(Date.now()) * 1000n,
  centralSignature: toHex(centralSig) as Signature,
};

await client.postBinary('/transaction-mount-msg/send', serializeTransactionMountSubmitPayload(msg));
const fullBytes = serializeTransactionMountFullMessage(msg); // 341 字节，用于校验后端 rawBytes
```

---

## API 接口一览

所有接口均通过 `ApiClient` 实例调用。通用响应格式：

```typescript
{ code: 200, message: 'Success', data: T }
```

### 流转节点状态

```typescript
// 按流转节点公钥查询注册/授权/冻结状态
getFlowNodeState(client, flowNodePubkey: string): Promise<ApiResponse<FlowNodeStateResponseDTO>>
```

### 流转节点注册

```typescript
// 发送注册信息
sendFlowNodeRegisterMsg(client, byteArray: number[]): Promise<ApiResponse<FlowNodeRegisterMsgRaw>>

// 按 UUID 查询
getFlowNodeRegisterMsgById(client, id: string): Promise<ApiResponse<FlowNodeRegisterMsgRaw>>

// 按流转节点公钥查询
getFlowNodeRegisterMsgByFlowNodePubkey(client, flowNodePubkey: string): Promise<ApiResponse<FlowNodeRegisterMsgRaw>>
// flowNodePubkey: 66字符十六进制字符串
```

### 中心公钥授权

```typescript
// 发送授权信息
sendCentralPubkeyEmpowerMsg(client, byteArray: number[]): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>>

// 按 UUID 查询
getCentralPubkeyEmpowerMsgById(client, id: string): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>>

// 按流转节点公钥查询
getCentralPubkeyEmpowerMsgByFlowNodePubkey(client, flowNodePubkey: string): Promise<ApiResponse<CentralPubkeyEmpowerMsgRaw>>
```

### 中心公钥冻结

```typescript
// 发送冻结信息（成功后无响应体）
sendCentralPubkeyLockedMsg(client, byteArray: number[]): Promise<void>

// 按 UUID 查询
getCentralPubkeyLockedMsgById(client, id: string): Promise<ApiResponse<CentralPubkeyLockedMsgRaw>>

// 按中心公钥查询
getCentralPubkeyLockedMsgByCentralPubkey(client, centralPubkey: string): Promise<ApiResponse<LockedMessageResponseDTO<CentralPubkeyLockedMsgRaw>>>
```

### 流转节点冻结

```typescript
// 发送冻结信息
sendFlowNodeLockedMsg(client, byteArray: number[]): Promise<ApiResponse<FlowNodeLockedMsgRaw>>

// 按 UUID 查询
getFlowNodeLockedMsgById(client, id: string): Promise<ApiResponse<FlowNodeLockedMsgRaw>>

// 按流转节点公钥查询
getFlowNodeLockedMsgByFlowNodePubkey(client, flowNodePubkey: string): Promise<ApiResponse<LockedMessageResponseDTO<FlowNodeLockedMsgRaw>>>
```

### 交易记录

```typescript
// 发送交易记录
sendTransactionRecordMsg(client, byteArray: number[]): Promise<ApiResponse<TransactionRecordMsgRaw>>

// 按 UUID 查询
getTransactionRecordMsgById(client, id: string): Promise<ApiResponse<TransactionRecordMsgRaw>>

// 按消费节点公钥查询（返回分页 Slice）
getTransactionRecordMsgByConsumeNodePubkey(client, consumeNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>>

// 按流转节点公钥查询（返回分页 Slice）
getTransactionRecordMsgByFlowNodePubkey(client, flowNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>>

// 按双方公钥查询（返回分页 Slice）
getTransactionRecordMsgByBothPubkeys(client, consumeNodePubkey: string, flowNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionRecordMsgRaw>>>
```

### 交易挂载

```typescript
// 发送交易挂载
sendTransactionMountMsg(client, byteArray: number[]): Promise<ApiResponse<TransactionMountMsgRaw>>

// 按 UUID 查询
getTransactionMountMsgById(client, id: string): Promise<ApiResponse<TransactionMountMsgRaw>>

// 按被挂载的交易记录 ID 查询
getTransactionMountMsgByMountedTransactionRecordId(client, id: string): Promise<ApiResponse<TransactionMountMsgRaw>>

// 按消费节点公钥查询（返回分页 Slice）
getTransactionMountMsgByConsumeNodePubkey(client, consumeNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>>

// 按流转节点公钥查询（返回分页 Slice）
getTransactionMountMsgByFlowNodePubkey(client, flowNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>>

// 按双方公钥查询（返回分页 Slice）
getTransactionMountMsgByBothPubkeys(client, consumeNodePubkey: string, flowNodePubkey: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<TransactionMountMsgRaw>>>
```

### 区块链

```typescript
// 查询最新区块
getLastBlock(client): Promise<ApiResponse<BlockInfoRaw>>

// 按区块高度查询
getBlockByHeight(client, height: number): Promise<ApiResponse<BlockInfoRaw>>

// 按区块头哈希查询
getBlockByHash(client, hash: string): Promise<ApiResponse<BlockInfoRaw>>  // hash: 64字符十六进制字符串
```

### 消费链

```typescript
// 按关联交易挂载记录查询
getConsumeChainByMountedTransaction(client, relatedTransactionMount: string, pagination?: PageQuery): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>>

// 按消费链 UUID 查询
getConsumeChainById(client, id: string): Promise<ApiResponse<ConsumeChainResponseDTORaw>>

// 按起点查询
getConsumeChainByStart(client, start: string, query?: boolean | ConsumeChainQuery): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>>
// start: 起点流转节点 UUID
// query: 可传旧版 boolean isLoop；也可传 { isLoop, page, size }

// 按终点查询
getConsumeChainByEnd(client, end: string, query?: boolean | ConsumeChainQuery): Promise<ApiResponse<SliceResponseDTO<ConsumeChainResponseDTORaw>>>
// end: 终点流转节点 UUID
```

### 回流率

```typescript
// 按 UUID 查询
getReturningFlowRateById(client, {
  sourceId?,      // 可选：源流转节点 UUID（空则查询总滞留指数）
  targetId,       // 必填：目标流转节点 UUID
  startTime?,     // 可选：开始时间（微秒），默认 0
  endTime?,       // 可选：结束时间（微秒），默认 Long.MAX_VALUE
  currencyType?,  // 可选：0=黄金，1=人民币，默认 1
}): Promise<ApiResponse<ReturningFlowRateResponseDTORaw>>

// 按公钥查询
getReturningFlowRateByPubkey(client, {
  source?,       // 可选：源流转节点公钥（空则查询总滞留指数）
  target,        // 必填：目标流转节点公钥
  startTime?,
  endTime?,
  currencyType?,
}): Promise<ApiResponse<ReturningFlowRateResponseDTORaw>>

// 返回字段说明
// returningFlowRate        = 已成环金额 / 全部消费链金额
// loopedAmount              = source→target 已成环金额总和
// unloopedAmount            = source→target 未成环金额总和（滞留指数）
// targetTotalLoopedAmount   = target 节点所有已成环金额（总滞留指数）
// targetTotalUnloopedAmount = target 节点所有未成环金额（总滞留指数）
// currencyType              = 货币类型
```

---

## 完整使用示例

以下示例演示完整注册一个新流转节点的流程：

```typescript
import {
  ApiClient,
  generateKeyPair,
  MsgType,
  buildFlowNodeRegisterPayload,
  serializeFlowNodeRegister,
  signData,
  calculateTargetFromNBits,
  mineNonce,
  sendFlowNodeRegisterMsg,
  getFlowNodeRegisterMsgByFlowNodePubkey,
  toBytesBigEndian,
  concat,
  fromHex,
  toHex,
} from '@nmsci/sdk';

async function registerFlowNode(centralPubkey: string, difficultyTarget: string) {
  // 1. 初始化客户端
  const client = new ApiClient({ baseUrl: 'http://localhost:8080' });

  // 2. 生成流转节点密钥对
  const { privateKey: flowNodePrivateKey, publicKey: flowNodePubkey } = generateKeyPair();
  console.log('Generated pubkey:', flowNodePubkey);

  // 3. 检查是否已注册
  const existing = await getFlowNodeRegisterMsgByFlowNodePubkey(client, flowNodePubkey);
  if (existing.code === 200) {
    console.log('Already registered:', existing.data.id);
    return existing.data;
  }

  // 4. 生成 UUID
  const uid = new Uint8Array(16);
  crypto.getRandomValues(uid);
  const uuid = toHex(uid);

  // 5. PoW 挖矿（构造 noncePrefix = 22字节，nonceSuffix = 33字节）
  const noncePrefix = concat(
    toBytesBigEndian(MsgType.FLOW_NODE_REGISTRATION, 2), // 2 bytes
    uid,                                                   // 16 bytes
    fromHex(difficultyTarget.padStart(8, '0')),           // 4 bytes
  ); // 共 22 字节

  const nonceSuffix = fromHex(flowNodePubkey); // 33 字节

  const targetHex = calculateTargetFromNBits(difficultyTarget);
  console.log('Starting PoW mining...');
  const nonce = await mineNonce(noncePrefix, nonceSuffix, targetHex, (att, hash, n) => {
    if (att % 5000 === 0) console.log(`  attempts=${att}, nonce=${n}`);
  });
  console.log(`PoW complete: nonce=${nonce}`);

  // 6. 构建预签名载荷（59字节）并签名
  const payload = buildFlowNodeRegisterPayload({
    uuid,
    registerDifficultyTarget: difficultyTarget,
    nonce,
    flowNodePubkey,
  });
  const sig = await signData(payload, flowNodePrivateKey);

  // 7. 组装消息并序列化
  const msgBytes = serializeFlowNodeRegister({
    msgType: MsgType.FLOW_NODE_REGISTRATION,
    uuid,
    registerDifficultyTarget: difficultyTarget,
    nonce,
    flowNodePubkey,
    flowNodeSignature: toHex(sig) as any,
  });

  // 8. 发送到后端
  console.log('Submitting registration...');
  const res = await sendFlowNodeRegisterMsg(client, Array.from(msgBytes));

  if (res.code === 200) {
    console.log('Registration successful!');
    console.log('  ID:', res.data.id);
    console.log('  txid:', res.data.txid);
    return res.data;
  } else {
    throw new Error(`Registration failed: ${res.message}`);
  }
}

// 使用
const difficultyTarget = '0x1effffff'; // 从 getLastBlock() 获取
const centralPubkey = '03cccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
registerFlowNode(centralPubkey, difficultyTarget).catch(console.error);
```

---

## 类型速查

```typescript
// 基础类型
type HexString = string;    // 无 0x 前缀的十六进制字符串
type Pubkey    = HexString; // 66字符（33字节压缩公钥）
type Signature = HexString; // 128字符（64字节 ECDSA 签名）
type UUID      = HexString; // 32字符（16字节 UUID，无破折号）

// 消息类型
enum MsgType {
  FLOW_NODE_REGISTRATION = 0,
  CENTRAL_KEY_AUTH       = 1,
  CENTRAL_KEY_FREEZE     = 2,
  FLOW_NODE_FREEZE       = 3,
  TRANSACTION_RECORD      = 4,
  TRANSACTION_MOUNT      = 5,
}

// 货币类型
enum CurrencyType {
  GOLD_MICROGRAM = 0,
  RMB_CENT       = 1,
}
```

---

## 错误处理

```typescript
import { ApiClient } from '@nmsci/sdk';

const client = new ApiClient({ baseUrl: 'http://localhost:8080' });

async function safeApiCall<T>(fn: () => Promise<{ code: number; message: string; data: T }>) {
  try {
    const res = await fn();
    if (res.code !== 200) {
      throw new Error(`API Error [${res.code}]: ${res.message}`);
    }
    return res.data;
  } catch (e) {
    if (e instanceof TypeError && e.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the server');
    }
    throw e;
  }
}

// 使用
const block = await safeApiCall(() => client.get('/block-chain/last'));
```

---

## 浏览器兼容性

本 SDK 依赖以下 Web API：

| API | 最低版本 |
|-----|---------|
| `crypto.subtle` | Chrome 37, Firefox 34, Safari 11, Edge 12 |
| `crypto.getRandomValues` | 所有现代浏览器 |

如需在旧版浏览器中使用，可引入 `crypto` polyfill（如 `webcrypto-liner`）；Node.js 环境建议使用 >= 18。
