import { defineConfig, devices } from '@playwright/test';

// Visual tests run against the static Storybook build (pnpm test:visual builds it first).
const storybookUrl = 'http://127.0.0.1:6008';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './visual',
  forbidOnly: isCi,
  // Screenshot baselines are only comparable on the same OS and browser build; {platform} keeps them apart.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-visual' }]],
  expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide' } },
  use: {
    baseURL: storybookUrl,
    // Figma exports are 2x, so we render at 2x too.
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 2,
    viewport: { width: 800, height: 900 },
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    command:
      'pnpm --filter @flowcanvas/ui exec vite preview --outDir storybook-static --host 127.0.0.1 --port 6008 --strictPort',
    url: storybookUrl,
    reuseExistingServer: !isCi,
    timeout: 30_000,
  },
});
