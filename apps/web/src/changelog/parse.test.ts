// @vitest-environment node
// Pure parsing tests that also read the real CHANGELOG.md from disk, so they run in Node, not jsdom.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import rootPackage from '../../../../package.json' with { type: 'json' };
import { inlineParts, parseChangelog } from './parse';

const sample = `# Changelog

## [Unreleased]

### Added

- Not built yet.

## [0.2.0] — 2026-10-28 — Phase 1a: design system in code

### Try it

1. Open the catalogue.
2. Flip dark and light.

### Added

- \`@flowcanvas/ui\`: Button, Tag and
  Flow node.
- **Signal palette** for states.

### Security

## [0.1.0] - 2026-10-27

### Added

- Monorepo.
`;

describe('parseChangelog', () => {
  const releases = parseChangelog(sample);

  it('reads releases newest first and skips Unreleased', () => {
    expect(releases.map((release) => release.version)).toEqual(['0.2.0', '0.1.0']);
  });

  it('reads the date and title, with em or plain dashes', () => {
    expect(releases[0]).toMatchObject({
      date: '2026-10-28',
      title: 'Phase 1a: design system in code',
    });
    expect(releases[1]).toMatchObject({ date: '2026-10-27', title: undefined });
  });

  it('keeps sections in order, drops empty ones, and marks numbered lists', () => {
    expect(releases[0]?.sections.map((section) => [section.heading, section.ordered])).toEqual([
      ['Try it', true],
      ['Added', false],
    ]);
  });

  it('joins wrapped lines into one item', () => {
    expect(releases[0]?.sections[1]?.items).toEqual([
      '`@flowcanvas/ui`: Button, Tag and Flow node.',
      '**Signal palette** for states.',
    ]);
  });
});

describe('inlineParts', () => {
  it('splits bold and code from plain text', () => {
    expect(inlineParts('**Signal** palette in `tokens` today')).toEqual([
      { kind: 'strong', text: 'Signal' },
      { kind: 'text', text: ' palette in ' },
      { kind: 'code', text: 'tokens' },
      { kind: 'text', text: ' today' },
    ]);
  });

  it('leaves markup-like text as plain text', () => {
    expect(inlineParts('<img src=x onerror=alert(1)>')).toEqual([
      { kind: 'text', text: '<img src=x onerror=alert(1)>' },
    ]);
  });
});

describe('the real CHANGELOG.md', () => {
  const releases = parseChangelog(
    readFileSync(new URL('../../../../CHANGELOG.md', import.meta.url), 'utf8'),
  );

  it('has an entry for the version this build ships, as its newest release', () => {
    expect(releases[0]?.version).toBe(rootPackage.version);
  });

  it('gives every release a date and at least one non-empty section', () => {
    for (const release of releases) {
      expect(release.date, release.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.sections.length, release.version).toBeGreaterThan(0);
    }
  });
});
