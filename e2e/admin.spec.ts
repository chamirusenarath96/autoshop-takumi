import { test, expect } from '@playwright/test'
import { createMake, createModel, ADMIN_EMAIL, AUTH_STATE_PATH } from './helpers'

test.use({ storageState: AUTH_STATE_PATH })

// ── Auth ───────────────────────────────────────────────────────────────────

test('admin dashboard loads with sidebar navigation', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  await expect(page.getByRole('link', { name: 'Vehicles' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Makes' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inquiries' })).toBeVisible()
})

test('account page is accessible when logged in', async ({ page }) => {
  await page.goto('/admin/account')
  await page.waitForLoadState('networkidle')
  // Confirm we're authenticated — not redirected to login
  await expect(page).toHaveURL(/\/admin\/account/)
  await expect(page).not.toHaveURL(/login/)
})

// ── Styling ──────────────────────────────────────────────────────────────
// Guards against regressing payload-theme-vars.css (see that file for the
// full story: Payload's own root CSS variables fail to compile in this
// project's build, so we supply them ourselves, admin-scoped only).

test('admin renders with Payload theme variables resolved (not browser defaults)', async ({ page }) => {
  // Use the Makes create form — guaranteed to render a "Save" button
  // regardless of auth/redirect state (unlike /admin/login, which redirects
  // to the dashboard when already authenticated).
  await page.goto('/admin/collections/makes/create')
  await page.waitForLoadState('networkidle')

  const bodyFont = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  expect(bodyFont).not.toContain('Times New Roman')
  expect(bodyFont).toContain('apple-system')

  const radiusVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--style-radius-s').trim(),
  )
  expect(radiusVar).toBe('3px')

  const saveBtn = page.getByRole('button', { name: /save/i }).first()
  const btnRadius = await saveBtn.evaluate((el) => getComputedStyle(el).borderRadius)
  const btnPadding = await saveBtn.evaluate((el) => getComputedStyle(el).padding)
  expect(btnRadius).toBe('3px')
  expect(btnPadding).not.toBe('0px') // was "0px" when --style-radius-s/--font-body were undefined
})

test('admin styling does not leak from / into the public site', async ({ page }) => {
  // Public site should NOT have data-public unset by admin CSS, and should
  // NOT have Payload's --theme-* variables defined (separate stylesheets).
  await page.goto('/en')
  await page.waitForLoadState('networkidle')
  const hasPayloadVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--style-radius-s').trim(),
  )
  expect(hasPayloadVar).toBe('') // payload-theme-vars.css must not be loaded on the public site

  const hasDataPublic = await page.evaluate(() => document.documentElement.hasAttribute('data-public'))
  expect(hasDataPublic).toBe(true)
})

// ── Makes ──────────────────────────────────────────────────────────────────

test('Makes list loads with Create New button', async ({ page }) => {
  await page.goto('/admin/collections/makes')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Makes/)
  await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
})

test('can create a Make', async ({ page }) => {
  await page.goto('/admin/collections/makes/create')
  await page.waitForLoadState('networkidle')

  await page.getByLabel('Name').fill('Nissan')
  await page.getByLabel('Slug').fill(`nissan-e2e-${Date.now()}`)
  await page.getByRole('button', { name: /save/i }).click()

  await expect(page).toHaveURL(/\/admin\/collections\/makes\/\d+/)
  await expect(page.getByLabel('Name')).toHaveValue('Nissan')
})

// ── Models ─────────────────────────────────────────────────────────────────

test('Models list loads', async ({ page }) => {
  await page.goto('/admin/collections/models')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Models/)
})

// ── Vehicles ───────────────────────────────────────────────────────────────

test('Vehicles list loads with Create New button', async ({ page }) => {
  await page.goto('/admin/collections/vehicles')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Vehicles/)
  await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
})

test('vehicle create form shows all key fields', async ({ page }) => {
  await page.goto('/admin/collections/vehicles/create')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Creating.*Vehicle/)

  await expect(page.getByLabel('Title*— Japanese')).toBeVisible()
  await expect(page.getByLabel('Slug*')).toBeVisible()
  await expect(page.getByLabel('Year*')).toBeVisible()
  // Use number input specifically to avoid the checkbox collision
  await expect(page.getByRole('spinbutton', { name: 'Price' })).toBeVisible()
  await expect(page.getByLabel('Mileage (km)')).toBeVisible()
})

test('can create a draft vehicle via API', async ({ page }) => {
  const makeId = await createMake(page, 'Mazda', `mazda-${Date.now()}`)
  const modelId = await createModel(page, 'RX-7', `rx7-${Date.now()}`, makeId)

  const res = await page.request.post('/api/vehicles', {
    data: {
      title: '1995 Mazda RX-7 FD3S',
      slug: `rx7-e2e-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 1995,
      price: 4500000,
    },
  })
  const data = await res.json()
  expect(res.status(), `Vehicle create failed: ${JSON.stringify(data.errors ?? data)}`).toBe(201)
  expect(data.doc.status).toBe('draft')
  expect(data.doc.title).toBe('1995 Mazda RX-7 FD3S')
})

test('blocks publishing a vehicle without a hero image', async ({ page }) => {
  const makeId = await createMake(page, 'Subaru', `subaru-${Date.now()}`)
  const modelId = await createModel(page, 'Impreza', `impreza-${Date.now()}`, makeId)

  const createRes = await page.request.post('/api/vehicles', {
    data: { title: 'Test STI', slug: `sti-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2004 },
  })
  const createData = await createRes.json()
  expect(createRes.status(), JSON.stringify(createData.errors ?? createData)).toBe(201)

  // Try to publish — blocked by beforeChange hook (no heroImage)
  const updateRes = await page.request.patch(`/api/vehicles/${createData.doc.id}`, {
    data: { status: 'available' },
  })
  // Hook throws → Payload returns 500 (generic server error for hook exceptions)
  expect(updateRes.status()).toBe(500)
})

// ── Inquiries ──────────────────────────────────────────────────────────────

test('Inquiries inbox loads', async ({ page }) => {
  await page.goto('/admin/collections/inquiries')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Inquiries/)
})

test('public inquiry API submission appears in admin inbox', async ({ page }) => {
  const makeId = await createMake(page, 'Mitsubishi', `mits-${Date.now()}`)
  const modelId = await createModel(page, 'Lancer', `lancer-${Date.now()}`, makeId)
  const vehicleRes = await page.request.post('/api/vehicles', {
    data: { title: 'Lancer Evo E2E', slug: `evo-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2005 },
  })
  const vehicleData = await vehicleRes.json()
  expect(vehicleRes.status(), JSON.stringify(vehicleData.errors ?? vehicleData)).toBe(201)

  // Submit inquiry as unauthenticated public user
  const publicCtx = await page.context().browser()!.newContext()
  const publicPage = await publicCtx.newPage()
  const inquiryRes = await publicPage.request.post('http://localhost:3000/api/inquiries', {
    data: {
      vehicle: vehicleData.doc.id,
      name: 'E2E Test Buyer',
      email: `buyer-${Date.now()}@test.com`,
      message: 'Is this available for export?',
      locale: 'en',
    },
  })
  expect(inquiryRes.status()).toBe(201)
  await publicCtx.close()

  // Verify it appears in admin inbox
  await page.goto('/admin/collections/inquiries')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('E2E Test Buyer').first()).toBeVisible()
})

// ── Globals ────────────────────────────────────────────────────────────────

test('Site Settings loads with expected fields', async ({ page }) => {
  await page.goto('/admin/globals/site-settings')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Site Settings/)
  await expect(page.getByLabel(/shop name/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel(/contact email/i)).toBeVisible()
  await expect(page.getByLabel(/show sold vehicles/i)).toBeVisible()
})

test('Homepage global loads with expected fields', async ({ page }) => {
  await page.goto('/admin/globals/homepage')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Homepage/)
  await expect(page.getByLabel(/hero heading/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel(/hero subheading/i)).toBeVisible()
})

// ── Media ──────────────────────────────────────────────────────────────────

test('Media library loads', async ({ page }) => {
  await page.goto('/admin/collections/media')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Media/)
  await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
})
