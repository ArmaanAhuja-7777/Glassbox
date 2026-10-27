import { expect, test } from '@playwright/test';

test('shows the product name and the version it was built from', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/');

  await expect(page).toHaveTitle('Flowcanvas');
  await expect(page.getByRole('heading', { name: 'Flowcanvas' })).toBeVisible();

  const expectedCommit = process.env.E2E_EXPECTED_COMMIT?.slice(0, 7);
  const buildLine = expectedCommit ? `0.1.0 · ${expectedCommit}` : /^0\.1\.0 · [0-9a-f]{7}$/;
  await expect(page.getByText(buildLine)).toBeVisible();

  expect(pageErrors).toEqual([]);
});

test('switches theme from the menu and links to the component catalogue', async ({ page }) => {
  const cspViolations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('Content Security Policy')) {
      cspViolations.push(message.text());
    }
  });

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Open the component catalogue' })).toHaveAttribute(
    'href',
    /^https:\/\/flowcanvas-catalogue\./,
  );

  await page.getByRole('button', { name: /^Theme: / }).click();
  await page.getByRole('menuitemradio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // The choice is remembered across reloads.
  await page.reload();
  await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  expect(cspViolations).toEqual([]);
});
