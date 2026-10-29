import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ChangelogRelease } from '../changelog/parse';
import { readSeenVersion, saveSeenVersion, WHATS_NEW_SEEN_KEY } from './seen';
import { WhatsNew } from './WhatsNew';

afterEach(cleanup);

const releases: ChangelogRelease[] = [
  {
    version: '0.2.0',
    date: '2026-10-28',
    title: 'Phase 1a: design system in code',
    sections: [
      {
        heading: 'Try it',
        ordered: true,
        items: ['Open the **catalogue**.', 'Flip dark and light.'],
      },
      { heading: 'Added', ordered: false, items: ['`@flowcanvas/ui` components.'] },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-27',
    title: 'Phase 1: project skeleton',
    sections: [{ heading: 'Added', ordered: false, items: ['Monorepo.'] }],
  },
];

describe('WhatsNew', () => {
  it('shows this build’s notes first, with Try it as a numbered list', () => {
    render(<WhatsNew releases={releases} version="0.2.0" />);
    expect(screen.getByText('Phase 1a: design system in code · 2026-10-28')).toBeTruthy();
    const tryIt = screen.getByRole('heading', { name: 'Try it' }).nextElementSibling;
    expect(tryIt?.tagName).toBe('OL');
    expect(tryIt?.querySelector('strong')?.textContent).toBe('catalogue');
    expect(screen.getByText('@flowcanvas/ui').tagName).toBe('CODE');
  });

  it('folds earlier releases', () => {
    render(<WhatsNew releases={releases} version="0.2.0" />);
    const earlier = screen.getByText('0.1.0').closest('details');
    expect(earlier?.open).toBe(false);
  });

  it('falls back to the newest release when this version has no entry', () => {
    render(<WhatsNew releases={releases} version="9.9.9" />);
    expect(screen.getByText('Phase 1a: design system in code · 2026-10-28')).toBeTruthy();
  });

  it('says so when there are no notes at all', () => {
    render(<WhatsNew releases={[]} version="0.2.0" />);
    expect(screen.getByText('No release notes in this build.')).toBeTruthy();
  });
});

describe('seen version storage', () => {
  it('round-trips and survives storage that throws', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => void map.set(key, value),
    };
    saveSeenVersion(storage, '0.2.0');
    expect(map.get(WHATS_NEW_SEEN_KEY)).toBe('0.2.0');
    expect(readSeenVersion(storage)).toBe('0.2.0');

    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readSeenVersion(broken)).toBeUndefined();
    expect(() => {
      saveSeenVersion(broken, '0.2.0');
    }).not.toThrow();
  });
});
