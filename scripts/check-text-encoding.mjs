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
