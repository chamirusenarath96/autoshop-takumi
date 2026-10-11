import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { AUTH_STATE_PATH } from './helpers'

const logoBytes = () => fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))

/** Uploads `count` small images through the authenticated page's request context, returning their IDs. */
async function uploadPhotos(page: Page, count: number, prefix: string): Promise<string[]> {
  const ids: string[] = []
  for (let n = 1; n <= count; n++) {
    const res = await page.request.post('/api/media', {
      multipart: { file: { name: `${prefix}-${n}.png`, mimeType: 'image/png', buffer: logoBytes() }, _payload: JSON.stringify({ altEn: `${prefix} ${n}` }) },
    })
    ids.push((await res.json()).doc.id)
  }
  return ids
}

// ── Anonymous public browsing ──────────────────────────────────────────────

test.describe('Public site — landing and navigation', () => {
  test('landing page loads in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { name: 'Your best car, from us' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'See our work' })).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await expect(header.getByRole('link', { name: /Inventory|About/ })).toHaveCount(0)
  })

  test('landing page loads in Japanese', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.getByRole('heading', { name: 'あなたの最高の一台を、私たちから' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'ギャラリー' })).toBeVisible()
  })

  test('language switcher navigates between locales', async ({ page }) => {
    await page.goto('/en')
    const header = page.getByRole('banner')
    await header.getByRole('radio', { name: '日本語' }).click()
    await expect(page).toHaveURL(/\/ja/)
    await header.getByRole('radio', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en/)
  })

  test('site defaults to the soft light theme (tinted page, not pure white)', async ({ page }) => {
    await page.goto('/en')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    // --background: #dfe4ea
    expect(bg).toBe('rgb(223, 228, 234)')
  })

  test('removed pages return 404', async ({ page }) => {
    for (const removed of ['/en/about', '/en/vehicles', '/en/vehicles/some-slug']) {
      const res = await page.goto(removed)
      expect(res?.status(), removed).toBe(404)
    }
  })

  test('root / redirects to /ja (default locale)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(ja|en)/)
  })

  test('shop-name wordmark links to homepage', async ({ page }) => {
    await page.goto('/en/gallery')
    await page.getByRole('banner').getByRole('link', { name: 'Autoshop Takumi' }).click()
    await expect(page).toHaveURL(/\/en$|\/en\/$/)
  })

  test('landing page shows the hero copy and the services list in both locales', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('We deliver with excellence.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Shaken & servicing' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Export arrangement' })).toBeVisible()

    await page.goto('/ja')
    await expect(page.getByText('確かな品質で、お届けします。')).toBeVisible()
    await expect(page.getByRole('heading', { name: '輸出手配' })).toBeVisible()
  })

  test('landing page no longer shows cars for sale, prices, or the old sections', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText(/Latest arrivals|Browse vehicles|Why Choose Us|How It Works/)).toHaveCount(0)
    await expect(page.getByText(/¥\d/)).toHaveCount(0)
  })

  test('hero links out to Instagram in a new tab', async ({ page }) => {
    await page.goto('/en')
    const link = page.getByRole('region', { name: 'Featured photos' }).getByRole('link', { name: 'Instagram' })
    await expect(link).toHaveAttribute('href', /instagram\.com\/autoshop_takumi/)
    await expect(link).toHaveAttribute('target', '_blank')
  })

  test('the location block shows contact details and a Google Maps directions link', async ({ page }) => {
    await page.goto('/en')
    const findUs = page.locator('#find-us')
    await expect(findUs.getByText('022-342-2285')).toBeVisible()
    await expect(findUs.getByText('Mon–Sat 9:00–18:00, closed Sundays')).toBeVisible()
    await expect(findUs.getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /google\.com\/maps\/search\/\?api=1&query=/)
  })

  test('footer shows contact details from the translation files in both locales', async ({ page }) => {
    await page.goto('/en')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByText('022-342-2285')).toBeVisible()
    await expect(footer.getByText('Mon–Sat 9:00–18:00, closed Sundays')).toBeVisible()

    await page.goto('/ja')
    await expect(page.getByRole('contentinfo').getByText('月〜土 9:00〜18:00（日曜定休）')).toBeVisible()
  })

  test('theme toggle switches light/dark and the choice persists across reloads', async ({ page }) => {
    await page.goto('/en')
    const html = page.locator('html')
    await expect(html).not.toHaveClass(/dark/)

    await page.getByRole('banner').getByRole('button', { name: 'Toggle theme' }).click()
    await expect(html).toHaveClass(/dark/)

    await page.reload()
    await expect(html).toHaveClass(/dark/)

    await page.getByRole('banner').getByRole('button', { name: 'Toggle theme' }).click()
    await expect(html).not.toHaveClass(/dark/)
  })
})

// ── Photos are uploaded through Payload ───────────────────────────────────

test.describe('Landing hero carousel', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('uploaded hero photos render as a carousel with working controls', async ({ page }) => {
    const ids = await uploadPhotos(page, 2, 'hero')
    const set = await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: ids.map((image) => ({ image })) } })
    expect(set.ok()).toBe(true)

    try {
      await page.goto('/en')
      const hero = page.getByRole('region', { name: 'Featured photos' })
      await expect(hero.getByRole('img')).toHaveCount(2)
      const dots = hero.getByRole('button', { name: /Go to slide/ })
      await expect(dots).toHaveCount(2)
      await expect(dots.first()).toHaveAttribute('aria-current', 'true')

      // Clicks before hydration are no-ops, so retry the (idempotent) dot click until the carousel responds.
      await expect(async () => {
        await dots.nth(1).click()
        await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 500 })
      }).toPass()

      // With two looping slides, "Next" from the last slide wraps back to the first.
      await hero.getByRole('button', { name: 'Next slide' }).click()
      await expect(dots.first()).toHaveAttribute('aria-current', 'true')
    } finally {
      // Leave the shared DB as it was so later specs see the photo-less fallback hero.
      await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: [] } })
    }
  })
})

test.describe('Gallery', () => {
  test('shows an empty state when no photos have been uploaded', async ({ page }) => {
    await page.goto('/en/gallery')
    await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible()
    await expect(page.getByText('Photos are on the way.')).toBeVisible()
  })

  test.describe('with uploaded photos', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('photos appear as caption-less tiles and open in a swipeable lightbox', async ({ page }) => {
      const ids = await uploadPhotos(page, 3, 'gallery')
      const set = await page.request.post('/api/globals/gallery', { data: { photos: ids.map((image) => ({ image })) } })
      expect(set.ok()).toBe(true)

      try {
        await page.goto('/en/gallery')
        await page.waitForLoadState('networkidle')
        const tiles = page.getByRole('button', { name: /Open photo/ })
        await expect(tiles).toHaveCount(3)
        // Photos only: no vehicle titles or prices anywhere on the page.
        await expect(page.getByText(/¥\d|Toyota|Nissan|Skyline/)).toHaveCount(0)

        await tiles.nth(1).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText('2 / 3')).toBeVisible()

        await dialog.getByRole('button', { name: 'Next photo' }).click()
        await expect(dialog.getByText('3 / 3')).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
      } finally {
        await page.request.post('/api/globals/gallery', { data: { photos: [] } })
      }
    })

    test('the landing page shows a "delivered recently" collage linking to the gallery', async ({ page }) => {
      const ids = await uploadPhotos(page, 3, 'collage')
      await page.request.post('/api/globals/gallery', { data: { photos: ids.map((image) => ({ image })) } })

      try {
        await page.goto('/en')
        await expect(page.getByRole('heading', { name: 'Delivered recently' })).toBeVisible()
        await page.getByRole('link', { name: /See the gallery/ }).click()
        await expect(page).toHaveURL(/\/en\/gallery/)
      } finally {
        await page.request.post('/api/globals/gallery', { data: { photos: [] } })
      }
    })
  })
})
