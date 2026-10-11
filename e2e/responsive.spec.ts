import { test, expect, type Page, type TestInfo } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { assertNoHorizontalOverflow, attachPageLoadTiming, AUTH_STATE_PATH, VIEWPORTS } from './helpers'

/** Visits the landing and gallery pages, asserting no horizontal overflow and attaching load timing for each. */
async function assertOverflowAndTimingAcrossPages(page: Page, testInfo: TestInfo, labelPrefix: string) {
  await page.goto('/en')
  await page.waitForLoadState('networkidle')
  await assertNoHorizontalOverflow(page)
  await attachPageLoadTiming(page, testInfo, `${labelPrefix}:landing`)

  await page.goto('/en/gallery')
  await page.waitForLoadState('networkidle')
  await assertNoHorizontalOverflow(page)
  await attachPageLoadTiming(page, testInfo, `${labelPrefix}:gallery`)
}

async function uploadPhoto(page: Page, name: string): Promise<string> {
  const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
  const res = await page.request.post('/api/media', {
    multipart: { file: { name, mimeType: 'image/png', buffer: imgBytes }, _payload: JSON.stringify({ altEn: name }) },
  })
  return (await res.json()).doc.id
}

/** Gives the landing hero one photo, runs `check`, then clears it so other specs see the photo-less hero. */
async function withHeroSlide(page: Page, check: () => Promise<void>) {
  const id = await uploadPhoto(page, 'pan-hero.png')
  await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: [{ image: id }] } })
  try {
    await check()
  } finally {
    await page.request.post('/api/globals/homepage?locale=en', { data: { heroSlides: [] } })
  }
}

/** Fills the gallery with `count` photos, runs `check`, then empties it again. */
async function withGalleryPhotos(page: Page, count: number, check: () => Promise<void>) {
  const photos = []
  for (let i = 0; i < count; i++) photos.push({ image: await uploadPhoto(page, `resp-gallery-${i}.png`) })
  await page.request.post('/api/globals/gallery', { data: { photos } })
  try {
    await check()
  } finally {
    await page.request.post('/api/globals/gallery', { data: { photos: [] } })
  }
}

/** Number of distinct x positions (columns) the gallery tiles occupy. */
async function galleryColumnCount(page: Page): Promise<number> {
  const xs = await page.getByRole('button', { name: /Open photo/ }).evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().left)))
  return new Set(xs).size
}

test.describe('Responsive — mobile (375px)', () => {
  test.use({ viewport: VIEWPORTS.mobile, hasTouch: true })

  test('header: menu sheet reveals nav links and the controls, and navigating works', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Gallery' })).not.toBeVisible()

    await header.getByRole('button', { name: 'Menu' }).click()
    const panel = page.getByTestId('mobile-nav-panel')
    await expect(panel.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await expect(panel.getByRole('radio', { name: '日本語' })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Toggle theme' })).toBeVisible()

    await panel.getByRole('link', { name: 'Gallery' }).click()
    await expect(page).toHaveURL(/\/en\/gallery/)
  })

  test.describe('with photos', () => {
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

    test('gallery: two columns, and a photo opens full-size in a lightbox that fits the screen', async ({ page }) => {
      await withGalleryPhotos(page, 4, async () => {
        await page.goto('/en/gallery')
        await page.waitForLoadState('networkidle')
        expect(await galleryColumnCount(page)).toBe(2)

        await page.getByRole('button', { name: 'Open photo 1' }).tap()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        const box = await dialog.boundingBox()
        expect(box!.width).toBeLessThanOrEqual(VIEWPORTS.mobile.width)
        await assertNoHorizontalOverflow(page)
      })
    })

    test('landing and gallery pages: no horizontal overflow + load timing', async ({ page }) => {
      await withGalleryPhotos(page, 3, async () => {
        await assertOverflowAndTimingAcrossPages(page, test.info(), 'mobile')
      })
    })
  })
})

test.describe('Responsive — tablet (768px)', () => {
  test.use({ viewport: VIEWPORTS.tablet })

  test('header: inline nav is visible and the menu button is hidden at the md breakpoint', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
  })

  test.describe('with photos', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('gallery: three columns', async ({ page }) => {
      await withGalleryPhotos(page, 6, async () => {
        await page.goto('/en/gallery')
        await page.waitForLoadState('networkidle')
        expect(await galleryColumnCount(page)).toBe(3)
      })
    })

    test('landing and gallery pages: no horizontal overflow + load timing', async ({ page }) => {
      await withGalleryPhotos(page, 3, async () => {
        await assertOverflowAndTimingAcrossPages(page, test.info(), 'tablet')
      })
    })
  })
})

test.describe('Responsive — desktop (1280px)', () => {
  test.use({ viewport: VIEWPORTS.desktop })

  test('header: full nav row visible, no menu toggle', async ({ page }) => {
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    const header = page.getByRole('banner')

    await expect(header.getByRole('link', { name: 'Gallery' })).toBeVisible()
    await expect(header.getByRole('button', { name: 'Menu' })).not.toBeVisible()
  })

  test.describe('with photos', () => {
    test.use({ storageState: AUTH_STATE_PATH })

    test('hero photo stays still on desktop', async ({ page }) => {
      await withHeroSlide(page, async () => {
        await page.goto('/en')
        await page.waitForLoadState('networkidle')
        const img = page.getByRole('region', { name: 'Featured photos' }).getByRole('img').first()
        await expect(img).toHaveCSS('animation-name', 'none')
      })
    })

    test('gallery: four columns', async ({ page }) => {
      await withGalleryPhotos(page, 8, async () => {
        await page.goto('/en/gallery')
        await page.waitForLoadState('networkidle')
        expect(await galleryColumnCount(page)).toBe(4)
      })
    })

    test('landing and gallery pages: no horizontal overflow + load timing', async ({ page }) => {
      await withGalleryPhotos(page, 3, async () => {
        await assertOverflowAndTimingAcrossPages(page, test.info(), 'desktop')
      })
    })
  })
})
