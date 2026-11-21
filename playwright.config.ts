import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests: a real browser against the dev server and Salla's demo store.
 *
 * Locally: with `pnpm dev` running, `pnpm test:e2e` uses that server and leaves it running.
 * With none running (and always on CI) it starts `pnpm dev` and stops it afterwards.
 *
 * Everything runs twice: on a phone (375px) and on a laptop (1440px).
 */
const PORT = Number(process.env.E2E_PORT ?? 5173);
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  // The dev server renders every page on request; a cold page can take a few seconds.
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: CI ? 1 : 2,
  retries: CI ? 1 : 0,
  forbidOnly: CI,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'ar-SA',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
