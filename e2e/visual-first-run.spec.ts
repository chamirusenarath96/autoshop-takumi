import { test, expect } from '@playwright/test'

// Deliberately minimal imports — does not import anything from e2e/visual.spec.ts or
// share its describe blocks (see playwright.visual.config.ts: this file's `project`
// runs first, against a genuinely empty, no-admin-user database).

test.describe('Visual — first run', () => {
  test('create-first-user form renders', async ({ page }) => {
    await page.goto('/admin/create-first-user', { waitUntil: 'networkidle', timeout: 60_000 })
    await expect(page.locator('#field-email')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveScreenshot('admin-create-first-user.png')
  })
})
