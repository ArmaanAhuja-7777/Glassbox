import { expect, test } from '@playwright/test';
import { version, watchForPageProblems } from './support.js';

// Phase 1b · What's new: an in-app panel listing what changed in this build and how to try it.
test("phase 1b: what's new in this build", async ({ page }) => {
  const watch = watchForPageProblems(page);

  await test.step('Open the preview link: What’s new shows a dot for unseen changes', async () => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: "What's new (new changes)" })).toBeVisible();
  });

  await test.step('Open What’s new: this build’s notes, with Try it first', async () => {
    await page.getByRole('button', { name: "What's new (new changes)" }).click();
    const notes = page.getByRole('dialog', { name: `What's new in ${version}` });
    await expect(notes).toBeVisible();
    await expect(notes.getByRole('heading', { name: 'Try it' })).toBeVisible();
    await expect(notes.getByRole('heading', { name: 'Earlier releases' })).toBeVisible();
  });

  await test.step('Close it: the dot is gone, also after a reload', async () => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: "What's new" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: "What's new" })).toBeVisible();
  });

  expect(watch.problems()).toEqual([]);
});

// Phase 1b · Labs: switches for unfinished features, off by default (Settings → Labs from phase 2).
test('phase 1b: Labs lists previews of unfinished features', async ({ page }) => {
  const watch = watchForPageProblems(page);

  await test.step('Open the preview link, then Labs', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Labs' }).click();
  });

  await test.step('Nothing is in preview yet, and Labs says so', async () => {
    const labs = page.getByRole('dialog', { name: 'Labs' });
    await expect(labs).toBeVisible();
    await expect(labs.getByText(/No previews right now/)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(labs).toBeHidden();
  });

  expect(watch.problems()).toEqual([]);
});
