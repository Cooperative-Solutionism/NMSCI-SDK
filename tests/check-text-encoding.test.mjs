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
      {
        file: 'notes.md',
        text: 'Standalone markers: \u00C3 \u00C2 \u00E2',
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

  it('reports common Western UTF-8 mojibake fragments', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'CHANGELOG.md',
        text:
          'latin \u00C3\u00A9\nmicro \u00C2\u00B5\ndash \u00E2\u20AC\u201D\nminus \u00E2\u20AC\u201C\nc1 em \u00E2\u0080\u0094\nc1 en \u00E2\u0080\u0093',
      },
    ]);

    expect(findings).toEqual([
      {
        file: 'CHANGELOG.md',
        line: 1,
        column: 7,
        label: 'common UTF-8 mojibake fragment',
      },
      {
        file: 'CHANGELOG.md',
        line: 2,
        column: 7,
        label: 'common UTF-8 mojibake fragment',
      },
      {
        file: 'CHANGELOG.md',
        line: 3,
        column: 6,
        label: 'common UTF-8 mojibake fragment',
      },
      {
        file: 'CHANGELOG.md',
        line: 4,
        column: 7,
        label: 'common UTF-8 mojibake fragment',
      },
      {
        file: 'CHANGELOG.md',
        line: 5,
        column: 7,
        label: 'common UTF-8 mojibake fragment',
      },
      {
        file: 'CHANGELOG.md',
        line: 6,
        column: 7,
        label: 'common UTF-8 mojibake fragment',
      },
    ]);
  });

  it('does not report a lone mojibake marker without context', () => {
    const findings = findSuspiciousEncodingMarkers([
      {
        file: 'README.md',
        text: 'SDK \u951B TypeScript',
      },
    ]);

    expect(findings).toEqual([]);
  });
});
