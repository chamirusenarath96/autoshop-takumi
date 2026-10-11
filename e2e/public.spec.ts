import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

// ── Anonymous public browsing ──────────────────────────────────────────────

test.describe('Public site — landing and navigation', () => {
  test('landing page loads in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /Browse vehicles/i })).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /Inventory/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /About/i })).toHaveCount(0)
  })

  test('landing page loads in Japanese', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.getByRole('link', { name: /在庫を見る/ }).first()).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /在庫車両/ })).toBeVisible()
  })

  test('language switcher navigates between locales', async ({ page }) => {
    await page.goto('/en')
    const header = page.getByRole('banner')
    await header.getByRole('radio', { name: '日本語' }).click()
    await expect(page).toHaveURL(/\/ja/)
    await header.getByRole('radio', { name: 'English' }).click()
    await expect(page).toHaveURL(/\/en/)
  })

  test('site defaults to the stock light shadcn theme', async ({ page }) => {
    await page.goto('/en')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    // oklch(1 0 0) — pure white, serialised by the browser as either rgb or color()
    expect(bg).toMatch(/^(rgb\(255, 255, 255\)|oklch\(1 0 0\)|color\(srgb 1 1 1\))$/)
  })

  test('removed pages return 404', async ({ page }) => {
    const about = await page.goto('/en/about')
    expect(about?.status()).toBe(404)
    const detail = await page.goto('/en/vehicles/some-slug')
    expect(detail?.status()).toBe(404)
  })

  test('vehicle listing page loads', async ({ page }) => {
    await page.goto('/en/vehicles')
    await expect(page).toHaveURL(/\/en\/vehicles/)
    await expect(page.getByRole('heading', { name: /Vehicle Inventory/i })).toBeVisible()
  })

  test('root / redirects to /ja (default locale)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(ja|en)/)
  })

  test('shop-name wordmark links to homepage', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.getByRole('banner').getByRole('link', { name: 'Autoshop Takumi' }).click()
    await expect(page).toHaveURL(/\/en$|\/en\/$/)
  })

  test('landing page shows only the hero and CTA — stats, featured, why-us, services and steps are removed', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('years in business')).toHaveCount(0)
    await expect(page.getByText('From the Lot')).toHaveCount(0)
    await expect(page.getByText('Why Choose Us')).toHaveCount(0)
    await expect(page.getByText('Our Services')).toHaveCount(0)
    await expect(page.getByText('How It Works')).toHaveCount(0)
  })

  test('landing page renders hero heading/subheading in both locales (spec 003, US2 Scenario 2.2)', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('heading', { name: 'Your best car, from us' })).toBeVisible()
    await expect(page.getByText('We deliver with excellence.')).toBeVisible()

    await page.goto('/ja')
    await expect(page.getByRole('heading', { name: 'あなたの最高の一台を、私たちから' })).toBeVisible()
    await expect(page.getByText('確かな品質で、お届けします。')).toBeVisible()
  })

  test('hero links out to Instagram in a new tab', async ({ page }) => {
    await page.goto('/en')
    const link = page.getByRole('region', { name: 'Featured photos' }).getByRole('link', { name: 'Instagram' })
    await expect(link).toHaveAttribute('href', /instagram\.com\/autoshop_takumi/)
    await expect(link).toHaveAttribute('target', '_blank')
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

// ── Landing hero carousel — photos are uploaded through Payload ───────────

test.describe('Landing hero carousel', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('uploaded hero photos render as a carousel with working controls', async ({ page }) => {
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const ids: string[] = []
    for (const n of [1, 2]) {
      const res = await page.request.post('/api/media', {
        multipart: { file: { name: `hero-${n}.png`, mimeType: 'image/png', buffer: imgBytes }, _payload: JSON.stringify({ altEn: `Hero ${n}` }) },
      })
      ids.push((await res.json()).doc.id)
    }
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

// ── Vehicle inventory — requires admin auth to seed data ───────────────────

type SeedOptions = {
  titleEn?: string
  titleJa?: string
  status?: string
  year?: number
  priceJpy?: number
  priceUsd?: number
  priceOnRequest?: boolean
  withImage?: boolean
}

/** Seeds a make + model + vehicle via the REST API and returns their IDs. */
async function seedVehicle(page: Page, ts: number, label: string, opts: SeedOptions = {}) {
  const mkRes = await page.request.post('/api/makes', {
    data: { nameJa: `${label}Make-${ts}`, nameEn: `${label}Make-${ts}`, slug: `${label.toLowerCase()}mk-${ts}` },
  })
  const makeId = (await mkRes.json()).doc.id
  const mdRes = await page.request.post('/api/models', {
    data: { nameJa: `${label} Model`, nameEn: `${label} Model`, slug: `${label.toLowerCase()}md-${ts}`, make: makeId },
  })
  const modelId = (await mdRes.json()).doc.id

  let heroImage: string | undefined
  if (opts.withImage !== false) {
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, _payload: JSON.stringify({ altEn: `${label} test` }) },
    })
    heroImage = (await mediaRes.json()).doc.id
  }

  await page.request.post('/api/vehicles', {
    data: {
      titleEn: opts.titleEn,
      titleJa: opts.titleJa,
      slug: `${label.toLowerCase()}-${ts}`,
      status: opts.status ?? 'available',
      make: makeId,
      model: modelId,
      year: opts.year ?? 2020,
      heroImage,
      priceJpy: opts.priceJpy,
      priceUsd: opts.priceUsd,
      priceOnRequest: opts.priceOnRequest,
    },
  })
  return { makeId, modelId }
}

const card = (page: Page, text: string | RegExp) => page.locator('[data-slot="card"]').filter({ hasText: text })

test.describe('Vehicle inventory', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('vehicle added in admin appears on public listing page', async ({ page, playwright, baseURL }) => {
    const slug = `pub-test-${Date.now()}`
    await createPublishedVehicle(page, {
      makeName: 'Toyota',
      modelName: 'Supra',
      title: '1993 Toyota Supra RZ',
      slug,
      year: 1993,
      price: 8500000,
    })

    // View as unauthenticated public visitor
    const publicCtx = await playwright.request.newContext({ baseURL })
    const res = await publicCtx.get(`/api/vehicles?where[slug][equals]=${slug}&locale=en`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs).toHaveLength(1)
    expect(body.docs[0].titleJa).toBe('1993 Toyota Supra RZ')
    expect(body.docs[0].titleEn).toBe('1993 Toyota Supra RZ')
    expect(body.docs[0].status).toBe('available')
    await publicCtx.dispose()
  })

  test('vehicle appears on the public inventory as a display-only card showing price and mileage', async ({ page }) => {
    const ts = Date.now()
    const title = `1999 Nissan Skyline GT-R ${ts}`
    await createPublishedVehicle(page, {
      makeName: 'Nissan',
      modelName: 'Skyline',
      title,
      slug: `ui-test-${ts}`,
      year: 1999,
      price: 12000000,
    })

    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    const vehicleCard = card(page, String(ts))
    await expect(vehicleCard).toBeVisible()
    await expect(vehicleCard.getByText(/12,000,000/)).toBeVisible()
    await expect(vehicleCard.getByText(/50,000/)).toBeVisible()
    // Cards are display-only while the detail page is out of scope.
    await expect(vehicleCard.getByRole('link')).toHaveCount(0)
  })

  test('a draft vehicle does NOT appear on the public inventory', async ({ page }) => {
    const ts = Date.now()
    await seedVehicle(page, ts, 'Draft', { titleEn: `Draft Vehicle Hidden ${ts}`, status: 'draft', withImage: false })

    // The inventory page is server-rendered via the Payload Local API, which bypasses
    // collection access control — so the page itself must filter by status.
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`Draft Vehicle Hidden ${ts}`)).toHaveCount(0)
  })

  test('priceOnRequest listing shows "Contact for price" and no currency', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Por', { titleEn: `Price On Request ${ts}`, priceOnRequest: true })

    await page.goto(`/en/vehicles?make=${makeId}`)
    await page.waitForLoadState('networkidle')
    const vehicleCard = card(page, `Price On Request ${ts}`)
    await expect(vehicleCard.getByText('Contact for price')).toBeVisible()
    // .toHaveCount(0), not .not.toBeVisible() — the latter passes trivially when the locator
    // matches nothing, so it wouldn't catch a stray currency symbol.
    await expect(vehicleCard.getByText(/¥|\$/)).toHaveCount(0)
  })

  test('a listing with both JPY and USD prices shows both, identically on both site locales', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Dual', { titleEn: `Dual Price ${ts}`, priceJpy: 4500000, priceUsd: 30000 })

    // Currency-driven, not locale-driven (FR-004): both prices show on both locales.
    for (const locale of ['en', 'ja']) {
      await page.goto(`/${locale}/vehicles?make=${makeId}`)
      await page.waitForLoadState('networkidle')
      const vehicleCard = card(page, `Dual Price ${ts}`)
      await expect(vehicleCard.getByText(/4,500,000/)).toBeVisible()
      await expect(vehicleCard.getByText(/30,000/)).toBeVisible()
    }
  })

  test('a JPY-only listing shows the same JPY price on both /ja and /en', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Jpy', { titleEn: `JPY Only ${ts}`, priceJpy: 2200000 })

    for (const locale of ['en', 'ja']) {
      await page.goto(`/${locale}/vehicles?make=${makeId}`)
      await page.waitForLoadState('networkidle')
      await expect(card(page, `JPY Only ${ts}`).getByText(/2,200,000/)).toBeVisible()
    }
  })

  test('a USD-only listing is excluded from a price-filtered result but visible via normal browsing', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Usd', { titleEn: `USD Only ${ts}`, priceUsd: 25000 })

    // Excluded from a priceFrom/priceTo-filtered result — no JPY value to compare against.
    await page.goto(`/en/vehicles?make=${makeId}&priceFrom=1&priceTo=999999999`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`USD Only ${ts}`)).toHaveCount(0)

    // Still visible via normal browsing with no price filter applied.
    await page.goto(`/en/vehicles?make=${makeId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`USD Only ${ts}`)).toBeVisible()
  })

  test('a Japanese-only title falls back onto the English-locale card', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Fallback', { titleJa: `説明フォールバックテスト ${ts}`, priceOnRequest: true })

    await page.goto(`/en/vehicles?make=${makeId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`説明フォールバックテスト ${ts}`)).toBeVisible()
  })

  test('a sold listing shows a Sold badge', async ({ page }) => {
    const ts = Date.now()
    const { makeId } = await seedVehicle(page, ts, 'Sold', { titleEn: `Sold Car ${ts}`, status: 'sold', priceOnRequest: true })

    await page.goto(`/en/vehicles?make=${makeId}`)
    await page.waitForLoadState('networkidle')
    await expect(card(page, `Sold Car ${ts}`).locator('[data-slot="badge"]', { hasText: 'Sold' })).toBeVisible()
  })
})

// ── Vehicle filters ────────────────────────────────────────────────────────

test.describe('Vehicle filters', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('make filter label shows the correct language on both locales, and falls back when only one language is set (spec 003, US2 Scenario 2.1 / FR-012)', async ({ page }) => {
    const ts = Date.now()
    const mkRes = await page.request.post('/api/makes', {
      data: { nameJa: `フィルターメーカー-${ts}`, nameEn: `FilterLabelMake-${ts}`, slug: `filter-label-mk-${ts}` },
    })
    expect(mkRes.status()).toBe(201)

    // Japanese-only fallback make — no nameEn set.
    const fallbackRes = await page.request.post('/api/makes', {
      data: { nameJa: `フォールバックのみ-${ts}`, slug: `filter-fallback-mk-${ts}` },
    })
    expect(fallbackRes.status()).toBe(201)

    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await page.locator('#desktop-make').click()
    await expect(page.getByRole('option', { name: `FilterLabelMake-${ts}` })).toBeVisible()
    // Fallback: an English-locale page shows the Japanese name rather than a blank option.
    await expect(page.getByRole('option', { name: `フォールバックのみ-${ts}` })).toBeVisible()

    await page.goto('/ja/vehicles')
    await page.waitForLoadState('networkidle')
    await page.locator('#desktop-make').click()
    await expect(page.getByRole('option', { name: `フィルターメーカー-${ts}` })).toBeVisible()
  })

  test('model filter label shows the correct language on both locales (spec 003, US2 Scenario 2.1 / FR-012)', async ({ page }) => {
    const ts = Date.now()
    const mkRes = await page.request.post('/api/makes', {
      data: { nameJa: `モデルフィルターメーカー-${ts}`, nameEn: `ModelFilterMake-${ts}`, slug: `model-filter-mk-${ts}` },
    })
    expect(mkRes.status()).toBe(201)
    const makeId = (await mkRes.json()).doc.id

    const mdRes = await page.request.post('/api/models', {
      data: { nameJa: `モデルフィルター-${ts}`, nameEn: `ModelFilterLabel-${ts}`, slug: `model-filter-md-${ts}`, make: makeId },
    })
    expect(mdRes.status()).toBe(201)

    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await page.locator('#desktop-model').click()
    await expect(page.getByRole('option', { name: `ModelFilterLabel-${ts}` })).toBeVisible()

    await page.goto('/ja/vehicles')
    await page.waitForLoadState('networkidle')
    await page.locator('#desktop-model').click()
    await expect(page.getByRole('option', { name: `モデルフィルター-${ts}` })).toBeVisible()
  })

  test('choosing a make in the filter narrows the results', async ({ page }) => {
    const ts = Date.now()
    await createPublishedVehicle(page, { makeName: `PickMakeA-${ts}`, modelName: 'ModelA', title: `PickCar-A-${ts}`, slug: `pick-a-${ts}`, year: 2018 })
    await createPublishedVehicle(page, { makeName: `PickMakeB-${ts}`, modelName: 'ModelB', title: `PickCar-B-${ts}`, slug: `pick-b-${ts}`, year: 2019 })

    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await page.locator('#desktop-make').click()
    await page.getByRole('option', { name: `PickMakeA-${ts}` }).click()
    await page.waitForURL(/make=/)

    await expect(page.getByText(`PickCar-A-${ts}`)).toBeVisible()
    await expect(page.getByText(`PickCar-B-${ts}`)).toHaveCount(0)
  })

  test('make filter shows only vehicles of the selected make', async ({ page }) => {
    const ts = Date.now()
    await createPublishedVehicle(page, { makeName: `FilterMakeA-${ts}`, modelName: 'ModelA', title: `FilterCar-A-${ts}`, slug: `filter-a-${ts}`, year: 2018 })
    await createPublishedVehicle(page, { makeName: `FilterMakeB-${ts}`, modelName: 'ModelB', title: `FilterCar-B-${ts}`, slug: `filter-b-${ts}`, year: 2019 })

    const makesRes = await page.request.get(`/api/makes?where[nameJa][equals]=FilterMakeA-${ts}`)
    const makeAId = (await makesRes.json()).docs[0].id

    await page.goto(`/en/vehicles?make=${makeAId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(`FilterCar-A-${ts}`)).toBeVisible()
    await expect(page.getByText(`FilterCar-B-${ts}`)).toHaveCount(0)
  })

  test('body type filter narrows results', async ({ page }) => {
    const ts = Date.now()
    await createPublishedVehicle(page, { makeName: `BTMake-${ts}`, modelName: 'Coupe Model', title: `BT Coupe ${ts}`, slug: `bt-coupe-${ts}`, bodyType: 'coupe' })
    await createPublishedVehicle(page, { makeName: `BTMake2-${ts}`, modelName: 'SUV Model', title: `BT SUV ${ts}`, slug: `bt-suv-${ts}`, bodyType: 'suv' })

    await page.goto('/en/vehicles?bodyType=coupe')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`BT Coupe ${ts}`)).toBeVisible()
    await expect(page.getByText(`BT SUV ${ts}`)).toHaveCount(0)
  })

  test('reset filters button clears all filters', async ({ page }) => {
    await page.goto('/en/vehicles?bodyType=coupe&transmission=MT')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('bodyType=coupe')

    await page.getByRole('button', { name: /reset/i }).click()
    await page.waitForURL(/\/en\/vehicles$/)

    expect(page.url()).not.toContain('bodyType')
    expect(page.url()).not.toContain('transmission')
  })

  test('sort by price low to high reorders cards', async ({ page }) => {
    const ts = Date.now()
    // Both vehicles share the same make so the listing can be narrowed to just these two
    const mkRes = await page.request.post('/api/makes', { data: { nameJa: `SortMake-${ts}`, nameEn: `SortMake-${ts}`, slug: `sortmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdCheap = await page.request.post('/api/models', { data: { nameJa: 'Cheap Model', nameEn: 'Cheap Model', slug: `sort-cheap-md-${ts}`, make: makeId } })
    const mdExp = await page.request.post('/api/models', { data: { nameJa: 'Exp Model', nameEn: 'Exp Model', slug: `sort-exp-md-${ts}`, make: makeId } })
    const cheapModelId = (await mdCheap.json()).doc.id
    const expModelId = (await mdExp.json()).doc.id

    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, _payload: JSON.stringify({ altEn: 'sort test' }) },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: { titleEn: `Sort Cheap ${ts}`, slug: `sort-cheap-${ts}`, status: 'available', make: makeId, model: cheapModelId, year: 2020, priceJpy: 500000, heroImage: mediaId },
    })
    await page.request.post('/api/vehicles', {
      data: { titleEn: `Sort Expensive ${ts}`, slug: `sort-exp-${ts}`, status: 'available', make: makeId, model: expModelId, year: 2020, priceJpy: 9000000, heroImage: mediaId },
    })

    await page.goto(`/en/vehicles?make=${makeId}&sort=priceLow`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('[data-slot="card"]')
    await expect(cards).toHaveCount(2)
    const texts = await cards.allTextContents()
    const cheapIdx = texts.findIndex((t) => t.includes(`Sort Cheap ${ts}`))
    const expIdx = texts.findIndex((t) => t.includes(`Sort Expensive ${ts}`))
    expect(cheapIdx).toBeGreaterThanOrEqual(0)
    expect(expIdx).toBeGreaterThanOrEqual(0)
    expect(cheapIdx).toBeLessThan(expIdx)
  })
})
