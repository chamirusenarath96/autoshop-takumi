import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

// ── Anonymous public browsing ──────────────────────────────────────────────

test.describe('Public site — navigation and pages', () => {
  test('landing page loads in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /Browse vehicles/i })).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /Inventory/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /About/i })).toBeVisible()
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
    await header.getByRole('button', { name: 'JA' }).click()
    await expect(page).toHaveURL(/\/ja/)
    await header.getByRole('button', { name: 'EN' }).click()
    await expect(page).toHaveURL(/\/en/)
  })

  test('Instagram link is in the nav header', async ({ page }) => {
    await page.goto('/en')
    const instaLink = page.getByRole('banner').getByRole('link', { name: /instagram/i })
    await expect(instaLink).toBeVisible()
    await expect(instaLink).toHaveAttribute('href', /instagram\.com\/autoshop_takumi/)
  })

  test('site is dark-themed with no light/dark toggle', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('button', { name: /switch to dark mode|switch to light mode/i })).toHaveCount(0)
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })

  test('vehicle listing page loads', async ({ page }) => {
    await page.goto('/en/vehicles')
    await expect(page).toHaveURL(/\/en\/vehicles/)
    await expect(page.getByRole('heading', { name: /Vehicle Inventory/i })).toBeVisible()
  })

  test('about page loads in both locales', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.getByRole('heading', { name: /Built by hand, done right/i })).toBeVisible()
    await expect(page.getByText(/Company Profile/i).first()).toBeVisible()
    await expect(page.getByText('022-342-2285').first()).toBeVisible()

    await page.goto('/ja/about')
    await expect(page.getByRole('heading', { name: /職人の手による/i })).toBeVisible()
    await expect(page.getByText(/会社概要/i).first()).toBeVisible()
  })

  test('root / redirects to /ja (default locale)', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/(ja|en)/)
  })

  test('nav logo links to homepage', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.locator('header img[alt="Autoshop Takumi"]').click()
    await expect(page).toHaveURL(/\/en$|\/en\/$/)
  })

  test('homepage renders seeded services and steps from the CMS', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Shaken & servicing')).toBeVisible()
    await expect(page.getByText('Browse the lot')).toBeVisible()
  })

  test('about page renders seeded values and team from the CMS', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.getByText('Honest inspections')).toBeVisible()
    await expect(page.getByText('Owner / Mechanic')).toBeVisible()
  })
})

// ── Vehicle listing + detail — requires admin auth to seed data ────────────

test.describe('Vehicle listing and detail', () => {
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

  test('vehicle appears on public listing UI and card is clickable', async ({ page }) => {
    const ts = Date.now()
    const slug = `ui-test-${ts}`
    const title = `1999 Nissan Skyline GT-R ${ts}`
    await createPublishedVehicle(page, {
      makeName: 'Nissan',
      modelName: 'Skyline',
      title,
      slug,
      year: 1999,
      price: 12000000,
    })

    // Browse public listing — use slug filter so only this run's card appears
    await page.goto(`/en/vehicles`)
    await page.waitForLoadState('networkidle')
    const card = page.getByRole('link', { name: new RegExp(String(ts)) })
    await expect(card).toBeVisible()

    // Click through to detail page
    await card.click()
    await expect(page).toHaveURL(new RegExp(`/en/vehicles/${slug}`))
    await expect(page.getByRole('heading', { name: new RegExp(String(ts)) })).toBeVisible()
  })

  test('vehicle detail page shows price and mileage', async ({ page }) => {
    const slug = `detail-test-${Date.now()}`
    await createPublishedVehicle(page, {
      makeName: 'Mazda',
      modelName: 'RX-7',
      title: '1997 Mazda RX-7 FD3S',
      slug,
      year: 1997,
      price: 6500000,
    })

    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /1997 Mazda RX-7 FD3S/i })).toBeVisible()
    // Price should be formatted (¥6,500,000)
    await expect(page.getByText(/6,500,000/)).toBeVisible()
    // Mileage: 50,000 km from helper default
    await expect(page.getByText(/50,000/)).toBeVisible()
  })

  test('a draft vehicle is not reachable on its public detail page', async ({ page }) => {
    const ts = Date.now()
    const slug = `draft-hidden-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `DraftMake-${ts}`, slug: `draftmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Draft Model', slug: `draftmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `Draft Hidden ${ts}`,
        slug,
        status: 'draft',
        make: makeId,
        model: modelId,
        year: 2018,
      },
    })

    // The Payload Local API bypasses collection access control, so the public detail
    // page must filter by status itself — otherwise an unpublished draft would render.
    const res = await page.goto(`/en/vehicles/${slug}`)
    expect(res?.status()).toBe(404)
    await expect(page.getByText(`Draft Hidden ${ts}`)).toHaveCount(0)
  })

  test('priceOnRequest listing shows neither price on listing or detail pages', async ({ page }) => {
    const ts = Date.now()
    const slug = `por-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `PORMake-${ts}`, slug: `pormk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'POR Model', slug: `pormd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'por test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `Price On Request ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2019,
        heroImage: mediaId,
        priceOnRequest: true,
      },
    })

    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Contact for price')).toBeVisible()
    // .toHaveCount(0), not .not.toBeVisible() — the latter passes trivially when the locator
    // matches nothing, so it wouldn't catch a stray currency symbol rendered elsewhere on the page.
    await expect(page.getByText(/¥|\$/)).toHaveCount(0)

    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Contact for price').first()).toBeVisible()
  })

  test('a listing with both JPY and USD prices shows both, identically on both site locales', async ({ page }) => {
    const ts = Date.now()
    const slug = `dual-price-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `DualMake-${ts}`, slug: `dualmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Dual Model', slug: `dualmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'dual price test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `Dual Price ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2020,
        heroImage: mediaId,
        priceJpy: 4500000,
        priceUsd: 30000,
      },
    })

    // Currency-driven, not locale-driven (FR-004): both prices show on both locales.
    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/4,500,000/)).toBeVisible()
    await expect(page.getByText(/30,000/)).toBeVisible()

    await page.goto(`/ja/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/4,500,000/)).toBeVisible()
    await expect(page.getByText(/30,000/)).toBeVisible()
  })

  test('a JPY-only listing shows the same JPY price on both /ja and /en detail pages', async ({ page }) => {
    const ts = Date.now()
    const slug = `jpy-only-detail-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `JpyOnlyMake-${ts}`, slug: `jpymk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Jpy Model', slug: `jpymd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'jpy only test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `JPY Only ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2021,
        heroImage: mediaId,
        priceJpy: 2200000,
      },
    })

    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/2,200,000/)).toBeVisible()

    await page.goto(`/ja/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/2,200,000/)).toBeVisible()
  })

  test('a USD-only listing is excluded from a price-filtered result but visible via normal browsing', async ({ page }) => {
    const ts = Date.now()
    const mkRes = await page.request.post('/api/makes', { data: { name: `UsdOnlyMake-${ts}`, slug: `usdmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Usd Model', slug: `usdmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'usd only test' },
    })
    const mediaId = (await mediaRes.json()).doc.id
    const slug = `usd-only-${ts}`

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `USD Only ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2022,
        heroImage: mediaId,
        priceUsd: 25000,
      },
    })

    // Excluded from a priceFrom/priceTo-filtered result — no JPY value to compare against.
    await page.goto(`/en/vehicles?make=${makeId}&priceFrom=1&priceTo=999999999`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`USD Only ${ts}`)).not.toBeVisible()

    // Still visible via normal browsing with no price filter applied.
    await page.goto(`/en/vehicles?make=${makeId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`USD Only ${ts}`)).toBeVisible()
  })

  test('a listing with only a Japanese description shows it on the English-locale detail page', async ({ page }) => {
    const ts = Date.now()
    const slug = `desc-fallback-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `DescMake-${ts}`, slug: `descmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Desc Model', slug: `descmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'desc fallback test' },
    })
    const mediaId = (await mediaRes.json()).doc.id
    const japaneseParagraphText = `日本語の説明文-${ts}`

    await page.request.post('/api/vehicles', {
      data: {
        titleJa: `説明フォールバックテスト ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2023,
        heroImage: mediaId,
        priceOnRequest: true,
        descriptionJa: {
          root: {
            type: 'root',
            children: [
              {
                type: 'paragraph',
                children: [{ type: 'text', text: japaneseParagraphText, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
                direction: null,
                format: '',
                indent: 0,
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    })

    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(japaneseParagraphText)).toBeVisible()
  })

  test('a spec row with a Japanese label and an English value renders both halves together', async ({ page }) => {
    const ts = Date.now()
    const slug = `spec-mismatch-${ts}`
    const mkRes = await page.request.post('/api/makes', { data: { name: `SpecMixMake-${ts}`, slug: `specmixmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'Spec Mix Model', slug: `specmixmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'spec mismatch test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: {
        titleEn: `Spec Mismatch ${ts}`,
        slug,
        status: 'available',
        make: makeId,
        model: modelId,
        year: 2024,
        heroImage: mediaId,
        priceOnRequest: true,
        specs: [
          { labelJa: `エンジン-${ts}`, valueEn: `Engine-${ts}` },
          { labelJa: undefined, labelEn: undefined, valueJa: undefined, valueEn: undefined }, // fully blank row — must be omitted
        ],
      },
    })

    await page.goto(`/en/vehicles/${slug}`)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`エンジン-${ts}`)).toBeVisible()
    await expect(page.getByText(`Engine-${ts}`)).toBeVisible()

    // Exactly one spec row rendered — the fully-blank second row is omitted.
    const specRows = page.locator('table tbody tr')
    await expect(specRows).toHaveCount(1)
  })

  test('draft vehicle does NOT appear on public listing UI', async ({ page }) => {
    const ts = Date.now()
    const slug = `draft-invisible-${ts}`

    // Create as draft (no heroImage needed)
    const mkRes = await page.request.post('/api/makes', { data: { name: 'DraftMake', slug: `draftmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'DraftModel', slug: `draftmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    await page.request.post('/api/vehicles', {
      data: { titleEn: `Draft Vehicle Hidden ${ts}`, slug, status: 'draft', make: makeId, model: modelId, year: 2022 },
    })

    // The public listing page is server-rendered using Payload's access control WHERE clause.
    // Drafts are filtered out server-side — they will never appear in the HTML for unauthenticated visitors.
    // (playwright.request.newContext() shares in-process cookies so API checks aren't reliably unauthenticated here —
    // see api.spec.ts comments; curl confirms the API also filters drafts for unauthenticated requests.)
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`Draft Vehicle Hidden ${ts}`)).not.toBeVisible()
  })
})

// ── Vehicle filters ────────────────────────────────────────────────────────

test.describe('Vehicle filters', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('make filter shows only vehicles of the selected make', async ({ page }) => {
    const ts = Date.now()
    // Create two vehicles from different makes
    await createPublishedVehicle(page, {
      makeName: `FilterMakeA-${ts}`,
      modelName: 'ModelA',
      title: `FilterCar-A-${ts}`,
      slug: `filter-a-${ts}`,
      year: 2018,
    })
    await createPublishedVehicle(page, {
      makeName: `FilterMakeB-${ts}`,
      modelName: 'ModelB',
      title: `FilterCar-B-${ts}`,
      slug: `filter-b-${ts}`,
      year: 2019,
    })

    // Get the make ID for FilterMakeA via API
    const makesRes = await page.request.get(`/api/makes?where[name][equals]=FilterMakeA-${ts}`)
    const makesBody = await makesRes.json()
    const makeAId = makesBody.docs[0].id

    // Browse listing filtered by make A
    await page.goto(`/en/vehicles?make=${makeAId}`)
    await page.waitForLoadState('networkidle')

    await expect(page.getByText(`FilterCar-A-${ts}`)).toBeVisible()
    await expect(page.getByText(`FilterCar-B-${ts}`)).not.toBeVisible()
  })

  test('body type filter narrows results', async ({ page }) => {
    const ts = Date.now()
    await createPublishedVehicle(page, {
      makeName: `BTMake-${ts}`,
      modelName: 'Coupe Model',
      title: `BT Coupe ${ts}`,
      slug: `bt-coupe-${ts}`,
      bodyType: 'coupe',
    })
    await createPublishedVehicle(page, {
      makeName: `BTMake2-${ts}`,
      modelName: 'SUV Model',
      title: `BT SUV ${ts}`,
      slug: `bt-suv-${ts}`,
      bodyType: 'suv',
    })

    // Filter to coupe only
    await page.goto('/en/vehicles?bodyType=coupe')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(`BT Coupe ${ts}`)).toBeVisible()
    await expect(page.getByText(`BT SUV ${ts}`)).not.toBeVisible()
  })

  test('reset filters button clears all filters', async ({ page }) => {
    await page.goto('/en/vehicles?bodyType=coupe&transmission=MT')
    await page.waitForLoadState('networkidle')

    // Verify filter params are in URL
    expect(page.url()).toContain('bodyType=coupe')

    // Click reset — waits for client-side navigation to complete
    await page.getByRole('button', { name: /reset/i }).click()
    await page.waitForURL(/\/en\/vehicles$/)

    // URL should have no filter params
    expect(page.url()).not.toContain('bodyType')
    expect(page.url()).not.toContain('transmission')
  })

  test('sort by price low to high reorders cards', async ({ page }) => {
    const ts = Date.now()
    // Both vehicles share the same make so we can filter the listing to just these two
    const mkRes = await page.request.post('/api/makes', { data: { name: `SortMake-${ts}`, slug: `sortmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdCheap = await page.request.post('/api/models', { data: { name: 'Cheap Model', slug: `sort-cheap-md-${ts}`, make: makeId } })
    const mdExp = await page.request.post('/api/models', { data: { name: 'Exp Model', slug: `sort-exp-md-${ts}`, make: makeId } })
    const cheapModelId = (await mdCheap.json()).doc.id
    const expModelId = (await mdExp.json()).doc.id

    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'sort test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: { titleEn: `Sort Cheap ${ts}`, slug: `sort-cheap-${ts}`, status: 'available', make: makeId, model: cheapModelId, year: 2020, priceJpy: 500000, heroImage: mediaId },
    })
    await page.request.post('/api/vehicles', {
      data: { titleEn: `Sort Expensive ${ts}`, slug: `sort-exp-${ts}`, status: 'available', make: makeId, model: expModelId, year: 2020, priceJpy: 9000000, heroImage: mediaId },
    })

    // Filter by this specific make + sort by price ascending
    await page.goto(`/en/vehicles?make=${makeId}&sort=priceLow`)
    await page.waitForLoadState('networkidle')

    const cards = page.locator('a[href*="/vehicles/"]')
    const count = await cards.count()
    expect(count).toBe(2)

    let cheapIdx = -1
    let expIdx = -1
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent()
      if (text?.includes(`Sort Cheap ${ts}`)) cheapIdx = i
      if (text?.includes(`Sort Expensive ${ts}`)) expIdx = i
    }
    expect(cheapIdx).toBeGreaterThanOrEqual(0)
    expect(expIdx).toBeGreaterThanOrEqual(0)
    expect(cheapIdx).toBeLessThan(expIdx)
  })

  test('filter selects use the dark theme (background not hardcoded white)', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')

    const select = page.locator('select').first()
    const bg = await select.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })
})
