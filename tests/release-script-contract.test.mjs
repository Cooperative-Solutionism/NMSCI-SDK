import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const releaseScript = readFileSync('scripts/release.mjs', 'utf8');
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');
const readme = readFileSync('README.md', 'utf8');
const normalizedCiWorkflow = ciWorkflow.replace(/\r\n/g, '\n');
const workflowSources = readdirSync('.github/workflows')
  .filter((file) => /\.ya?ml$/i.test(file))
  .map((file) => ({
    file,
    source: readFileSync(`.github/workflows/${file}`, 'utf8'),
  }));

function expectInOrder(source, snippets) {
  let previous = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet);
    expect(index, `Missing snippet: ${snippet}`).toBeGreaterThan(-1);
    expect(index, `Snippet out of order: ${snippet}`).toBeGreaterThan(previous);
    previous = index;
  }
}

function expectNotContains(source, snippets) {
  for (const snippet of snippets) {
    expect(source, `Forbidden snippet: ${snippet}`).not.toContain(snippet);
  }
}

function expectNoWorkflowContains(snippets) {
  for (const { file, source } of workflowSources) {
    expectNotContains(source, snippets);
    expect(source.replace(/\r\n/g, '\n'), `Forbidden tag trigger in ${file}`).not.toMatch(/^\s*tags(?:-ignore)?:/m);
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
      "run(`npm publish --access public --ignore-scripts --dry-run${distTagArg}`)",
    ]);
    expectInOrder(releaseScript, [
      "run('npm run test:pack:prepared')",
      "step('发布到 npm / npm publish')",
      "run(`npm publish --access public --ignore-scripts${distTagArg}${otpArg}`)",
    ]);
  });

  it('keeps CI validation-only and avoids duplicate build work', () => {
    expect(normalizedCiWorkflow).toContain("on:\n  push:\n    branches:\n      - '**'\n  pull_request:");
    expect(normalizedCiWorkflow).toContain("matrix:\n        node-version:\n          - 20.x\n          - 22.x");
    expect(normalizedCiWorkflow).toContain("  runtime-smoke:\n    name: Runtime smoke Node ${{ matrix.node-version }}");
    expect(normalizedCiWorkflow).toContain("matrix:\n        node-version:\n          - 18.x");
    expect(normalizedCiWorkflow).toContain(
      "      - name: Install dependencies\n        run: npm ci\n\n      - name: Build\n        run: npm run build\n\n      - name: Pack smoke test\n        run: npm run test:pack:prepared",
    );
    expect(normalizedCiWorkflow).not.toMatch(/^\s*tags(?:-ignore)?:/m);
    expect(normalizedCiWorkflow).not.toMatch(/^\s*run:\s*npm run test:pack\s*$/m);
    expectNoWorkflowContains([
      'NODE_AUTH_TOKEN',
      'NPM_TOKEN',
      '--provenance',
      'provenance',
      'npm publish',
      'id-token: write',
    ]);
    expectInOrder(ciWorkflow, [
      'run: npm run test:encoding',
      'run: npm run typecheck',
      'run: npm test',
      'run: npm run test:types',
      'run: npm run build',
      'run: npm run test:pack:prepared',
    ]);
  });

  it('documents runtime and development Node.js support separately', () => {
    expect(readme).toContain('运行时支持：Node.js >= 18');
    expect(readme).toContain('开发/测试工具链：Node.js 20.19+ 或 22.12+');
    expect(readme).toContain('Node 18 仅执行构建后 pack 运行时冒烟测试');
  });
});
