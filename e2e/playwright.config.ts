import { defineConfig, devices } from '@playwright/test';

// Point the tests at any deployed copy (PR preview, staging) with E2E_BASE_URL.
// Without it, Playwright serves the local production build of apps/web itself.
const externalBaseUrl = process.env.E2E_BASE_URL;
const localPreviewUrl = 'http://127.0.0.1:4173';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseUrl ?? localPreviewUrl,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  ...(externalBaseUrl
    ? {}
    : {
        webServer: {
          command:
            'pnpm --filter @flowcanvas/web exec vite preview --host 127.0.0.1 --port 4173 --strictPort',
          url: localPreviewUrl,
          reuseExistingServer: !isCi,
          timeout: 30_000,
        },
      }),
});
