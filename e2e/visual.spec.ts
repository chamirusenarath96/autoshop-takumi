import { test, expect } from '@playwright/test'
import fs from 'fs'
import { AUTH_STATE_PATH, VIEWPORTS, getVisualMasks } from './helpers'

// This project's database is job-local and freshly seeded by e2e/visual-setup.ts
// (run as a CI step before this project, per playwright.visual.config.ts) rather than
// shared with the functional suite — the seeded Vehicle's ID/slug are read here from
// the small JSON file visual-setup.ts writes, not re-derived.
const fixture = JSON.parse(fs.readFileSync('e2e/.visual-fixture.json', 'utf8')) as {
  makeId: number
  modelId: number
  makeName: string
  vehicleId: number
  vehicleSlug: string
}

type ViewportName = keyof typeof VIEWPORTS

const VIEWPORT_NAMES = Object.keys(VIEWPORTS) as ViewportName[]

test.describe('Visual — public site', () => {
  for (const vp of VIEWPORT_NAMES) {
    test(`landing page — ${vp}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[vp])
      await page.goto('/en')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`landing-${vp}.png`, { mask: getVisualMasks(page, 'landing'), fullPage: true })
    })
  }

  for (const vp of VIEWPORT_NAMES) {
    test(`vehicle listing — no filter — ${vp}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[vp])
      await page.goto('/en/vehicles')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`listing-nofilter-${vp}.png`, { mask: getVisualMasks(page, 'listing'), fullPage: true })
    })
  }

  for (const vp of VIEWPORT_NAMES) {
    test(`vehicle listing — filtered by make — ${vp}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[vp])
      await page.goto(`/en/vehicles?make=${fixture.makeId}`)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`listing-filtered-${vp}.png`, { mask: getVisualMasks(page, 'listing'), fullPage: true })
    })
  }

  for (const vp of VIEWPORT_NAMES) {
    test(`vehicle detail — ${vp}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[vp])
      await page.goto(`/en/vehicles/${fixture.vehicleSlug}`)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`detail-${vp}.png`, { mask: getVisualMasks(page, 'vehicle-detail'), fullPage: true })
    })
  }

  for (const vp of VIEWPORT_NAMES) {
    test(`about page — ${vp}`, async ({ page }) => {
      await page.setViewportSize(VIEWPORTS[vp])
      await page.goto('/en/about')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot(`about-${vp}.png`, { mask: getVisualMasks(page, 'about'), fullPage: true })
    })
  }
})

test.describe('Visual — admin', () => {
  // Unauthenticated — must render the login form, not a redirect. This project runs
  // after e2e/visual-setup.ts has already created an admin user, so an unauthenticated
  // page load correctly reaches /admin/login (create-first-user is covered separately
  // by the visual-first-run project, which runs before an admin user exists at all).
  test('login page', async ({ page }) => {
    await page.goto('/admin/login')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('admin-login.png')
  })

  test.describe('authenticated', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    // Specific regression check for the blank-/admin incident (see PR #14 / issue #15).
    test('dashboard', async ({ page }) => {
      await page.goto('/admin')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('admin-dashboard.png', { mask: getVisualMasks(page, 'admin-dashboard') })
    })

    test('vehicles collection list view', async ({ page }) => {
      await page.goto('/admin/collections/vehicles')
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('admin-vehicles-list.png', { mask: getVisualMasks(page, 'admin-vehicles-list') })
    })

    test('vehicles collection edit view', async ({ page }) => {
      await page.goto(`/admin/collections/vehicles/${fixture.vehicleId}`)
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveScreenshot('admin-vehicles-edit.png', { mask: getVisualMasks(page, 'admin-vehicles-edit') })
    })
  })
})
