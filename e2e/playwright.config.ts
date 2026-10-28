import { defineConfig, devices } from '@playwright/test';

// Point the tests at any deployed copy (PR preview, staging) with E2E_BASE_URL.
// Without it, Playwright serves the local production build of apps/web itself.
const externalBaseUrl = process.env.E2E_BASE_URL;
const localPreviewUrl = 'http://127.0.0.1:4173';
const isCi = Boolean(process.env.CI);

export default defineConfig({
  // One walkthrough file per phase: the build plan's "Try it" steps, run on every change.
  testDir: './try-it',
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseUrl ?? localPreviewUrl,
  },
  projects: [
    {
      // Every walkthrough is recorded, pass or fail, so anyone can watch exactly what was checked.
      name: 'try-it',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        video: { mode: 'on', size: { width: 1280, height: 720 } },
        trace: 'on',
        // A short pause after each browser action, so the video is watchable; it doesn't change what is tested.
        launchOptions: { slowMo: 500 },
      },
    },
  ],
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
