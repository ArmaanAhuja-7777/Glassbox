import { defineConfig, devices } from '@playwright/test';

// Visual tests run against the static Storybook build (pnpm test:visual builds it first).
const storybookUrl = 'http://127.0.0.1:6008';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './visual',
  forbidOnly: isCi,
  // Screenshot baselines are only comparable on the same OS and browser build; {platform} keeps them apart.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}-{platform}{ext}',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report-visual' }],
    ['json', { outputFile: 'reports-data/visual.json' }],
  ],
  // threshold 0: any colour change counts. Playwright's default (0.2) let a whole palette change pass unnoticed.
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      threshold: 0,
      stylePath: './visual/screenshot.css',
    },
  },
  use: {
    baseURL: storybookUrl,
    // 2x for sharp screenshots; changing it invalidates every baseline.
    ...devices['Desktop Chrome'],
    deviceScaleFactor: 2,
    viewport: { width: 800, height: 900 },
  },
  projects: [{ name: 'chromium' }],
  webServer: {
    // Vite's own binary, not pnpm: the tests run inside Playwright's Docker image, which has Node but no pnpm.
    command:
      'node node_modules/vite/bin/vite.js preview --outDir storybook-static --host 127.0.0.1 --port 6008 --strictPort',
    cwd: '../packages/ui',
    url: storybookUrl,
    reuseExistingServer: !isCi,
    timeout: 30_000,
  },
});
