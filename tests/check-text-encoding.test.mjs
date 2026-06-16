import { describe, expect, it } from 'vitest';
import { findSuspiciousEncodingMarkers } from '../scripts/check-text-encoding.mjs';

describe('text encoding audit', () => {
  it('accepts clean Chinese, English, and valid punctuation', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'README.md',
        text:
          '\u6B63\u5E38\u4E2D\u6587\u3001English, SDK \u2014 TypeScript, \u5FAE\u79D2\uFF08\u03BCs\uFF09',
      },
    ]);

    expect(findings).toEqual([]);
  });

  it('reports Unicode replacement characters with line and column', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'README.md',
        text: 'first line\nabc\uFFFDdef',
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

  it('ignores documented bad encoding examples in release-plan code fences', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'docs/superpowers/plans/example.md',
        text:
          'before\n```js\nconst replacement = "abc\uFFFDdef";\nconst mojibake = "SDK \u9225? TypeScript";\n```\nafter',
      },
    ]);

    expect(findings).toEqual([]);
  });
});
