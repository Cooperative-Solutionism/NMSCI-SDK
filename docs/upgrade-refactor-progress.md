# NMSCI SDK 升级重构进度

更新时间：2026-05-23

## 已完成

### 阶段一：协议与文档对齐

- 新增 `src/protocol/spec.ts`，集中维护 6 类消息的 `msgType`、提交长度、完整长度、预签名载荷长度和中心签名载荷长度。
- README 已更新为“协议完整字节数”和“客户端提交字节数”两套长度，并说明 `confirmTimestamp`/`centralSignature` 由后端补齐。
- README 发送示例已从 JSON `post` 改为二进制 `postBinary`，并改用 `serializeXxxSubmitPayload`。
- README 认证说明已调整为传入裸 token，SDK 自动加 `Bearer`。

### 阶段二：提交载荷 API

- 为 1-5 类消息新增 `serializeXxxSubmitPayload`，发送长度分别为 148/115/148/263/269。
- 为 0-5 类消息提供 `serializeXxxFullMessage`，完整长度分别为 123/220/187/220/335/341。
- 保留原 `serializeXxx` 作为完整协议消息兼容别名。
- 新增 `verifyReturnedFullMessageLength` 和 `verifyTxid`，用于校验后端返回的 `rawBytes`/`txid`。
- 修正 `getTransactionMountMsgByMountedTransactionRecordId` 返回类型为单个 `TransactionMountMsg`。

### 阶段三：编码和密码学加固

- `fromHex` 增加非法字符和期望长度校验。
- `toBytesBigEndian` 增加无符号整数范围校验，拒绝负数和溢出。
- 新增 `pubkeyToBytes`、`signatureToBytes`、`nBitsToBytes`，统一压缩公钥、签名和难度字段校验。
- `validatePublicKey` 复用压缩公钥编码规则。
- 新增 `doubleSha256`/`doubleSha256Hex` 到 `crypto.ts`，`pow.ts` 复用同一实现并移除重复 hex 工具。
- 新增 `validateSignatureLowS`，便于发送前检查签名规范性。

### 阶段四：API Client 重构

- `postBinary`/`postBinaryNoResponse` 已修复 `Uint8Array.subarray` 底层缓冲区多发问题。
- 新增 `ApiClientError`，携带 `status`、`response`、`url`。
- `get` query 支持 `string | number | boolean | undefined`。
- API path 参数已使用 `encodeURIComponent`。
- 统一 JSON 解析、HTTP 非 2xx、后端 `code !== 200`、空响应处理。
- `SdkConfig` 支持注入 `fetch`，便于单元测试和 Node 环境适配。

### 阶段六：测试与工程化基线

- 新增 `npm run typecheck`。
- 新增 Vitest 用例：
  - 编码校验。
  - 6 类消息 pre-sign/submit/full 长度。
  - API Client subarray body 裁剪、query 序列化和业务错误。
- 通过 `npm install` 修复 Rollup optional dependency 缺失问题。
- `package.json` 增加 `engines.node >=18` 和 `sideEffects: false`。

### 阶段五：类型模型升级

- API wire DTO 已拆分为 `*Raw` 类型，保留后端 JSON number 形态。
- 业务 DTO 已提供 normalized 类型，`amount`、`confirmTimestamp`、`height`、区块时间戳和消费链金额/时间戳等 64 位字段转换为 `bigint`。
- 新增 `normalizeApiResponse`、`normalizeApiResponseList` 以及各业务 DTO 的 normalize 函数。
- normalize 会拒绝超过 `Number.MAX_SAFE_INTEGER` 的 number，避免静默转换已经丢精度的值。
- README 已标注后端 JSON number 的安全整数风险，并说明 difficulty target 保持 hex string。

### P2：高层入口和子路径导出

- 新增 `NmsciSdk` 组合型服务入口，封装 flow-node、central-pubkey、transaction、block、consume-chain、returning-flow-rate 等分组 API。
- 新增 `src/api/index.ts`、`src/messages/index.ts`、`src/protocol/index.ts`。
- `package.json` 增加 `./api`、`./messages`、`./protocol` 子路径 exports。
- `tsup` 调整为多入口构建，并将 `elliptic` 打包进 ESM/CJS 输出，修复 Node ESM 直接导入 CJS 依赖的运行时问题。

## 验证结果

- `git diff --check`：通过。
- `npm run typecheck`：通过。
- `npm test`：通过，5 个测试文件、18 个测试用例。
- `npm run build`：通过。
- 子路径 ESM 导入验证：通过，`@nmsci/sdk`、`@nmsci/sdk/api`、`@nmsci/sdk/messages`、`@nmsci/sdk/protocol` 均可由 Node 直接导入。

## 待继续

- Low-S 验签场景、PoW target 精确测试和真实签名验签测试还可继续补强。
- 还可以继续补充 `noUnusedLocals`、`noUnusedParameters`、`exactOptionalPropertyTypes` 等更严格 TypeScript 选项。
