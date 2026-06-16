#!/usr/bin/env node
// @ts-check
/**
 * @nmsci/sdk 自动发布脚本 / Automated release script
 *
 * 流程：环境检查 → 编码检查 → typecheck → 测试 → 类型级测试 → bump 版本
 *      → 构建 → pack 冒烟测试 → `npm publish --access public` → git commit + tag。
 *
 * 设计原则：git commit / tag 只在 `npm publish` 成功之后执行；创建版本 commit
 * 之前的失败会逐字节回滚 package.json / package-lock.json 的版本改动。commit/tag/publish
 * 边界失败可能需要按 `git status` 和实际发布状态人工清理。
 *
 * 用法见 `node scripts/release.mjs --help`。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = resolve(ROOT, 'package.json');
const LOCK_PATH = resolve(ROOT, 'package-lock.json');

// 常用发布分支；其它分支需 --any-branch 或交互确认
const ALLOWED_BRANCHES = new Set(['main', 'master', 'dev']);
const BUMP_KEYWORDS = new Set([
  'patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease',
]);
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

// ── 输出辅助 ────────────────────────────────────────────────────────────────
const TTY = process.stdout.isTTY;
const COLORS = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
/** @param {keyof typeof COLORS} color @param {string} s */
const paint = (color, s) => (TTY ? `${COLORS[color]}${s}${COLORS.reset}` : s);
const step = (m) => console.log(`\n${paint('cyan', '▶')} ${paint('bold', m)}`);
const info = (m) => console.log(`  ${m}`);
const ok = (m) => console.log(`${paint('green', '✔')} ${m}`);
const warn = (m) => console.warn(`${paint('yellow', '⚠')} ${m}`);
const fail = (m) => console.error(`${paint('red', '✖')} ${m}`);
/** @param {string} m @param {number} [code] */
const die = (m, code = 1) => { fail(m); process.exit(code); };

// ── 命令辅助 ────────────────────────────────────────────────────────────────
/** 流式执行命令；失败抛出。 @param {string} cmd @param {import('node:child_process').ExecSyncOptions} [opts] */
const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
/** 捕获 stdout（忽略 stderr 噪音）；失败抛出。 @param {string} cmd */
const capture = (cmd) =>
  execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
/** 捕获 stdout，失败返回 null。 @param {string} cmd */
const tryCapture = (cmd) => { try { return capture(cmd); } catch { return null; } };

const readPkg = () => JSON.parse(readFileSync(PKG_PATH, 'utf8'));

// bump 前的原始文件字节快照，用于精确回滚（不经过 git，故不会误伤
// package.json / package-lock.json 上的其它未提交改动）。
/** @type {{path: string, content: Buffer}[]} */
let versionFileSnapshots = [];
/** 在 bump 之前快照将被修改的文件。 */
const snapshotVersionFiles = () => {
  versionFileSnapshots = [PKG_PATH, LOCK_PATH]
    .filter(existsSync)
    .map((path) => ({ path, content: readFileSync(path) }));
};
/** 用快照逐字节还原版本文件改动。 */
const rollbackVersion = () => {
  for (const { path, content } of versionFileSnapshots) {
    try { writeFileSync(path, content); } catch { /* ignore */ }
  }
};

/** 交互式确认；--yes 直接通过；非交互式且未确认则中止。 @param {string} question */
async function confirm(question) {
  if (flags.yes) return true;
  if (!process.stdin.isTTY) {
    die('需要交互确认，但当前是非交互式终端。请加 --yes 以跳过确认。');
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const ans = await new Promise((res) => rl.question(`${question} [y/N] `, res));
    return /^y(es)?$/i.test(ans.trim());
  } finally {
    rl.close();
  }
}

function printHelp() {
  console.log(`
${paint('bold', '@nmsci/sdk 发布脚本')}

用法:
  npm run release -- [bump] [options]
  node scripts/release.mjs [bump] [options]

bump（默认 patch）:
  patch | minor | major | prepatch | preminor | premajor | prerelease
  或具体版本号，如 2.5.0、2.5.0-beta.0

options:
  --dry-run          预演：跑检查/测试/构建/pack smoke 并执行 npm publish --dry-run，不真正发布、不提交
  --skip-tests       跳过发布前质量门禁（仍会构建和执行 pack smoke，不推荐）
  --tag <dist-tag>   npm dist-tag（默认 latest，可用 next/beta 等）
  --preid <id>       预发布标识（配合 prerelease/prepatch，如 beta）
  --otp <code>       npm 双因素验证一次性密码
  --push             发布并提交后自动 git push（含标签，需已配置 remote）
  --any-branch       允许从非 main/master/dev 分支发布
  --allow-dirty      允许工作区存在未提交更改
  -y, --yes          跳过所有交互确认（用于 CI / 非交互式）
  -h, --help         显示本帮助

示例:
  npm run release                          # 补丁版本（如 2.0.1 → 2.0.2）
  npm run release -- minor                 # 次版本（2.0.1 → 2.1.0）
  npm run release -- 3.0.0                 # 指定版本
  npm run release -- prerelease --preid beta --tag next
  npm run release:dry                      # 预演，不发布
`);
}

// ── 参数解析 ────────────────────────────────────────────────────────────────
const flags = {
  dryRun: false, skipTests: false, yes: false, push: false,
  anyBranch: false, allowDirty: false, otp: null, distTag: 'latest', preid: null,
};
/** @type {string|null} */
let bump = null;

const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  switch (a) {
    case '-h': case '--help': printHelp(); process.exit(0); break;
    case '--dry-run': flags.dryRun = true; break;
    case '--skip-tests': flags.skipTests = true; break;
    case '-y': case '--yes': flags.yes = true; break;
    case '--push': flags.push = true; break;
    case '--any-branch': flags.anyBranch = true; break;
    case '--allow-dirty': flags.allowDirty = true; break;
    case '--otp': flags.otp = argv[++i]; break;
    case '--tag': flags.distTag = argv[++i]; break;
    case '--preid': flags.preid = argv[++i]; break;
    default:
      if (a.startsWith('-')) die(`未知参数: ${a}（使用 --help 查看用法）`);
      if (bump) die(`只能指定一个版本参数，多余的: "${a}"`);
      bump = a;
  }
}
bump ??= 'patch';
if (!BUMP_KEYWORDS.has(bump) && !SEMVER_RE.test(bump)) {
  die(`无效的版本参数 "${bump}"。应为 patch|minor|major|prepatch|preminor|premajor|prerelease，或具体版本号如 2.5.0`);
}
if (flags.otp && !/^\d{6,8}$/.test(flags.otp)) die('--otp 应为 6~8 位数字。');
// distTag / preid 会被拼进 shell 命令，限定安全字符集，防止注入与意外断行
if (!/^[a-z][a-z0-9-]*$/i.test(flags.distTag)) {
  die(`无效的 --tag "${flags.distTag}"（仅允许字母/数字/连字符，且以字母开头）。`);
}
if (flags.preid != null && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/i.test(flags.preid)) {
  die(`无效的 --preid "${flags.preid}"（仅允许字母/数字，以及中间的 . 或 -）。`);
}

// 跟踪状态，便于在异常时回滚
let bumped = false;
let committed = false;

async function main() {
  const pkg = readPkg();
  if (pkg.private) die('package.json 标记为 private，无法发布。');
  const fromVersion = pkg.version;
  const registry = tryCapture('npm config get registry') || 'https://registry.npmjs.org/';

  // ── 1. 环境检查 ───────────────────────────────────────────────────────────
  step('环境检查 / Preflight');
  if (tryCapture('git rev-parse --is-inside-work-tree') !== 'true') {
    die('当前目录不是 git 仓库。');
  }
  if (!flags.allowDirty && tryCapture('git status --porcelain')) {
    die('工作区有未提交的更改，请先提交或暂存（或加 --allow-dirty 跳过）。');
  }
  const branch = tryCapture('git rev-parse --abbrev-ref HEAD') || '(detached)';
  if (!ALLOWED_BRANCHES.has(branch) && !flags.anyBranch) {
    warn(`当前分支为 "${branch}"，不在常用发布分支(main/master/dev)中。`);
    if (!(await confirm(`确定要从 "${branch}" 分支发布吗？`))) die('已取消。', 0);
  }
  const whoami = tryCapture('npm whoami');
  if (!whoami) die('未登录 npm（npm whoami 失败）。请先运行 `npm login`。');
  ok(`npm 用户: ${whoami}`);
  ok(`分支: ${branch}    当前版本: ${fromVersion}`);

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

  // ── 3. 更新版本号（仅改文件，不碰 git） ───────────────────────────────────
  step('更新版本号 / Bump version');
  snapshotVersionFiles();
  const preidArg = flags.preid ? ` --preid ${flags.preid}` : '';
  run(`npm version ${bump} --no-git-tag-version${preidArg}`);
  bumped = true;
  const toVersion = readPkg().version;
  const tag = `v${toVersion}`;
  ok(`版本: ${fromVersion} → ${toVersion}`);

  // ── 4. 确认 ───────────────────────────────────────────────────────────────
  step('确认发布 / Confirm');
  info(`包名      : ${pkg.name}`);
  info(`版本      : ${toVersion}   (dist-tag: ${flags.distTag})`);
  info(`注册表    : ${registry}`);
  info(`访问级别  : public`);
  if (flags.dryRun) info(paint('yellow', '模式      : DRY RUN（不会真正发布 / 提交）'));
  if (!flags.dryRun && !(await confirm('确认发布以上内容吗？'))) {
    rollbackVersion();
    die('已取消，已回滚版本号。', 0);
  }

  // ── 5. 构建与打包冒烟测试 ─────────────────────────────────────────────────
  step('构建 / Build');
  run('npm run build');
  step('打包冒烟测试 / Pack smoke');
  run('npm run test:pack:prepared');
  ok('构建与打包冒烟测试完成。');

  // ── 6. 发布 ───────────────────────────────────────────────────────────────
  const distTagArg = flags.distTag && flags.distTag !== 'latest' ? ` --tag ${flags.distTag}` : '';
  const otpArg = flags.otp ? ` --otp ${flags.otp}` : '';

  if (flags.dryRun) {
    step('发布预演 / npm publish --dry-run');
    run(`npm publish --access public --dry-run${distTagArg}`);
    rollbackVersion();
    ok('DRY RUN 完成：未发布、未提交，已回滚版本号。');
    return;
  }

  step('发布到 npm / npm publish');
  try {
    run(`npm publish --access public${distTagArg}${otpArg}`);
  } catch {
    rollbackVersion();
    die('npm publish 失败，已回滚版本号（未产生 git 提交 / 标签）。请检查上方错误后重试。');
  }
  ok(`已发布 ${pkg.name}@${toVersion}`);

  // ── 7. git 提交 + 打标签（仅发布成功后） ─────────────────────────────────
  step('提交并打标签 / Git commit & tag');
  // 仅提交版本文件（pathspec 形式），避免在 --allow-dirty 下误带入其它已暂存改动
  run(`git commit -m "${toVersion}" -- package.json package-lock.json`);
  run(`git tag -a ${tag} -m "${toVersion}"`);
  committed = true;
  ok(`已创建提交与标签 ${tag}`);

  // ── 8. 可选推送 ───────────────────────────────────────────────────────────
  const hasRemote = !!tryCapture('git remote');
  if (flags.push) {
    if (!hasRemote) {
      warn('指定了 --push 但未配置 git remote，跳过推送。');
    } else {
      step('推送 / Git push');
      run('git push');
      run(`git push origin ${tag}`);
      ok('已推送提交与标签。');
    }
  }

  // ── 完成 ──────────────────────────────────────────────────────────────────
  step('完成 / Done ✅');
  info(`${pkg.name}@${toVersion} 已发布到 npm。`);
  if (registry.includes('registry.npmjs.org')) {
    info(`查看: https://www.npmjs.com/package/${pkg.name}/v/${toVersion}`);
  }
  if (!flags.push) {
    if (hasRemote) info(`下一步：推送提交与标签 → git push && git push origin ${tag}`);
    else info('提示：当前未配置 git remote；配置后可执行 git push --follow-tags 备份提交与标签。');
  }
}

main().catch((err) => {
  fail(err?.message || String(err));
  if (bumped && !committed) {
    warn('正在回滚版本号…');
    rollbackVersion();
  }
  process.exit(1);
});
