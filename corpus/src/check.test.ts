import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkRepo, type GitHubApi } from './check.ts';
import { manifestProblems, type CorpusManifest, type CorpusRepo } from './manifest.ts';

const licence = 'MIT License\nCopyright (c) Example\n';
const repo: CorpusRepo = {
  id: 'example',
  name: 'Example',
  upstream: 'upstream/example',
  fork: 'us/example',
  branch: 'main',
  commit: 'a'.repeat(40),
  why: 'Test fixture.',
  licence: {
    spdx: 'MIT',
    file: 'LICENSE',
    sha256: createHash('sha256').update(licence).digest('hex'),
    notes: 'MIT.',
  },
  stack: [{ file: 'package.json', packages: ['react', 'vite'] }],
};

/** A fake GitHub that answers like the real API for the fixture repo; `changes` alters one answer. */
function fakeApi(changes: Partial<Record<string, unknown>> = {}): GitHubApi {
  const json: Record<string, unknown> = {
    'repos/us/example': { fork: true, private: false, parent: { full_name: 'upstream/example' } },
    [`repos/us/example/compare/${'a'.repeat(40)}...main`]: { status: 'ahead' },
    ...changes,
  };
  const files: Record<string, string | undefined> = {
    LICENSE: licence,
    'package.json': JSON.stringify({
      dependencies: { react: '19' },
      devDependencies: { vite: '8' },
    }),
    ...(changes.files as Record<string, string | undefined> | undefined),
  };
  return {
    json: (path) => Promise.resolve(json[path]),
    raw: (_repo, file) => Promise.resolve(files[file]),
  };
}

describe('checkRepo', () => {
  it('passes a public fork at its pinned commit with an unchanged licence and the expected stack', async () => {
    const result = await checkRepo(repo, fakeApi());
    expect(result.ok).toBe(true);
    expect(result.lines.every((line) => line.startsWith('  ✓'))).toBe(true);
  });

  it.each([
    ['the fork is missing', { 'repos/us/example': undefined }, 'not found'],
    [
      'it is not a fork of the upstream',
      { 'repos/us/example': { fork: true, private: false, parent: { full_name: 'someone/else' } } },
      'is not a fork of upstream/example',
    ],
    [
      'the fork is private',
      {
        'repos/us/example': {
          fork: true,
          private: true,
          parent: { full_name: 'upstream/example' },
        },
      },
      'must be public',
    ],
    [
      'the commit is not on the branch',
      { [`repos/us/example/compare/${'a'.repeat(40)}...main`]: { status: 'diverged' } },
      'is not on main (diverged)',
    ],
    ['the licence changed', { files: { LICENSE: 'Business Source License\n' } }, 'LICENSE changed'],
    [
      'a stack package is missing',
      { files: { 'package.json': JSON.stringify({ dependencies: { react: '19' } }) } },
      'missing vite',
    ],
  ])('fails when %s', async (_case, changes, message) => {
    const result = await checkRepo(repo, fakeApi(changes));
    expect(result.ok).toBe(false);
    expect(result.lines.join('\n')).toContain(message);
  });
});

describe('the real corpus/manifest.json', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'),
  ) as CorpusManifest;

  it('follows the manifest rules', () => {
    expect(manifestProblems(manifest)).toEqual([]);
  });

  it('pins six varied repos, all public forks in one account', () => {
    expect(manifest.repos.map((entry) => entry.id)).toEqual([
      'rallly',
      'documenso',
      'librechat',
      'twenty',
      'excalidraw',
      'medusa',
    ]);
    expect(new Set(manifest.repos.map((entry) => entry.fork.split('/')[0])).size).toBe(1);
  });

  it('catches broken entries', () => {
    const broken: CorpusManifest = {
      ...manifest,
      repos: [{ ...repo, id: 'Bad Id', commit: 'abc', stack: [] }],
    };
    expect(manifestProblems(broken)).toEqual([
      'corpus repo "Bad Id": id must be lowercase',
      'corpus repo "Bad Id": commit must be a full 40-character SHA',
      'corpus repo "Bad Id": needs at least one stack evidence file',
    ]);
  });
});
