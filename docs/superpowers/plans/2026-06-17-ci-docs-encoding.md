# CI Docs Encoding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add validation CI, document the newest SDK usage paths, and make text encoding checks repeatable.

**Architecture:** Keep runtime SDK code untouched. Add a small repository-level encoding audit script, wire it into npm scripts and GitHub Actions, then update README examples to reflect `sdk.normalized.*` and raw downloads. CI runs the same local verification commands documented in README.

**Tech Stack:** GitHub Actions, Node.js, npm, TypeScript, Vitest, existing tsup build pipeline.

---

## File Structure

- Create: `.github/workflows/ci.yml`
  - Push/PR validation workflow.
  - Uses Node `20.x` and `22.x` matrix.
  - Runs install, encoding scan, typecheck, tests, type tests, pack smoke test, and build.
- Create: `scripts/check-text-encoding.mjs`
  - Uses `git ls-files` to scan tracked text files only.
  - Fails on Unicode replacement characters and common mojibake marker code points.
  - Does not flag normal Chinese text or the valid Unicode em dash in `package.json`.
- Modify: `package.json`
  - Adds `test:encoding`.
- Modify: `README.md`
  - Adds raw static resource download examples.
  - Adds `sdk.normalized.*` examples.
  - Adds local development verification commands.
  - Adds a release note that npm trusted publishing/provenance is a separate follow-up.

## Task 1: Add Repeatable Text Encoding Audit

**Files:**
- Create: `scripts/check-text-encoding.mjs`
- Modify: `package.json`

- [ ] **Step 1: Create the encoding scan script**

Create `scripts/check-text-encoding.mjs` with this exact content:

```js
#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const textFilePattern = /\.(?:md|ts|tsx|js|mjs|json|ya?ml)$/u;

const suspiciousPatterns = [
  { label: 'Unicode replacement character U+FFFD', pattern: /\uFFFD/gu },
  { label: 'common UTF-8 mojibake marker U+9225', pattern: /\u9225/gu },
  { label: 'common UTF-8 mojibake marker U+00C3', pattern: /\u00C3/gu },
  { label: 'common UTF-8 mojibake marker U+00C2', pattern: /\u00C2/gu },
  { label: 'common UTF-8 mojibake marker U+951B', pattern: /\u951B/gu },
  { label: 'common UTF-8 mojibake marker U+9286', pattern: /\u9286/gu },
  { label: 'common UTF-8 mojibake marker U+6D93', pattern: /\u6D93/gu },
  { label: 'common UTF-8 mojibake marker U+95B3', pattern: /\u95B3/gu },
  { label: 'common UTF-8 mojibake marker U+8119', pattern: /\u8119/gu },
  { label: 'common UTF-8 mojibake marker U+8117', pattern: /\u8117/gu },
];

function getTrackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split(/\r?\n/u)
    .filter(Boolean)
    .filter(file => textFilePattern.test(file));
}

function getLineColumn(text, index) {
  const before = text.slice(0, index).split(/\r?\n/u);
  const lineText = before[before.length - 1] ?? '';
  return {
    line: before.length,
    column: [...lineText].length + 1,
  };
}

const findings = [];

for (const file of getTrackedFiles()) {
  const text = readFileSync(file, 'utf8');

  for (const { label, pattern } of suspiciousPatterns) {
    pattern.lastIndex = 0;

    let match;
    while ((match = pattern.exec(text)) !== null) {
      const location = getLineColumn(text, match.index);
      findings.push(`${file}:${location.line}:${location.column} ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error('Suspicious text encoding markers found:');
  for (const finding of findings) {
    console.error(`- ${finding}`);
  }
  process.exitCode = 1;
} else {
  console.log('No suspicious text encoding markers found in tracked text files.');
}
```

- [ ] **Step 2: Add the npm script**

Modify the `scripts` block in `package.json` so it includes `test:encoding` after `test:pack`:

```json
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:types": "tsc --noEmit -p tsconfig.type-tests.json",
    "test:pack": "node scripts/smoke-pack.mjs",
    "test:encoding": "node scripts/check-text-encoding.mjs",
    "test:watch": "vitest",
    "release": "node scripts/release.mjs",
    "release:dry": "node scripts/release.mjs --dry-run",
    "prepublishOnly": "npm run build"
  },
```

- [ ] **Step 3: Run the new encoding check**

Run:

```powershell
npm run test:encoding
```

Expected: PASS with:

```text
No suspicious text encoding markers found in tracked text files.
```

If it fails, stop and inspect the reported exact file/line before editing. Current pre-plan audit reported `NO_CONFIRMED_MOJIBAKE_MARKERS`, so a failure indicates the script pattern or file set needs review.

- [ ] **Step 4: Commit the encoding audit**

Run:

```powershell
git add package.json scripts/check-text-encoding.mjs
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "工具: 添加文本编码检查"
```

Expected: commit author and committer are `GPT5.5XH`.

## Task 2: Add GitHub Actions CI Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the CI workflow**

Create `.github/workflows/ci.yml` with this exact content:

```yaml
name: CI

on:
  push:
  pull_request:

permissions:
  contents: read

jobs:
  verify:
    name: Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version:
          - 20.x
          - 22.x

    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Check text encoding
        run: npm run test:encoding

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Type tests
        run: npm run test:types

      - name: Pack smoke test
        run: npm run test:pack

      - name: Build
        run: npm run build
```

- [ ] **Step 2: Validate the workflow references**

Run:

```powershell
node -e "const fs=require('fs'); const y=fs.readFileSync('.github/workflows/ci.yml','utf8'); for (const s of ['actions/checkout@v6','actions/setup-node@v6','npm ci','npm run test:encoding','npm run typecheck','npm test','npm run test:types','npm run test:pack','npm run build','20.x','22.x']) { if (!y.includes(s)) throw new Error('Missing '+s); } console.log('CI workflow references verified.');"
```

Expected: PASS with:

```text
CI workflow references verified.
```

- [ ] **Step 3: Run the CI command set locally once**

Run:

```powershell
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run test:pack
npm run build
```

Expected: all commands PASS.

- [ ] **Step 4: Commit the CI workflow**

Run:

```powershell
git add .github/workflows/ci.yml
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "CI: 添加验证工作流"
```

Expected: commit author and committer are `GPT5.5XH`.

## Task 3: Update README for Normalized API, Raw Downloads, and Local Checks

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the table of contents**

In the `## 目录` list, replace the current list with:

```markdown
- [安装](#安装)
- [快速开始](#快速开始)
- [核心概念](#核心概念)
- [API 客户端](#api-客户端)
- [核心工具模块](#核心工具模块)
- [消息序列化](#消息序列化)
- [API 接口一览](#api-接口一览)
- [完整使用示例](#完整使用示例)
- [类型速查](#类型速查)
- [错误处理](#错误处理)
- [浏览器兼容性](#浏览器兼容性)
- [开发与校验](#开发与校验)
- [发布（维护者）](#发布维护者)
```

- [ ] **Step 2: Add raw static resource docs after `### HTTP 方法`**

Insert this section after the existing JSON `client.get` / `client.post` example and before `### Raw 与 Normalized DTO`:

````markdown
### Raw 静态资源下载

`/dat/**` 和 `/source-code/**` 由后端直接返回文件内容，不包裹 `ResponseResult<T>`。这类接口应使用 raw 方法，SDK 不会尝试按 JSON 解析响应体。

```typescript
const response = await client.getRaw('/dat/blk00000001.dat');
const contentType = response.headers.get('content-type');
const bytes = await response.arrayBuffer();

const sourceArchive = await client.download('/source-code/source_code_v1.zip');
```

组合入口同样可以通过底层 client 访问：

```typescript
const sdk = new NmsciSdk({ baseUrl: 'http://localhost:8080' });
const datBytes = await sdk.client.download('/dat/blk00000001.dat');
```
````

- [ ] **Step 3: Add normalized high-level API docs after the normalize helper paragraph**

Insert this paragraph and example after the paragraph ending with `difficulty target 保持 hex string，与后端序列化保持一致。`:

````markdown
如果希望避免每次手动组合 normalize helper，可使用 `NmsciSdk.normalized.*`。它保留 `ApiResponse<T>` envelope，但 `data` 已经是规范化 DTO：

```typescript
import { NmsciSdk } from '@nmsci/sdk';

const sdk = new NmsciSdk({ baseUrl: 'http://localhost:8080' });

const block = await sdk.normalized.block.getLast();
const records = await sdk.normalized.transactionRecord.search(undefined, { page: 0, size: 20 });

const height = block.data.height; // bigint
const amount = records.data.content[0]?.amount; // bigint | undefined
```

原始 `sdk.*` 分组仍返回后端 wire JSON 类型，适合需要完全贴合后端响应的调用方。
````

- [ ] **Step 4: Add the local verification section before `## 发布（维护者）`**

Insert this section immediately before `## 发布（维护者）`:

````markdown
## 开发与校验

本地提交前建议按 CI 同序执行：

```bash
npm ci
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run test:pack
npm run build
```

`test:encoding` 会扫描已跟踪的文本文件，发现 Unicode replacement character 或常见 UTF-8 mojibake 标记时失败。不要仅凭 PowerShell 终端显示判断文件损坏；以 UTF-8 文件内容和该检查结果为准。
````

- [ ] **Step 5: Add the release provenance follow-up note**

In `## 发布（维护者）`, after the paragraph that starts with `本包使用 scripts/release.mjs`, add:

```markdown
> 当前 GitHub Actions 只做验证，不自动发布。若后续启用 npm Trusted Publishing / provenance，需要先在 npm 包侧配置 trusted publisher，再增加带 `id-token: write` 权限的发布 workflow，并使用满足 npm 要求的 Node/npm 版本。
```

- [ ] **Step 6: Verify README examples reference real APIs**

Run:

```powershell
node -e "const fs=require('fs'); const readme=fs.readFileSync('README.md','utf8'); for (const s of ['sdk.normalized.block.getLast','sdk.normalized.transactionRecord.search','client.getRaw','client.download','npm run test:encoding','开发与校验']) { if (!readme.includes(s)) throw new Error('README missing '+s); } console.log('README API examples verified.');"
```

Expected: PASS with:

```text
README API examples verified.
```

- [ ] **Step 7: Run the encoding check after README edits**

Run:

```powershell
npm run test:encoding
```

Expected: PASS with:

```text
No suspicious text encoding markers found in tracked text files.
```

- [ ] **Step 8: Commit README updates**

Run:

```powershell
git add README.md
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "文档: 补充 CI 校验和新 API 用法"
```

Expected: commit author and committer are `GPT5.5XH`.

## Task 4: Final Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run test:pack
npm run build
git diff --check
```

Expected:

- `test:encoding` reports no suspicious text encoding markers.
- `typecheck` passes.
- Vitest test suite passes.
- Type tests pass.
- Pack smoke test passes.
- Build passes.
- `git diff --check` exits 0.

- [ ] **Step 2: Confirm final git state and commits**

Run:

```powershell
git status --short --branch
git log -4 --format="%h %an %cn %s"
```

Expected:

- Working tree is clean.
- Latest implementation commits use author and committer `GPT5.5XH`.
- Commit messages are Chinese except the conventional `CI:` prefix.

## Self-Review

- Spec coverage: CI workflow is Task 2; README usage docs are Task 3; encoding audit is Task 1 and verified again in Task 4; npm publish workflow remains out of scope with a README follow-up note.
- Placeholder scan: no unresolved placeholder wording or unspecified implementation steps remain.
- Type/API consistency: README uses existing public APIs `NmsciSdk`, `client.getRaw`, `client.download`, `sdk.normalized.block.getLast`, and `sdk.normalized.transactionRecord.search`.
