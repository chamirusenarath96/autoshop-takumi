import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false, // admin tests share DB state — run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // The `github` reporter annotates PR checks but doesn't write playwright-report/ —
  // add `html` alongside it in CI so the failure-upload step in ci.yml has something to upload.
  // `allure-playwright` writes allure-results/ on every run, cleared beforehand by the
  // pretest:e2e npm script (allure-playwright appends rather than replaces).
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['allure-playwright']]
    : [['list'], ['allure-playwright']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // Visual regression specs live in their own project/config
      // (playwright.visual.config.ts) — never picked up here, regardless of
      // which config a given invocation uses (defense in depth).
      testIgnore: [/visual\.spec\.ts$/, /visual-first-run\.spec\.ts$/],
    },
  ],

  // Start the dev server automatically in CI
  webServer: process.env.CI
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          PAYLOAD_SECRET: 'e2e-test-secret',
          NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        },
      }
    : undefined, // In local dev the server is already running
})
