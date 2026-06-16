# Release CI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the local release path, remove duplicated CI build work, improve README examples, and reduce false positives in the encoding audit.

**Architecture:** Keep runtime SDK code unchanged. Make pack smoke testing reusable by adding a prepared mode, make the encoding scanner testable with exported pure functions, then wire CI and the release script to the same build/pack sequence. README is updated last so documentation matches the implemented scripts.

**Tech Stack:** Node.js ESM scripts, npm scripts, GitHub Actions, Vitest, TypeScript/tsup.

---

## File Structure

- Modify: `scripts/smoke-pack.mjs`
  - Add `--skip-build`.
  - Export `parseSmokePackArgs()` for tests.
  - Keep default self-contained build behavior.
- Create: `tests/smoke-pack-options.test.mjs`
  - Unit tests for pack script argument parsing.
- Modify: `package.json`
  - Add `test:pack:prepared`.
- Modify: `scripts/check-text-encoding.mjs`
  - Export pure scanner functions.
  - Replace broad single-codepoint mojibake checks with contextual fragment patterns.
  - Keep CLI behavior unchanged for users.
- Create: `tests/check-text-encoding.test.mjs`
  - Unit tests for clean text, replacement character, and mojibake fragment detection.
- Modify: `scripts/release.mjs`
  - Add encoding and type-level tests to the quality gate.
  - Run `npm run test:pack:prepared` after build and before publish/dry-run publish.
- Create: `tests/release-script-contract.test.mjs`
  - Contract tests for release command order and no provenance/publish workflow assumptions.
- Modify: `.github/workflows/ci.yml`
  - Move build before pack smoke and use `test:pack:prepared`.
- Modify: `README.md`
  - Add missing import in raw download snippet.
  - Sync local verification and release docs with new script behavior.

## Task 1: Add Prepared Pack Smoke Mode

**Files:**
- Modify: `scripts/smoke-pack.mjs`
- Modify: `package.json`
- Create: `tests/smoke-pack-options.test.mjs`

- [ ] **Step 1: Write the failing argument parser tests**

Create `tests/smoke-pack-options.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import { parseSmokePackArgs } from '../scripts/smoke-pack.mjs';

describe('smoke-pack CLI options', () => {
  it('builds by default', () => {
    expect(parseSmokePackArgs([])).toEqual({ skipBuild: false });
  });

  it('can skip the build when dist has already been prepared', () => {
    expect(parseSmokePackArgs(['--skip-build'])).toEqual({ skipBuild: true });
  });

  it('rejects unknown options', () => {
    expect(() => parseSmokePackArgs(['--unknown'])).toThrow('Unknown smoke-pack option: --unknown');
  });
});
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```powershell
npm test -- tests/smoke-pack-options.test.mjs
```

Expected: FAIL because `scripts/smoke-pack.mjs` does not export `parseSmokePackArgs`.

- [ ] **Step 3: Refactor `scripts/smoke-pack.mjs` with `--skip-build` support**

Replace the current top-level implementation with this content:

```js
#!/usr/bin/env node
// @ts-check
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fallbackNpmCli = resolve(root, 'node_modules/npm/bin/npm-cli.js');
const npmCli = process.env.npm_execpath || (existsSync(fallbackNpmCli) ? fallbackNpmCli : undefined);

if (!npmCli) {
  throw new Error('Unable to locate npm CLI. Run this script through npm or install npm locally.');
}

export function parseSmokePackArgs(argv = process.argv.slice(2)) {
  const options = { skipBuild: false };

  for (const arg of argv) {
    if (arg === '--skip-build') {
      options.skipBuild = true;
    } else {
      throw new Error(`Unknown smoke-pack option: ${arg}`);
    }
  }

  return options;
}

const run = (cmd, args, options = {}) => {
  execFileSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
};

const capture = (cmd, args, options = {}) =>
  execFileSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });

const runNpm = (args, options = {}) => run(process.execPath, [npmCli, ...args], options);
const captureNpm = (args, options = {}) => capture(process.execPath, [npmCli, ...args], options);

export function runSmokePack(options = parseSmokePackArgs()) {
  const tempDir = mkdtempSync(join(tmpdir(), 'nmsci-sdk-pack-'));

  try {
    if (!options.skipBuild) {
      runNpm(['run', 'build']);
    }

    const packJson = captureNpm(['pack', '--json', '--pack-destination', tempDir]);
    const [{ filename }] = JSON.parse(packJson);
    const tarball = join(tempDir, filename);

    writeFileSync(join(tempDir, 'package.json'), JSON.stringify({
      name: 'nmsci-sdk-pack-smoke',
      version: '1.0.0',
      private: true,
      type: 'module',
    }, null, 2));

    runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: tempDir });

    writeFileSync(join(tempDir, 'esm-smoke.mjs'), `
const entries = ['@nmsci/sdk', '@nmsci/sdk/api', '@nmsci/sdk/messages', '@nmsci/sdk/protocol'];
for (const entry of entries) {
  const mod = await import(entry);
  if (!mod || Object.keys(mod).length === 0) {
    throw new Error(\`ESM import produced an empty module for \${entry}\`);
  }
}
`);

    writeFileSync(join(tempDir, 'cjs-smoke.cjs'), `
const entries = ['@nmsci/sdk', '@nmsci/sdk/api', '@nmsci/sdk/messages', '@nmsci/sdk/protocol'];
for (const entry of entries) {
  const mod = require(entry);
  if (!mod || Object.keys(mod).length === 0) {
    throw new Error(\`CJS require produced an empty module for \${entry}\`);
  }
}
`);

    execFileSync(process.execPath, [join(tempDir, 'esm-smoke.mjs')], { cwd: tempDir, stdio: 'inherit' });
    execFileSync(process.execPath, [join(tempDir, 'cjs-smoke.cjs')], { cwd: tempDir, stdio: 'inherit' });
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSmokePack();
}
```

- [ ] **Step 4: Add the prepared pack npm script**

In `package.json`, add `test:pack:prepared` immediately after `test:pack`:

```json
    "test:pack": "node scripts/smoke-pack.mjs",
    "test:pack:prepared": "node scripts/smoke-pack.mjs --skip-build",
    "test:encoding": "node scripts/check-text-encoding.mjs",
```

- [ ] **Step 5: Verify pack option tests and both pack modes**

Run:

```powershell
npm test -- tests/smoke-pack-options.test.mjs
npm run build
npm run test:pack:prepared
npm run test:pack
```

Expected: all commands PASS. `test:pack:prepared` should not run its own build; `test:pack` should still build internally.

- [ ] **Step 6: Commit Task 1**

Run:

```powershell
git add package.json scripts/smoke-pack.mjs tests/smoke-pack-options.test.mjs
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "工具: 支持复用已构建产物的打包冒烟测试"
```

## Task 2: Refine Encoding Audit and Add Tests

**Files:**
- Modify: `scripts/check-text-encoding.mjs`
- Create: `tests/check-text-encoding.test.mjs`

- [ ] **Step 1: Write failing scanner tests**

Create `tests/check-text-encoding.test.mjs`:

```js
import { describe, expect, it } from 'vitest';
import { findSuspiciousEncodingMarkers } from '../scripts/check-text-encoding.mjs';

describe('text encoding audit', () => {
  it('accepts clean Chinese, English, and valid punctuation', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'README.md',
        text: '正常中文、English, SDK — TypeScript, 微秒（μs）',
      },
    ]);

    expect(findings).toEqual([]);
  });

  it('reports Unicode replacement characters with line and column', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'README.md',
        text: 'first line\\nabc\uFFFDdef',
      },
    ]);

    expect(findings).toEqual([
      {
        file: 'README.md',
        line: 2,
        column: 4,
        label: 'Unicode replacement character U+FFFD',
      },
    ]);
  });

  it('reports representative UTF-8 mojibake fragments', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'package.json',
        text: 'SDK \u9225? TypeScript',
      },
    ]);

    expect(findings).toEqual([
      {
        file: 'package.json',
        line: 1,
        column: 5,
        label: 'common UTF-8 mojibake fragment',
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the scanner tests to verify they fail**

Run:

```powershell
npm test -- tests/check-text-encoding.test.mjs
```

Expected: FAIL because `findSuspiciousEncodingMarkers` is not exported.

- [ ] **Step 3: Replace the scanner with exportable, contextual detection**

Replace `scripts/check-text-encoding.mjs` with:

```js
#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const textFilePattern = /\.(?:md|ts|tsx|js|mjs|json|ya?ml)$/u;

const suspiciousPatterns = [
  { label: 'Unicode replacement character U+FFFD', pattern: /\uFFFD/gu },
  {
    label: 'common UTF-8 mojibake fragment',
    pattern: /(?:\u9225[?\u2122\u0153]|\u951B[?\u5c7b\u5c8c]|\u9286[\u4e63\u20ac]|\u9429[\uE000-\uF8FF]|\u6D93[\u5a49\u7ec4\u54c4])/gu,
  },
];

export function getTrackedTextFiles() {
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

export function findSuspiciousEncodingMarkers(files) {
  const findings = [];

  for (const { file, text } of files) {
    for (const { label, pattern } of suspiciousPatterns) {
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(text)) !== null) {
        const location = getLineColumn(text, match.index);
        findings.push({
          file,
          line: location.line,
          column: location.column,
          label,
        });
      }
    }
  }

  return findings;
}

export function scanTrackedTextFiles() {
  return findSuspiciousEncodingMarkers(
    getTrackedTextFiles().map(file => ({
      file,
      text: readFileSync(file, 'utf8'),
    })),
  );
}

export function formatFinding(finding) {
  return `${finding.file}:${finding.line}:${finding.column} ${finding.label}`;
}

export function runEncodingAudit() {
  const findings = scanTrackedTextFiles();

  if (findings.length > 0) {
    console.error('Suspicious text encoding markers found:');
    for (const finding of findings) {
      console.error(`- ${formatFinding(finding)}`);
    }
    process.exitCode = 1;
  } else {
    console.log('No suspicious text encoding markers found in tracked text files.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEncodingAudit();
}
```

- [ ] **Step 4: Verify scanner tests and CLI**

Run:

```powershell
npm test -- tests/check-text-encoding.test.mjs
npm run test:encoding
```

Expected: both commands PASS, and the CLI prints:

```text
No suspicious text encoding markers found in tracked text files.
```

- [ ] **Step 5: Commit Task 2**

Run:

```powershell
git add scripts/check-text-encoding.mjs tests/check-text-encoding.test.mjs
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "工具: 降低文本编码检查误报"
```

## Task 3: Sync Release Script and CI Command Order

**Files:**
- Modify: `scripts/release.mjs`
- Modify: `.github/workflows/ci.yml`
- Create: `tests/release-script-contract.test.mjs`

- [ ] **Step 1: Write failing release contract tests**

Create `tests/release-script-contract.test.mjs`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const releaseScript = readFileSync('scripts/release.mjs', 'utf8');
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');

function expectInOrder(source, snippets) {
  let previous = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet);
    expect(index, `Missing snippet: ${snippet}`).toBeGreaterThan(-1);
    expect(index, `Snippet out of order: ${snippet}`).toBeGreaterThan(previous);
    previous = index;
  }
}

describe('release and CI command contracts', () => {
  it('runs the full local release quality gate before version bump', () => {
    expectInOrder(releaseScript, [
      "step('文本编码检查 / Text encoding')",
      "run('npm run test:encoding')",
      "step('类型检查 / Typecheck')",
      "run('npm run typecheck')",
      "step('单元测试 / Tests')",
      "run('npm test')",
      "step('类型级测试 / Type tests')",
      "run('npm run test:types')",
      "step('更新版本号 / Bump version')",
    ]);
  });

  it('runs pack smoke after build and before publish', () => {
    expectInOrder(releaseScript, [
      "step('构建 / Build')",
      "run('npm run build')",
      "step('打包冒烟测试 / Pack smoke')",
      "run('npm run test:pack:prepared')",
      "step('发布到 npm / npm publish')",
    ]);
  });

  it('keeps CI validation-only and avoids duplicate build work', () => {
    expect(ciWorkflow).not.toContain('id-token: write');
    expect(ciWorkflow).not.toContain('npm publish');
    expectInOrder(ciWorkflow, [
      'run: npm run test:encoding',
      'run: npm run typecheck',
      'run: npm test',
      'run: npm run test:types',
      'run: npm run build',
      'run: npm run test:pack:prepared',
    ]);
  });
});
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run:

```powershell
npm test -- tests/release-script-contract.test.mjs
```

Expected: FAIL because release and CI command order have not been updated yet.

- [ ] **Step 3: Update `scripts/release.mjs` quality gate**

Replace the current quality gate block:

```js
  // ── 2. 质量门禁 ───────────────────────────────────────────────────────────
  if (flags.skipTests) {
    warn('已跳过 typecheck 与单元测试（--skip-tests）。');
  } else {
    step('类型检查 / Typecheck');
    run('npm run typecheck');
    step('单元测试 / Tests');
    run('npm test');
    ok('质量门禁通过。');
  }
```

with:

```js
  // ── 2. 质量门禁 ───────────────────────────────────────────────────────────
  if (flags.skipTests) {
    warn('已跳过发布前质量门禁（--skip-tests）；仍会执行构建与打包冒烟测试。');
  } else {
    step('文本编码检查 / Text encoding');
    run('npm run test:encoding');
    step('类型检查 / Typecheck');
    run('npm run typecheck');
    step('单元测试 / Tests');
    run('npm test');
    step('类型级测试 / Type tests');
    run('npm run test:types');
    ok('质量门禁通过。');
  }
```

- [ ] **Step 4: Update `scripts/release.mjs` build block**

Replace the current build block:

```js
  // ── 5. 构建 ───────────────────────────────────────────────────────────────
  step('构建 / Build');
  run('npm run build');
  ok('构建完成。');
```

with:

```js
  // ── 5. 构建与打包冒烟测试 ─────────────────────────────────────────────────
  step('构建 / Build');
  run('npm run build');
  step('打包冒烟测试 / Pack smoke');
  run('npm run test:pack:prepared');
  ok('构建与打包冒烟测试完成。');
```

- [ ] **Step 5: Update release help text**

In `scripts/release.mjs`, update the help option description for `--skip-tests` from:

```text
  --skip-tests       跳过 typecheck 与单元测试（不推荐）
```

to:

```text
  --skip-tests       跳过发布前质量门禁（仍会构建和执行 pack smoke，不推荐）
```

Update the dry-run line from:

```text
  --dry-run          预演：跑检查/测试/构建并执行 npm publish --dry-run，不真正发布、不提交
```

to:

```text
  --dry-run          预演：跑检查/测试/构建/pack smoke 并执行 npm publish --dry-run，不真正发布、不提交
```

- [ ] **Step 6: Update CI workflow command order**

In `.github/workflows/ci.yml`, replace:

```yaml
      - name: Pack smoke test
        run: npm run test:pack

      - name: Build
        run: npm run build
```

with:

```yaml
      - name: Build
        run: npm run build

      - name: Pack smoke test
        run: npm run test:pack:prepared
```

- [ ] **Step 7: Verify release/CI contract tests and script commands**

Run:

```powershell
npm test -- tests/release-script-contract.test.mjs
npm run build
npm run test:pack:prepared
```

Expected: all commands PASS.

- [ ] **Step 8: Try release dry-run verification**

Run:

```powershell
npm run release:dry -- --skip-tests --yes
```

Expected preferred result: PASS, publishing dry-run completes and rolls back version files.

If this fails only because `npm whoami` or npm registry authentication is unavailable, record the exact failure in the implementation report, then run this fallback verification:

```powershell
npm test -- tests/release-script-contract.test.mjs
git diff -- package.json package-lock.json
```

Expected fallback result: contract tests PASS and no version-file diff remains.

- [ ] **Step 9: Commit Task 3**

Run:

```powershell
git add scripts/release.mjs .github/workflows/ci.yml tests/release-script-contract.test.mjs
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "工具: 强化发布门禁并优化 CI 构建顺序"
```

## Task 4: Update README Release and Verification Docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update raw download snippet**

Find the snippet under `### Raw 静态资源下载` that currently starts with:

```ts
const sdk = new NmsciSdk({ baseUrl: 'http://localhost:8080' });
const datBytes = await sdk.client.download('/dat/blk00000001.dat');
```

Replace it with:

```ts
import { NmsciSdk } from '@nmsci/sdk';

const sdk = new NmsciSdk({ baseUrl: 'http://localhost:8080' });
const datBytes = await sdk.client.download('/dat/blk00000001.dat');
```

- [ ] **Step 2: Update local verification command list**

In `## 开发与校验`, replace:

```bash
npm ci
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run test:pack
npm run build
```

with:

```bash
npm ci
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run build
npm run test:pack:prepared
```

- [ ] **Step 3: Add standalone pack smoke note**

After the `test:encoding` paragraph in `## 开发与校验`, add:

```markdown
`test:pack:prepared` 假定 `dist` 已由上一条 `npm run build` 生成，用于 CI / release 流程避免重复构建。单独在本地检查发布包时仍可运行 `npm run test:pack`，它会先构建再执行 pack 冒烟测试。
```

- [ ] **Step 4: Update release paragraph**

In `## 发布（维护者）`, replace the first paragraph that begins with `本包使用 scripts/release.mjs 一键发布。` with:

```markdown
本包使用 `scripts/release.mjs` 一键发布。脚本会按顺序执行：**环境检查 → 编码检查 → typecheck → 测试 → 类型级测试 → bump 版本 → 构建 → pack 冒烟测试 → `npm publish --access public` → git commit + tag**。`git commit`/`tag` 只在 `npm publish` 成功后才执行；任何中途失败都会逐字节回滚 `package.json` / `package-lock.json` 的版本改动，保持工作区干净，不会留下「已提交版本却未发布」的中间态。
```

- [ ] **Step 5: Update release dry-run command comment**

In the release command block, replace:

```bash
# 预演（强烈建议先跑一遍）：跑测试/构建并执行 npm publish --dry-run，不真正发布
```

with:

```bash
# 预演（强烈建议先跑一遍）：跑完整门禁、构建、pack 冒烟，并执行 npm publish --dry-run，不真正发布
```

- [ ] **Step 6: Verify README references**

Run:

```powershell
node -e "const fs=require('fs'); const readme=fs.readFileSync('README.md','utf8'); for (const s of ['import { NmsciSdk } from','@nmsci/sdk','npm run test:pack:prepared','npm run test:pack','pack 冒烟测试','编码检查 → typecheck']) { if (!readme.includes(s)) throw new Error('README missing '+s); } console.log('README release CI polish references verified.');"
npm run test:encoding
```

Expected: both commands PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```powershell
git add README.md
$env:GIT_AUTHOR_NAME='GPT5.5XH'
$env:GIT_AUTHOR_EMAIL='gpt5.5xh@example.com'
$env:GIT_COMMITTER_NAME='GPT5.5XH'
$env:GIT_COMMITTER_EMAIL='gpt5.5xh@example.com'
git commit -m "文档: 同步发布校验和打包冒烟说明"
```

## Task 5: Final Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm run test:encoding
npm run typecheck
npm test
npm run test:types
npm run build
npm run test:pack:prepared
npm run test:pack
git diff --check
```

Expected:

- Encoding audit passes.
- Typecheck passes.
- Vitest suite passes, including the three new script contract tests.
- Type tests pass.
- Build passes.
- Both prepared and standalone pack smoke commands pass.
- Whitespace check exits 0.

- [ ] **Step 2: Verify release dry-run or fallback**

Run:

```powershell
npm run release:dry -- --skip-tests --yes
```

Expected preferred result: command exits 0 and version-file changes are rolled back.

If blocked by npm authentication, run:

```powershell
npm test -- tests/release-script-contract.test.mjs
git diff -- package.json package-lock.json
```

Expected fallback result: release command contract test passes and no version-file diff remains.

- [ ] **Step 3: Confirm final git state and commits**

Run:

```powershell
git status --short --branch
git log -6 --format="%h %an %cn %s"
```

Expected:

- Working tree is clean.
- Latest implementation commits use author and committer `GPT5.5XH`.
- Commit messages are Chinese except existing conventional prefixes such as `CI:`.

## Self-Review

- Spec coverage: pack prepared mode is Task 1; encoding precision and tests are Task 2; local release gate and CI command order are Task 3; README polish is Task 4; full verification and release dry-run/fallback are Task 5.
- Placeholder scan: no unresolved placeholders or vague implementation steps remain.
- Type/API consistency: planned scripts are `test:pack`, `test:pack:prepared`, `test:encoding`, and existing `release:dry`; README and CI use the same command names.
