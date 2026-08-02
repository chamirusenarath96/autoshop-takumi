import { test, expect } from '@playwright/test'
import { assertNoHorizontalOverflow, attachPageLoadTiming, AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

/** Dispatches a synthetic touch swipe gesture from right to left across the element matching `testId`. */
async function swipeLeft(page: import('@playwright/test').Page, testId: string) {
  await page.locator(`[data-testid="${testId}"]`).evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const y = rect.top + rect.height / 2
    const startX = rect.left + rect.width * 0.8
    const endX = rect.left + rect.width * 0.2
    const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y })
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(startX)], bubbles: true, cancelable: true }))
    el.dispatchEvent(
      new TouchEvent('touchend', { touches: [], changedTouches: [touch(endX)], bubbles: true, cancelable: true }),
    )
  })
}

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

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Body type').selectOption('suv')
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })

  test('header: menu toggle reveals nav links, and navigating collapses it', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Inventory' })).not.toBeVisible()

    await header.getByRole('button', { name: 'Menu' }).click()
    const panel = page.getByTestId('mobile-nav-panel')
    await expect(panel.getByRole('link', { name: 'Inventory' })).toBeVisible()

    await panel.getByRole('link', { name: 'Inventory' }).click()
    await expect(page).toHaveURL(/\/en\/vehicles/)
  })

  test.describe('with a seeded vehicle', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('vehicle detail: gallery advances on touch swipe', async ({ page }) => {
      const ts = Date.now()
      const vehicle = await createPublishedVehicle(page, {
        makeName: `SwipeMake-${ts}`,
        modelName: 'SwipeModel',
        title: `Swipe Test Vehicle ${ts}`,
        slug: `swipe-test-${ts}`,
        galleryImages: 2,
      })

      await page.goto(`/en/vehicles/${vehicle.slug}`)
      await page.waitForLoadState('networkidle')

      const main = page.getByTestId('gallery-main')
      await expect(main).toHaveAttribute('data-active-index', '0')
      await swipeLeft(page, 'gallery-main')
      await expect(main).toHaveAttribute('data-active-index', '1')
    })

    test('landing, vehicle detail, and about pages: no horizontal overflow + load timing', async ({ page }) => {
      const ts = Date.now()
      const vehicle = await createPublishedVehicle(page, {
        makeName: `OverflowMake-${ts}`,
        modelName: 'OverflowModel',
        title: `Overflow Test Vehicle ${ts}`,
        slug: `overflow-test-${ts}`,
      })

      await page.goto('/en')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'mobile:homepage')

      await page.goto(`/en/vehicles/${vehicle.slug}`)
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'mobile:vehicle-detail')

      await page.goto('/en/about')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
    })

    test('inquiry form: tap targets are >=44x44px and the form is submittable via tap', async ({ page }) => {
      const ts = Date.now()
      const vehicle = await createPublishedVehicle(page, {
        makeName: `InquiryMake-${ts}`,
        modelName: 'InquiryModel',
        title: `Inquiry Test Vehicle ${ts}`,
        slug: `inquiry-test-${ts}`,
      })

      await page.goto(`/en/vehicles/${vehicle.slug}`)
      await page.waitForLoadState('networkidle')

      const form = page.locator('form')
      const controls = form.locator('input, textarea, button')
      const count = await controls.count()
      expect(count).toBeGreaterThan(0)
      for (let i = 0; i < count; i++) {
        const box = await controls.nth(i).boundingBox()
        expect(box).not.toBeNull()
        expect(box!.height).toBeGreaterThanOrEqual(44)
        expect(box!.width).toBeGreaterThanOrEqual(44)
      }

      await form.locator('[name="name"]').tap()
      await form.locator('[name="name"]').fill('Tap Tester')
      await form.locator('[name="email"]').tap()
      await form.locator('[name="email"]').fill('tap@example.com')
      await form.locator('[name="message"]').tap()
      await form.locator('[name="message"]').fill('Testing tap-based submission on a small viewport.')
      await form.getByRole('button', { name: /send inquiry/i }).tap()

      await expect(page.getByText(/thank you/i)).toBeVisible()
    })
  })
})

test.describe('Responsive — tablet (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet })

  test('vehicle listing: filter drawer opens, applies a filter, and closes', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Body type').selectOption('suv')
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })

  test('header: menu toggle reveals nav links', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Inventory' })).not.toBeVisible()

    await header.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByTestId('mobile-nav-panel').getByRole('link', { name: 'Inventory' })).toBeVisible()
  })

  test.describe('with a seeded vehicle', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('vehicle listing: shows more than one card per row (intermediate layout)', async ({ page }) => {
      const ts = Date.now()
      await createPublishedVehicle(page, {
        makeName: `TabGridMake-${ts}`,
        modelName: 'GridModelA',
        title: `Tab Grid A ${ts}`,
        slug: `tab-grid-a-${ts}`,
      })
      await createPublishedVehicle(page, {
        makeName: `TabGridMake2-${ts}`,
        modelName: 'GridModelB',
        title: `Tab Grid B ${ts}`,
        slug: `tab-grid-b-${ts}`,
      })

      await page.goto('/en/vehicles')
      await page.waitForLoadState('networkidle')
      const cards = page.locator('a[href*="/vehicles/"]')
      const count = await cards.count()
      expect(count).toBeGreaterThanOrEqual(2)

      const box0 = await cards.nth(0).boundingBox()
      const box1 = await cards.nth(1).boundingBox()
      expect(box0).not.toBeNull()
      expect(box1).not.toBeNull()
      // Same row => same (or near-same) top y-coordinate, and side-by-side x-coordinates.
      expect(Math.abs(box0!.y - box1!.y)).toBeLessThan(5)
      expect(box1!.x).toBeGreaterThan(box0!.x)
    })

    test('landing, vehicle detail, and about pages: no horizontal overflow + load timing', async ({ page }) => {
      const ts = Date.now()
      const vehicle = await createPublishedVehicle(page, {
        makeName: `TabOverflowMake-${ts}`,
        modelName: 'TabOverflowModel',
        title: `Tablet Overflow Test Vehicle ${ts}`,
        slug: `tab-overflow-test-${ts}`,
      })

      await page.goto('/en')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'tablet:homepage')

      await page.goto(`/en/vehicles/${vehicle.slug}`)
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'tablet:vehicle-detail')

      await page.goto('/en/about')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
    })
  })
})

test.describe('Responsive — desktop (1280px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('vehicle listing: sidebar filters render inline, no drawer trigger', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await expect(page.getByLabel('Body type')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Filters', exact: true })).not.toBeVisible()
  })

  test('header: full nav row visible, no menu toggle', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Inventory' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
  })

  test('landing and about pages: no hamburger/drawer, pre-feature desktop structure', async ({ page }) => {
    for (const path of ['/en', '/en/about']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const header = page.getByRole('banner')
      await expect(header.getByRole('link', { name: 'Inventory' })).toBeVisible()
      await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
      await expect(page.getByRole('button', { name: 'Filters', exact: true })).toHaveCount(0)
    }
  })

  test.describe('with a seeded vehicle', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('landing, vehicle detail, and about pages: no horizontal overflow + load timing', async ({ page }) => {
      const ts = Date.now()
      const vehicle = await createPublishedVehicle(page, {
        makeName: `DeskOverflowMake-${ts}`,
        modelName: 'DeskOverflowModel',
        title: `Desktop Overflow Test Vehicle ${ts}`,
        slug: `desk-overflow-test-${ts}`,
      })

      await page.goto('/en')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'desktop:homepage')

      await page.goto(`/en/vehicles/${vehicle.slug}`)
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
      await attachPageLoadTiming(page, test.info(), 'desktop:vehicle-detail')

      await page.goto('/en/about')
      await page.waitForLoadState('networkidle')
      await assertNoHorizontalOverflow(page)
    })
  })
})
