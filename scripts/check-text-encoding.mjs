#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const textFilePattern = /\.(?:md|ts|tsx|js|mjs|json|ya?ml)$/u;

const suspiciousPatterns = [
  { label: 'Unicode replacement character U+FFFD', pattern: /\uFFFD/gu },
  {
    label: 'common UTF-8 mojibake fragment',
    pattern:
      /(?:\u9225[?\u2122\u0153]|\u951B[?\u5c7b\u5c8c]|\u9286[\u4e63\u20ac]|\u9429[\uE000-\uF8FF]|\u6D93[\u5a49\u7ec4\u54c4]|\u00C3[\u0080-\u00BF]|\u00C2[\u00A0-\u00BF]|\u00E2\u20AC[\u0080-\u00BF\u2018-\u201D\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u2122])/gu,
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEncodingAudit();
}
