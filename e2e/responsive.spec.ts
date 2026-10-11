import { test, expect, type Page, type TestInfo } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { assertNoHorizontalOverflow, attachPageLoadTiming, AUTH_STATE_PATH, createPublishedVehicle, VIEWPORTS } from './helpers'

/** Visits the landing and inventory pages, asserting no horizontal overflow and attaching load timing for each. */
async function assertOverflowAndTimingAcrossPages(page: Page, testInfo: TestInfo, labelPrefix: string) {
  await page.goto('/en')
  await page.waitForLoadState('networkidle')
  await assertNoHorizontalOverflow(page)
  await attachPageLoadTiming(page, testInfo, `${labelPrefix}:landing`)

  await page.goto('/en/vehicles')
  await page.waitForLoadState('networkidle')
  await assertNoHorizontalOverflow(page)
  await attachPageLoadTiming(page, testInfo, `${labelPrefix}:inventory`)
}

/** Seeds one vehicle so the overflow checks run against a populated inventory. */
async function seedOverflowVehicle(page: Page, prefix: string) {
  const ts = Date.now()
  await createPublishedVehicle(page, {
    makeName: `${prefix}Make-${ts}`,
    modelName: `${prefix}Model`,
    title: `${prefix} Overflow Test Vehicle ${ts}`,
    slug: `${prefix.toLowerCase()}-overflow-test-${ts}`,
  })
}

/** Gives the landing hero one photo, runs `check`, then clears it so other specs see the photo-less hero. */
async function withHeroSlide(page: Page, check: () => Promise<void>) {
  const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
  const media = await page.request.post('/api/media', {
    multipart: { file: { name: 'pan-hero.png', mimeType: 'image/png', buffer: imgBytes }, _payload: JSON.stringify({ altEn: 'Pan hero' }) },
  })
  const id = (await media.json()).doc.id
  await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: [{ image: id }] } })
  try {
    await check()
  } finally {
    await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: [] } })
  }
}

test.describe('Responsive — mobile (375px)', () => {
  test.use({ viewport: VIEWPORTS.mobile, hasTouch: true })

  test('vehicle listing: filter sheet opens, applies a filter, and closes', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('combobox', { name: 'Body type' }).click()
    await page.getByRole('option', { name: 'SUV' }).click()
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })

  test('header: menu sheet reveals nav links, and navigating works', async ({ page }) => {
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

    test('hero photo drifts sideways on mobile without causing horizontal overflow', async ({ page }) => {
      await withHeroSlide(page, async () => {
        await page.goto('/en')
        await page.waitForLoadState('networkidle')
        const img = page.getByRole('region', { name: 'Featured photos' }).getByRole('img').first()
        await expect(img).toHaveCSS('animation-name', 'hero-pan')
        await assertNoHorizontalOverflow(page)
      })
    })

    test('latest arrivals is one compact, horizontally scrollable row', async ({ page }) => {
      await seedOverflowVehicle(page, 'Scroller')
      await page.goto('/en')
      await page.waitForLoadState('networkidle')
      const row = page.getByRole('region', { name: 'Latest arrivals' })
      const card = row.locator('[data-slot="card"]').first()
      await expect(card).toBeVisible()
      const box = await card.boundingBox()
      expect(box!.width).toBeLessThan(300)
      await assertNoHorizontalOverflow(page)
    })

    test('landing and inventory pages: no horizontal overflow + load timing', async ({ page }) => {
      await seedOverflowVehicle(page, 'Mobile')
      await assertOverflowAndTimingAcrossPages(page, test.info(), 'mobile')
    })
  })
})

test.describe('Responsive — tablet (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet })

  test('vehicle listing: filter sheet opens, applies a filter, and closes', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Filters', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.getByRole('combobox', { name: 'Body type' }).click()
    await page.getByRole('option', { name: 'SUV' }).click()
    await expect(dialog).not.toBeVisible()
    await page.waitForURL(/bodyType=suv/)
  })

  test('header: menu toggle reveals nav links', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    // 768px is shadcn's `md` breakpoint: the inline nav is visible, the menu button is hidden.
    await expect(header.getByRole('link', { name: 'Inventory' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
  })

  test.describe('with a seeded vehicle', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('vehicle listing: shows more than one card per row (intermediate layout)', async ({ page }) => {
      const ts = Date.now()
      await createPublishedVehicle(page, { makeName: `TabGridMake-${ts}`, modelName: 'GridModelA', title: `Tab Grid A ${ts}`, slug: `tab-grid-a-${ts}` })
      await createPublishedVehicle(page, { makeName: `TabGridMake2-${ts}`, modelName: 'GridModelB', title: `Tab Grid B ${ts}`, slug: `tab-grid-b-${ts}` })

      await page.goto('/en/vehicles')
      await page.waitForLoadState('networkidle')
      const cards = page.locator('[data-slot="card"]')
      expect(await cards.count()).toBeGreaterThanOrEqual(2)

      const box0 = await cards.nth(0).boundingBox()
      const box1 = await cards.nth(1).boundingBox()
      expect(box0).not.toBeNull()
      expect(box1).not.toBeNull()
      // Same row => same (or near-same) top y-coordinate, and side-by-side x-coordinates.
      expect(Math.abs(box0!.y - box1!.y)).toBeLessThan(5)
      expect(box1!.x).toBeGreaterThan(box0!.x)
    })

    test('landing and inventory pages: no horizontal overflow + load timing', async ({ page }) => {
      await seedOverflowVehicle(page, 'Tablet')
      await assertOverflowAndTimingAcrossPages(page, test.info(), 'tablet')
    })
  })
})

test.describe('Responsive — desktop (1280px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('vehicle listing: sidebar filters render inline, no sheet trigger', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await assertNoHorizontalOverflow(page)

    await expect(page.getByRole('combobox', { name: 'Body type' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Filters', exact: true })).not.toBeVisible()
  })

  test('header: full nav row visible, no menu toggle', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Inventory' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
  })

  test.describe('with a seeded vehicle', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('hero photo stays still on desktop', async ({ page }) => {
      await withHeroSlide(page, async () => {
        await page.goto('/en')
        await page.waitForLoadState('networkidle')
        const img = page.getByRole('region', { name: 'Featured photos' }).getByRole('img').first()
        await expect(img).toHaveCSS('animation-name', 'none')
      })
    })

    test('landing and inventory pages: no horizontal overflow + load timing', async ({ page }) => {
      await seedOverflowVehicle(page, 'Desktop')
      await assertOverflowAndTimingAcrossPages(page, test.info(), 'desktop')
    })
  })
})
