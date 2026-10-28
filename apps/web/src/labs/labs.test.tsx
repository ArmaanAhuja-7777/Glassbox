import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { LABS_FLAGS, type LabsFlag } from './flags';
import { LabsFeature, LabsProvider } from './LabsProvider';
import { LabsPanel } from './LabsPanel';
import { LABS_STORAGE_KEY, readLabs, saveLabs } from './storage';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

// Test-only switch: the real registry stays honest (no fake feature ships).
const testFlag: LabsFlag = {
  id: 'test-preview',
  label: 'Test preview',
  description: 'Shows a test-only box.',
  phase: '2',
};

function Harness() {
  return (
    <LabsProvider flags={[testFlag]}>
      <LabsPanel />
      <LabsFeature id="test-preview">
        <p>Half-built feature</p>
      </LabsFeature>
    </LabsProvider>
  );
}

describe('Labs', () => {
  it('starts every switch off, marked as a preview, with what is unfinished', () => {
    render(<Harness />);
    const toggle = screen.getByRole('switch', { name: /Test preview/ });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByText('Preview')).toBeTruthy();
    expect(toggle.getAttribute('aria-describedby')).toBe('labs-test-preview-description');
    expect(screen.getByText('Shows a test-only box. Finished in phase 2.')).toBeTruthy();
    expect(screen.queryByText('Half-built feature')).toBeNull();
  });

  it('shows the feature while the switch is on, and remembers the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await user.click(screen.getByRole('switch', { name: /Test preview/ }));
    expect(screen.getByText('Half-built feature')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem(LABS_STORAGE_KEY) ?? '{}')).toEqual({
      'test-preview': true,
    });

    unmount();
    render(<Harness />);
    expect(screen.getByText('Half-built feature')).toBeTruthy();

    await user.click(screen.getByRole('switch', { name: /Test preview/ }));
    expect(screen.queryByText('Half-built feature')).toBeNull();
  });

  it('says so honestly when nothing is in preview', () => {
    render(
      <LabsProvider flags={[]}>
        <LabsPanel />
      </LabsProvider>,
    );
    expect(screen.getByText(/No previews right now/)).toBeTruthy();
  });
});

describe('Labs storage', () => {
  it('keeps only known switches that are on, and ignores junk', () => {
    const value = JSON.stringify({ 'test-preview': true, removed: true, other: 'yes' });
    const storage = { getItem: () => value };
    expect(readLabs(storage, ['test-preview', 'other'])).toEqual({ 'test-preview': true });
    expect(readLabs({ getItem: () => '[1,2]' }, ['x'])).toEqual({});
    expect(readLabs({ getItem: () => 'not json' }, ['x'])).toEqual({});
  });

  it('survives storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readLabs(broken, ['x'])).toEqual({});
    expect(() => {
      saveLabs(broken, { x: true });
    }).not.toThrow();
  });
});

describe('the real Labs registry', () => {
  it('follows the rules for every switch', () => {
    const ids = LABS_FLAGS.map((flag) => flag.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const flag of LABS_FLAGS) {
      expect(flag.id, flag.id).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
      expect(flag.label, flag.id).toMatch(/^[A-Z][^A-Z]*$/u);
      expect(flag.description.length, flag.id).toBeGreaterThan(10);
      expect(flag.phase, flag.id).toMatch(/^\d+[a-z]?$/);
    }
  });
});
