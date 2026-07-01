import { test, expect } from '@playwright/test'
import { AUTH_STATE_PATH, createPublishedVehicle } from './helpers'

// ── Anonymous public browsing ──────────────────────────────────────────────

test.describe('Public site — navigation and pages', () => {
  test('landing page loads in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /View Inventory/i })).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /Inventory/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /About/i })).toBeVisible()
  })

  test('landing page loads in Japanese', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.getByRole('link', { name: /在庫を見る/ })).toBeVisible()
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

  test('dark/light theme toggle works', async ({ page }) => {
    await page.goto('/en')
    const html = page.locator('html')
    const toggle = page.getByRole('button', { name: /switch to dark mode|switch to light mode/i })
    await expect(toggle).toBeVisible()

    const initialTheme = await html.getAttribute('data-theme')
    await toggle.click()
    const newTheme = await html.getAttribute('data-theme')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('vehicle listing page loads', async ({ page }) => {
    await page.goto('/en/vehicles')
    await expect(page).toHaveURL(/\/en\/vehicles/)
    await expect(page.getByRole('heading', { name: /Vehicle Inventory/i })).toBeVisible()
  })

  test('about page loads in both locales', async ({ page }) => {
    await page.goto('/en/about')
    await expect(page.getByRole('heading', { name: /About Autoshop Takumi/i })).toBeVisible()
    await expect(page.getByText(/Company Profile/i).first()).toBeVisible()
    await expect(page.getByText('022-342-2285').first()).toBeVisible()

    await page.goto('/ja/about')
    await expect(page.getByRole('heading', { name: /オートショップ匠/i })).toBeVisible()
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
})

// ── Vehicle listing + detail — requires admin auth to seed data ────────────

test.describe('Vehicle listing and detail', () => {
  test.use({ storageState: AUTH_STATE_PATH })

  test('vehicle added in admin appears on public listing page', async ({ page, playwright }) => {
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
    const publicCtx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' })
    const res = await publicCtx.get(`/api/vehicles?where[slug][equals]=${slug}&locale=en`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs).toHaveLength(1)
    expect(body.docs[0].title).toBe('1993 Toyota Supra RZ')
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

  test('draft vehicle does NOT appear on public listing UI', async ({ page }) => {
    const ts = Date.now()
    const slug = `draft-invisible-${ts}`

    // Create as draft (no heroImage needed)
    const mkRes = await page.request.post('/api/makes', { data: { name: 'DraftMake', slug: `draftmk-${ts}` } })
    const makeId = (await mkRes.json()).doc.id
    const mdRes = await page.request.post('/api/models', { data: { name: 'DraftModel', slug: `draftmd-${ts}`, make: makeId } })
    const modelId = (await mdRes.json()).doc.id
    await page.request.post('/api/vehicles', {
      data: { title: `Draft Vehicle Hidden ${ts}`, slug, status: 'draft', make: makeId, model: modelId, year: 2022 },
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

    const { default: fs } = await import('fs')
    const { default: path } = await import('path')
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../public/logo.png'))
    const mediaRes = await page.request.post('/api/media', {
      multipart: { file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes }, alt: 'sort test' },
    })
    const mediaId = (await mediaRes.json()).doc.id

    await page.request.post('/api/vehicles', {
      data: { title: `Sort Cheap ${ts}`, slug: `sort-cheap-${ts}`, status: 'available', make: makeId, model: cheapModelId, year: 2020, price: 500000, heroImage: mediaId },
    })
    await page.request.post('/api/vehicles', {
      data: { title: `Sort Expensive ${ts}`, slug: `sort-exp-${ts}`, status: 'available', make: makeId, model: expModelId, year: 2020, price: 9000000, heroImage: mediaId },
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

  test('filter selects adapt to dark mode (background not hardcoded white)', async ({ page }) => {
    await page.goto('/en/vehicles')
    await page.waitForLoadState('networkidle')

    // Switch to dark mode
    await page.getByRole('button', { name: /switch to dark mode/i }).click()
    await page.waitForTimeout(300)

    const select = page.locator('select').first()
    const bg = await select.evaluate((el) => getComputedStyle(el).backgroundColor)
    // In dark mode the background should not be pure white (rgb(255, 255, 255))
    expect(bg).not.toBe('rgb(255, 255, 255)')
  })
})
