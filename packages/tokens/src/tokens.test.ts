import { readFile } from 'node:fs/promises';
import { loadTokenSet, renderCss, renderTs } from '@flowcanvas/figma-tokens';
import { describe, expect, it } from 'vitest';
import { themeValues } from './index.js';

const root = new URL('../', import.meta.url);
const file = (path: string) => new URL(path, root);

describe('generated token files', () => {
  it('are up to date with the token source (never edited by hand)', async () => {
    const set = await loadTokenSet({
      base: file('source/base.tokens.json').pathname,
      themes: [
        ['dark', file('source/color.dark.tokens.json').pathname],
        ['light', file('source/color.light.tokens.json').pathname],
      ],
    });
    expect(await readFile(file('css/tokens.css'), 'utf8')).toBe(renderCss(set));
    expect(await readFile(file('src/tokens.generated.ts'), 'utf8')).toBe(renderTs(set));
  });
});

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((high ?? 0) + 0.05) / ((low ?? 0) + 0.05);
}

describe.each(Object.entries(themeValues))('%s theme contrast (WCAG AA)', (_theme, values) => {
  const value = (name: string): string => {
    const found = (values as Record<string, string>)[`--color-${name}`];
    if (found === undefined) {
      throw new Error(`missing token --color-${name}`);
    }
    return found;
  };

  it.each([
    ['text-primary', 'surface-canvas'],
    ['text-primary', 'surface-raised'],
    ['text-secondary', 'surface-panel'],
    ['text-muted', 'surface-canvas'],
    ['text-muted', 'surface-panel'],
    ['text-muted', 'surface-raised'],
    ['text-muted', 'surface-hover'],
    ['text-on-accent', 'surface-inverse'],
    ['text-primary', 'surface-hover'],
    ['text-secondary', 'surface-hover'],
    ['accent-text', 'accent-tint'],
    ['accent-text', 'surface-panel'],
    ['state-added-text', 'state-added-tint'],
    ['state-modified-text', 'state-modified-tint'],
    ['state-removed-text', 'state-removed-tint'],
    ['state-affected-text', 'state-affected-tint'],
    ['state-scope-text', 'state-scope-tint'],
  ])('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(value(fg), value(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it.each([
    ['text-tertiary', 'surface-raised'],
    ['edge-default', 'surface-canvas'],
    ['accent-solid', 'surface-raised'],
    ['state-removed-solid', 'surface-canvas'],
  ])('non-text %s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(value(fg), value(bg))).toBeGreaterThanOrEqual(3);
  });
});
