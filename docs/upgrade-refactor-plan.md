# NMSCI SDK 升级重构方案

生成时间：2026-05-23
适用项目：`NMSCI-sdk`
参考来源：

- 协议：`D:\Data\code\circular-trading-system\NMSCI\PROTOCOL.md`
- 后端：`D:\Data\code\circular-trading-system\NMSCI`
- SDK：`D:\Data\code\circular-trading-system\NMSCI-sdk`

## 1. 结论

当前 SDK 的协议序列化代码已经部分对齐新版协议，尤其是完整消息长度：

| 消息类型 | 名称 | 协议完整长度 | SDK 当前完整长度 | 后端 POST 当前接收长度 |
|---:|---|---:|---:|---:|
| 0 | 流转节点注册 | 123 | 123 | 123 |
| 1 | 中心公钥公证 | 220 | 220 | 148 |
| 2 | 中心公钥冻结 | 187 | 187 | 115 |
| 3 | 流转节点冻结 | 220 | 220 | 148 |
| 4 | 交易记录 | 335 | 335 | 263 |
| 5 | 交易挂载 | 341 | 341 | 269 |

这里不是单纯的 SDK 或后端错误，而是存在两个不同层次：

- 协议完整消息：包含 `confirmTimestamp` 和 `centralSignature`，用于存储、区块固定、`rawBytes`、`txid`。
- 客户端提交载荷：客户端发送前无法生成中心时间戳和中心签名，因此后端 POST 当前只接收不含这两项的载荷。

重构重点是把这两个层次在 SDK 中显式建模，而不是继续用一个 `serializeXxx` 同时表达“提交给后端”和“完整协议消息”。

## 2. 当前主要问题

### 2.1 文档与协议不一致

SDK README 仍保留旧长度：

- 中心公钥公证：148
- 中心公钥冻结：115
- 流转节点冻结：148
- 交易记录：263
- 交易挂载：269

但 `NMSCI/PROTOCOL.md` 和后端 `MsgTypeEnum` 均声明新版完整长度为 `220/187/220/335/341`。README 应更新为新版完整协议，并额外说明 POST 接收的是客户端提交载荷。

### 2.2 SDK 缺少“提交载荷”与“完整消息”的边界

当前 SDK 消息模块主要提供完整序列化，例如：

- `serializeCentralPubkeyEmpower` 输出 220 字节
- `serializeCentralPubkeyLocked` 输出 187 字节
- `serializeFlowNodeLocked` 输出 220 字节
- `serializeTransactionRecord` 输出 335 字节
- `serializeTransactionMount` 输出 341 字节

但是后端 POST `/send` 当前接收的是未包含中心补签字段的载荷：

- 公证/冻结类：前置字段 + 流转节点或中心预签名
- 交易类：前置字段 + 消费节点签名 + 流转节点签名

如果 SDK 直接把完整消息发到当前后端，会触发 `@ByteArraySize` 校验失败。

### 2.3 后端 Controller/Converter 与协议完整长度命名不清晰

后端 `MsgTypeEnum` 是完整协议长度，但 Controller/Converter 的 `@ByteArraySize` 和 `fromByteArray` 使用提交载荷长度：

- `CentralPubkeyEmpowerMsgController`：148
- `CentralPubkeyLockedMsgController`：115
- `FlowNodeLockedMsgController`：148
- `TransactionRecordMsgController`：263
- `TransactionMountMsgController`：269

这些长度符合“客户端提交载荷”，但注释和错误信息容易误导，例如 `CentralPubkeyEmpowerMsgConverter` 校验 `148`，错误信息却写 `expected 220 bytes`。

### 2.4 API 类型存在返回值不匹配

SDK 中 `getTransactionMountMsgByMountedTransactionRecordId` 当前声明返回 `TransactionMountMsg[]`，但后端 Controller 返回 `ResponseResult<TransactionMountMsg>`。

应调整为单个对象，或新增兼容别名并废弃旧声明。

### 2.5 二进制发送存在潜在 bug

`ApiClient.postBinary` 当前直接发送 `Uint8Array.buffer`。如果调用方传入的是 `subarray`，会把底层 ArrayBuffer 的多余字节一并发送。

应按 `byteOffset` 和 `byteLength` 裁剪：

```ts
body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
```

### 2.6 类型安全不足

后端大量 `Long` 字段以 JSON number 返回，包括金额、区块高度、微秒时间戳。SDK 当前也多数使用 `number`。这在 JavaScript 中可能超过 `Number.MAX_SAFE_INTEGER`。

SDK 应提供明确策略：

- 对 wire JSON 保持 `number`，但文档标注安全整数风险；
- 或提供 `normalize` 层，把金额、时间戳、高度转换为 `bigint`/字符串；
- 对序列化输入继续使用 `bigint`，因为协议字段是 8 字节整数。

### 2.7 校验、测试和工程化不足

当前没有 Vitest 测试文件。高风险模块包括：

- hex/UUID/pubkey/signature 长度校验
- 各消息提交载荷长度和完整长度
- secp256k1 签名与 Low-S
- PoW target 计算和 nonce 挖矿
- API binary body 裁剪

构建环境也存在 Rollup optional dependency 缺失问题，需要通过重新安装依赖修复。

## 3. 目标架构

### 3.1 协议常量集中化

新增 `src/protocol/spec.ts`：

```ts
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
```

所有序列化、测试、README 表格都从这份常量推导，避免长度散落。

### 3.2 消息模块拆分为三个层次

每类消息提供以下函数：

- `buildXxxPreSignPayload`：签名/PoW 的前置载荷。
- `serializeXxxSubmitPayload`：客户端 POST `/send` 使用的提交载荷。
- `serializeXxxFullMessage`：完整协议消息，用于校验后端返回 `rawBytes` 或离线处理。

保留当前 `serializeXxx` 作为兼容别名，但建议标记：

- 注册消息：`serializeFlowNodeRegister` 仍等于提交载荷和完整消息。
- 其他消息：`serializeXxx` 建议迁移为 `serializeXxxFullMessage`，同时新增 `serializeXxxSubmitPayload` 给 API 发送使用。

### 3.3 编码工具严格化

升级 `src/core/encoding.ts`：

- `fromHex(hex, expectedBytes?)`：拒绝非法字符，支持长度校验。
- `toUint16BE/toUint32BE/toUint64BE`：检查取值范围，不允许负数和溢出。
- `uuidToBytes`：同时支持带连字符和无连字符 UUID，并校验 hex。
- `pubkeyToBytes`：必须 33 字节压缩公钥，前缀 `02` 或 `03`。
- `signatureToBytes`：必须 64 字节。
- `nBitsToBytes`：必须 4 字节，允许 `0x` 前缀。

### 3.4 API Client 统一请求层

重构 `ApiClient`：

- 新增私有 `request<T>()` 统一处理 `GET/POST/BINARY`。
- `postBinary` 使用裁剪后的 ArrayBuffer。
- 支持 HTTP 非 2xx 错误，保留后端 `ResponseResult` 的 `code/message/data`。
- `get` 的 query 类型从 `Record<string, string>` 扩展为 `Record<string, string | number | boolean | undefined>`。
- 允许配置 `fetch` 实现，方便测试和 Node 兼容。
- 明确 `authToken` 传入裸 token，SDK 自动添加 `Bearer`。

### 3.5 高层业务 API

在保留函数式 API 的同时，可以新增一个组合型服务层：

```ts
const sdk = new NmsciSdk({ baseUrl });

await sdk.flowNodeRegister.send(submitPayload);
await sdk.transactionRecord.getByFlowNodePubkey(pubkey);
await sdk.returningFlowRate.getByPubkey({ target, currencyType });
```

这能减少用户到处手动传 `client` 的负担。原函数式 API 保留，避免破坏已有调用方。

## 4. API 对齐清单

### 4.1 发送接口

| SDK 函数 | 后端路径 | 当前后端接收长度 | 建议 SDK 入参 |
|---|---|---:|---|
| `sendFlowNodeRegisterMsg` | `POST /flow-node-register-msg/send` | 123 | `serializeFlowNodeRegisterSubmitPayload` |
| `sendCentralPubkeyEmpowerMsg` | `POST /central-pubkey-empower-msg/send` | 148 | `serializeCentralPubkeyEmpowerSubmitPayload` |
| `sendCentralPubkeyLockedMsg` | `POST /central-pubkey-locked-msg/send` | 115 | `serializeCentralPubkeyLockedSubmitPayload` |
| `sendFlowNodeLockedMsg` | `POST /flow-node-locked-msg/send` | 148 | `serializeFlowNodeLockedSubmitPayload` |
| `sendTransactionRecordMsg` | `POST /transaction-record-msg/send` | 263 | `serializeTransactionRecordSubmitPayload` |
| `sendTransactionMountMsg` | `POST /transaction-mount-msg/send` | 269 | `serializeTransactionMountSubmitPayload` |

### 4.2 查询接口修正

需要修正：

- `getTransactionMountMsgByMountedTransactionRecordId` 返回值应为 `ApiResponse<TransactionMountMsg>`，不是数组。

需要关注：

- `TransactionRecordMsgController#getTransactionRecordMsgByConsumeNodePubkeyAndFlowNodePubkey` 当前使用 `ByteArrayUtil.base64ToBytes` 解析 path 参数，而其他类似接口使用 hex。SDK 当前传 hex，后端这里可能会查询失败。建议后端统一为 hex；SDK 文档暂时标注该接口存在后端解析不一致风险。

### 4.3 中心公钥冻结接口

后端 `sendCentralPubkeyLockedMsg` 返回 `void`，SDK 当前 `postBinaryNoResponse` 是合理的。建议在文档中说明该接口成功后后端会生成最终区块并 `System.exit(0)`，调用方不能期待普通 JSON 响应。

## 5. 实施阶段

### 阶段一：协议与文档对齐

目标：先消除“长度到底是多少”的歧义。

工作项：

1. 新增 `src/protocol/spec.ts`，集中维护完整长度、提交长度、签名载荷长度。
2. README 更新为新版完整协议长度。
3. README 新增“客户端提交载荷”表，说明 POST 发送长度。
4. API 示例中二进制发送统一使用 `postBinary`，不再用 `post`。
5. 标注 `PROTOCOL.md` 为协议基准，后端 Controller 当前是提交载荷基准。

验收：

- README 中不再出现旧长度作为“协议完整长度”。
- SDK 文档能解释为什么完整消息 335 字节，但 POST 发送 263 字节。

### 阶段二：提交载荷 API

目标：让 SDK 能直接对接当前后端。

工作项：

1. 为 1-5 类消息新增 `serializeXxxSubmitPayload`。
2. 保留 `serializeXxxFullMessage` 生成完整协议消息。
3. `sendXxxMsg` 文档和示例改为传提交载荷。
4. `signXxxPayload` 校验签名载荷长度：
   - 注册：59
   - 中心公钥公证/流转节点冻结：84
   - 中心公钥冻结：51
   - 交易记录：135
   - 交易挂载：141
5. 对后端返回的 `rawBytes` 增加可选校验函数：
   - `verifyReturnedFullMessageLength(msg)`
   - `verifyTxid(rawBytes, txid)`

验收：

- 发送公证、冻结、交易记录、交易挂载时，SDK 默认发送 148/115/148/263/269 字节。
- 后端返回对象中的 `rawBytes` 是 220/187/220/335/341 字节。

### 阶段三：编码和密码学加固

目标：减少非法输入在底层静默通过。

工作项：

1. `fromHex` 拒绝非法字符。
2. `toBytesBigEndian` 增加范围校验。
3. `validatePublicKey` 与 `pubkeyToBytes` 复用同一规则。
4. 新增 `validateSignatureLowS`，便于发送前本地校验。
5. 抽出 `doubleSha256`，`crypto.ts` 和 `pow.ts` 复用同一实现。
6. `pow.ts` 复用 `encoding.ts` 的 `fromHex/toHex`，移除重复函数。

验收：

- 非法 hex、错误长度、负数、超范围 nonce 都能抛出明确错误。
- 签名与验签测试覆盖 Low-S 情况。

### 阶段四：API Client 重构

目标：稳定处理真实网络错误和二进制数据。

工作项：

1. 修复 `Uint8Array.subarray` 发送问题。
2. 增加 `ApiClientError`，携带 `status`、`response`、`url`。
3. `get` 支持 number/boolean query。
4. 所有 path 参数进行 `encodeURIComponent`。
5. 统一 JSON 解析错误处理。
6. 加入可注入 `fetch`，方便单元测试。

验收：

- 单元测试能证明 subarray 不会发送额外字节。
- 非 2xx、后端 `code !== 200`、空响应都能得到可诊断错误。

### 阶段五：类型模型升级

目标：减少 JS number 精度风险。

工作项：

1. 将协议层 8 字节整数继续使用 `bigint`。
2. API DTO 层提供 `Raw` 和 `Normalized` 两类类型：
   - `TransactionRecordMsgRaw.amount: number`
   - `TransactionRecordMsg.amount: bigint`
3. 新增 `normalizeApiResponse` 或独立解析函数。
4. 对 `confirmTimestamp`、`height`、`amount` 标注安全整数风险。
5. difficulty target 保持 hex string，与后端 `IntToHexSerializer` 对齐。

验收：

- SDK 用户可以选择直接使用后端原始 JSON，也可以使用转换后的 bigint 类型。

### 阶段六：测试与发布

目标：建立可回归的 SDK 基线。

工作项：

1. 添加 `npm run typecheck`。
2. 添加 `npm run lint` 或至少启用 TypeScript：
   - `noUnusedLocals`
   - `noUnusedParameters`
   - `exactOptionalPropertyTypes`
3. 添加 Vitest：
   - encoding 测试
   - crypto 签名验签测试
   - pow target 测试
   - 6 类消息长度测试
   - submit/full 序列化测试
   - ApiClient binary body 测试
4. 修复当前 Rollup optional dependency 环境问题，建议使用 `npm ci` 重建依赖。
5. 更新 `package.json`：
   - `engines.node` 建议 `>=18`
   - `sideEffects: false`
   - `exports` 可按需增加子路径导出，如 `./protocol`、`./messages`、`./api`

验收：

- `npm run typecheck`
- `npm test`
- `npm run build`

## 6. 推荐目录结构

```text
src/
  api/
    client.ts
    endpoints/
      block.ts
      consume-chain.ts
      flow-node-register.ts
      central-pubkey-empower.ts
      central-pubkey-locked.ts
      flow-node-locked.ts
      transaction-record.ts
      transaction-mount.ts
      returning-flow-rate.ts
    types.ts
  core/
    bytes.ts
    crypto.ts
    pow.ts
    validation.ts
  messages/
    common.ts
    flow-node-register.ts
    central-pubkey-empower.ts
    central-pubkey-locked.ts
    flow-node-locked.ts
    transaction-record.ts
    transaction-mount.ts
  protocol/
    spec.ts
    types.ts
  index.ts
```

## 7. 兼容策略

建议采用小步兼容升级：

1. `0.2.x`：
   - 新增 `serializeXxxSubmitPayload` 和 `serializeXxxFullMessage`。
   - 保留现有 `serializeXxx`，但文档建议迁移。
   - 修复 API 返回类型和二进制发送 bug。
2. `0.3.x`：
   - 对 `serializeXxx` 发出废弃提示或改为明确别名。
   - 新增 normalized DTO。
   - 增加子路径 exports。
3. `1.0.0`：
   - 移除模糊命名 API。
   - 完整协议、提交载荷、返回 DTO 三层命名稳定。

## 8. 后端协同建议

虽然本方案面向 SDK，但后端也建议同步做以下修正：

1. Controller 注解名称从 `@ByteArraySize(148)` 语义上改为“提交载荷长度”，避免被理解为完整协议长度。
2. Converter 错误信息修正，例如 148 字节不要提示 expected 220 bytes。
3. `TransactionRecordMsgController` 双 pubkey 查询统一使用 hex，不要混用 base64。
4. `@ByteArraySize` 可以从 `MsgTypeEnum` 或单独常量读取，避免 Controller、Converter、协议枚举三处不一致。
5. 可以新增后端 OpenAPI 或生成 JSON schema，SDK 类型以后从 schema 生成。

## 9. 优先级

### P0

- 修复 README 协议长度。
- 新增提交载荷序列化函数。
- API 发送改用提交载荷。
- 修复 `postBinary` subarray bug。
- 修正 `getTransactionMountMsgByMountedTransactionRecordId` 返回类型。

### P1

- 集中协议常量。
- 编码严格校验。
- 补消息长度、签名、PoW、API Client 单元测试。
- 修复未使用导入和 CRLF 行尾问题。

### P2

- normalized DTO 和 bigint 支持。
- 高层 `NmsciSdk` 服务入口。
- 子路径导出和发布工程优化。

## 10. 风险与注意事项

- 不要把后端 POST 接收长度直接改成完整协议长度；当前服务端负责生成 `confirmTimestamp` 和 `centralSignature`，客户端没有能力提前生成这两项。
- SDK 的完整消息序列化仍然有价值，用于校验后端返回 `rawBytes`、离线生成块数据、测试协议一致性。
- 交易记录和交易挂载的 PoW 对象是前置载荷，不包含两个签名、时间戳和中心签名。
- 中心公钥冻结接口成功后后端会终止进程，SDK 不应强制要求 JSON 响应。
- 当前后端把一些 64 位整数作为 JSON number 输出，前端或 Node 调用方需要注意精度。
