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
