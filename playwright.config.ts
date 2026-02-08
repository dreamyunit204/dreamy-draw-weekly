import { defineConfig, devices } from '@playwright/test';

const LIVE_BASE_URL = process.env.SRE_BASE_URL || 'https://dreamyunit204.github.io/dreamy-draw-weekly/';

export default defineConfig({
  testDir: './tests/sre',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: LIVE_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
