import { test, expect } from '@playwright/test'
import { assertNoHorizontalOverflow, attachPageLoadTiming, AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const

test.describe('Responsive — mobile (375px)', () => {
  test.use({ viewport: VIEWPORTS.mobile, hasTouch: true })

  test('vehicle listing: filter drawer opens, applies a filter, and closes', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Filters' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Body type').selectOption('suv')
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })
})

test.describe('Responsive — tablet (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet })

  test('vehicle listing: filter drawer opens, applies a filter, and closes', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Filters' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Body type').selectOption('suv')
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })
})

test.describe('Responsive — desktop (1280px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('vehicle listing: sidebar filters render inline, no drawer trigger', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await expect(page.getByLabel('Body type')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Filters' })).not.toBeVisible()
  })
})
