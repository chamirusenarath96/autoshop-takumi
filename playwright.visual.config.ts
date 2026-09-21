import { defineConfig, devices } from '@playwright/test'

// Deliberately does NOT set `globalSetup` (unlike playwright.config.ts). Playwright's
// `globalSetup` is a single top-level config property that runs before every project a
// config file defines, with no per-project opt-out — so the only way `visual-first-run`
// genuinely sees an empty, no-admin-user database is a config file that never references
// e2e/global-setup.ts at all. Also has no `webServer`: the visual-e2e CI job manages the
// dev server's lifecycle itself as explicit steps (see .github/workflows/ci.yml), since it
// needs the server started before the job-local database is seeded by e2e/visual-setup.ts.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['allure-playwright']]
    : [['list'], ['allure-playwright']],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Fixed so snapshots don't vary with OS theme or DPI.
    colorScheme: 'light',
    deviceScaleFactor: 1,
  },

  // Tight enough to reject a gross regression (e.g. a page rendering blank, which
  // differs far beyond 1% of pixels) but tolerant of minor anti-aliasing noise within
  // the pinned CI environment (see specs/002-visual-regression-testing/research.md's
  // baseline-determinism decision — screenshots are only authoritative when produced
  // on the pinned ubuntu-24.04 runner, never compared across environments).
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },

  projects: [
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual\.spec\.ts$/,
    },
    {
      name: 'visual-first-run',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual-first-run\.spec\.ts$/,
    },
  ],
})
