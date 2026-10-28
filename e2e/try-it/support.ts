import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

// The product version lives in the root package.json; the page must show exactly that.
export const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };

/** Short commit the build under test must show, when the run knows it (CI, or a preview check). */
export const expectedCommit = process.env.E2E_EXPECTED_COMMIT?.slice(0, 7);

/**
 * Collects uncaught page errors and Content-Security-Policy violations for the whole walkthrough.
 * Call it before the first navigation; assert that `problems()` is empty at the end.
 */
export function watchForPageProblems(page: Page): { problems: () => string[] } {
  const found: string[] = [];
  page.on('pageerror', (error) => found.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      found.push(`CSP: ${message.text()}`);
    }
  });
  return { problems: () => [...found] };
}
