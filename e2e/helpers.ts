import { Page, Browser, TestInfo, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// Admin credentials — used for both e2e setup and login
export const ADMIN_EMAIL = 'admin@autoshoptakumi.com'
export const ADMIN_PASSWORD = 'Takumi2024!'
export const AUTH_STATE_PATH = 'e2e/.auth/admin.json'

/**
 * Logs into the admin panel, handling both "create-first-user" and "login" flows.
 * Saves session cookies to AUTH_STATE_PATH for reuse across tests.
 */
export async function loginAsAdmin(browser: Browser, baseURL = 'http://localhost:3000') {
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  await page.goto('/admin')
  await page.waitForURL(/\/(admin\/create-first-user|admin\/login|admin)/)

  if (page.url().includes('create-first-user')) {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('New Password').fill(ADMIN_PASSWORD)
    await page.getByLabel('Confirm Password').fill(ADMIN_PASSWORD)
    await page.getByLabel('Name').fill('Admin')
    await page.getByRole('button', { name: /create/i }).click()
    await page.waitForURL(/\/admin/)
  } else if (page.url().includes('login')) {
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('Password').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /log in/i }).click()
    await page.waitForURL(/\/admin/)
  }

  // Save session for reuse
  await context.storageState({ path: AUTH_STATE_PATH })
  await context.close()
}

/** Create a Make via REST API (authenticated). Returns the created ID. */
export async function createMake(page: Page, name: string, slug: string): Promise<number> {
  const res = await page.request.post('/api/makes', { data: { nameJa: name, nameEn: name, slug } })
  const data = await res.json()
  if (!res.ok()) throw new Error(`createMake failed (${res.status()}): ${JSON.stringify(data.errors ?? data)}`)
  return data.doc.id
}

/** Create a Model via REST API (authenticated). Returns the created ID. */
export async function createModel(page: Page, name: string, slug: string, makeId: number): Promise<number> {
  const res = await page.request.post('/api/models', { data: { nameJa: name, nameEn: name, slug, make: makeId } })
  const data = await res.json()
  if (!res.ok()) throw new Error(`createModel failed (${res.status()}): ${JSON.stringify(data.errors ?? data)}`)
  return data.doc.id
}

/**
 * Upload a media file and return the created media ID.
 * Uses the project logo as a test image fixture.
 */
export async function uploadMedia(page: Page): Promise<number> {
  const imgPath = path.resolve(__dirname, '../public/logo.png')
  const imgBytes = fs.readFileSync(imgPath)
  const res = await page.request.post('/api/media', {
    multipart: {
      file: { name: 'logo.png', mimeType: 'image/png', buffer: imgBytes },
      _payload: JSON.stringify({ altJa: 'テスト車両写真', altEn: 'Test vehicle photo' }),
    },
  })
  const data = await res.json()
  if (!res.ok()) throw new Error(`uploadMedia failed (${res.status()}): ${JSON.stringify(data.errors ?? data)}`)
  return data.doc.id
}

/**
 * Create a fully published (status: available) vehicle with a hero image.
 * Returns the created vehicle document.
 */
export async function createPublishedVehicle(
  page: Page,
  opts: { makeName: string; modelName: string; title: string; slug: string; year?: number; price?: number; bodyType?: string; transmission?: string; galleryImages?: number },
): Promise<{ id: number; slug: string; title: string }> {
  const ts = Date.now()
  const makeId = await createMake(page, opts.makeName, `${opts.makeName.toLowerCase().replace(/\s+/g, '-')}-${ts}`)
  const modelId = await createModel(page, opts.modelName, `${opts.modelName.toLowerCase().replace(/\s+/g, '-')}-${ts}`, makeId)
  const mediaId = await uploadMedia(page)

  const galleryCount = opts.galleryImages ?? 0
  const gallery = []
  for (let i = 0; i < galleryCount; i++) {
    gallery.push({ image: await uploadMedia(page) })
  }

  const res = await page.request.post('/api/vehicles', {
    data: {
      titleJa: opts.title,
      titleEn: opts.title,
      slug: opts.slug,
      status: 'available',
      make: makeId,
      model: modelId,
      year: opts.year ?? 2020,
      priceJpy: opts.price ?? 2000000,
      mileageKm: 50000,
      heroImage: mediaId,
      bodyType: opts.bodyType,
      transmission: opts.transmission,
      gallery: gallery.length > 0 ? gallery : undefined,
    },
  })
  const data = await res.json()
  if (res.status() !== 201) throw new Error(`createPublishedVehicle failed: ${JSON.stringify(data.errors ?? data)}`)
  return { id: data.doc.id, slug: data.doc.slug, title: data.doc.titleJa }
}

/**
 * Asserts the page has no horizontal overflow at the current viewport
 * (document.documentElement.scrollWidth should never exceed window.innerWidth).
 */
export async function assertNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(scrollWidth, `document.documentElement.scrollWidth (${scrollWidth}) should not exceed window.innerWidth (${innerWidth})`).toBeLessThanOrEqual(innerWidth)
}

/**
 * Captures Navigation Timing data for the current page and attaches it to the
 * Playwright report. Informational only — not a pass/fail performance gate
 * (see specs/001-mobile-responsive-support/research.md §7).
 */
export async function attachPageLoadTiming(page: Page, testInfo: TestInfo, label: string) {
  const timing = await page.evaluate(() => {
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (!nav) return null
    return {
      domContentLoadedMs: nav.domContentLoadedEventEnd - nav.startTime,
      loadEventMs: nav.loadEventEnd - nav.startTime,
    }
  })
  await testInfo.attach(`page-load-timing:${label}`, {
    body: JSON.stringify(timing ?? { error: 'no navigation timing entry available' }, null, 2),
    contentType: 'application/json',
  })
  // Loose smoke-test upper bound — catches a true hang/regression, not a real perf budget.
  if (timing) expect(timing.loadEventMs).toBeLessThan(30_000)
}
