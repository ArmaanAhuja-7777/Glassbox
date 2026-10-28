// Named import: the package's type entry is CommonJS, so its default export doesn't type-check under nodenext.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { openStory, storyIds, THEMES } from './storybook.js';

// Every story in both themes: pixel-compared with its approved baseline, and checked with axe.
// Update baselines deliberately, after reviewing the change: pnpm test:visual:update.
for (const id of storyIds()) {
  for (const theme of THEMES) {
    test(`${id} · ${theme}`, async ({ page }) => {
      await openStory(page, id, theme);

      await expect(page).toHaveScreenshot(`${id}-${theme}.png`, { fullPage: true });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const violations = results.violations
        .map((violation) => ({
          ...violation,
          // Known false positive (ADR 0008): a menu item's shortcut is its description, not part of its name.
          nodes: violation.nodes.filter(
            (node) =>
              !(
                violation.id === 'label-content-name-mismatch' &&
                node.html.includes('role="menuitem"')
              ),
          ),
        }))
        .filter((violation) => violation.nodes.length > 0)
        .map(
          (violation) =>
            `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
        );
      expect(violations).toEqual([]);
    });
  }
}
