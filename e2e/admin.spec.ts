import { test, expect } from '@playwright/test'
import { createMake, createModel, uploadMedia, ADMIN_EMAIL, AUTH_STATE_PATH } from './helpers'

test.use({ storageState: AUTH_STATE_PATH })

// ── Auth ───────────────────────────────────────────────────────────────────

test('admin dashboard loads with sidebar navigation', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')
  // exact: true — the dashboard also renders a "Create new X" / "Show all X"
  // card per collection, whose accessible names otherwise substring-match too
  await expect(page.getByRole('link', { name: 'Vehicles', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Makes', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Inquiries', exact: true })).toBeVisible()
})

test('account page is accessible when logged in', async ({ page }) => {
  await page.goto('/admin/account')
  await page.waitForLoadState('networkidle')
  // Confirm we're authenticated — not redirected to login
  await expect(page).toHaveURL(/\/admin\/account/)
  await expect(page).not.toHaveURL(/login/)
})

// ── Styling ──────────────────────────────────────────────────────────────
// Guards against regressing the @payloadcms/next/css import in
// (payload)/layout.tsx (see CLAUDE.md "Styling architecture" for why it's
// needed: RootLayout's internal app.scss compilation is broken in this
// project's build, so we import Payload's official prebuilt CSS instead).

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

test('admin nav sidebar renders with Payload\'s real layout CSS (not just variables)', async ({ page }) => {
  // .nav__wrap's width comes from Payload's view-level CSS (--nav-width var
  // consumed inside an actual layout rule, not just the variable itself) —
  // this class of bug (missing component CSS, not just root variables) is
  // what @payloadcms/next/css fixes. Note: this specifically does NOT test
  // /admin/login with a fresh unauthenticated context, because
  // browser.newContext() in this Playwright/environment combo inherits the
  // session from storageState-using tests run earlier in the same process
  // (verified manually in a real separate browser tab — /admin/login's
  // .template-minimal__wrap correctly computes maxWidth: 480px there).
  await page.goto('/admin')
  await page.waitForLoadState('networkidle')

  const navWrap = page.locator('.nav__wrap')
  await expect(navWrap).toBeVisible()
  const width = await navWrap.evaluate((el) => getComputedStyle(el).width)
  expect(width).not.toBe('0px')
  expect(width).not.toBe('auto')
})

test('admin styling does not leak from / into the public site', async ({ page }) => {
  // Public site should NOT have Payload's --theme-* variables defined
  // (completely separate stylesheets — see CLAUDE.md "Styling architecture").
  await page.goto('/en')
  await page.waitForLoadState('networkidle')
  const hasPayloadVar = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--style-radius-s').trim(),
  )
  expect(hasPayloadVar).toBe('') // @payloadcms/next/css must not be loaded on the public site

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

  await page.getByLabel('Name (Japanese)').fill('ニッサン')
  await page.getByLabel('Name (English)').fill('Nissan')
  await page.getByLabel('Slug').fill(`nissan-e2e-${Date.now()}`)
  await page.getByRole('button', { name: /save/i }).click()

  await expect(page).toHaveURL(/\/admin\/collections\/makes\/\d+/)
  await expect(page.getByLabel('Name (Japanese)')).toHaveValue('ニッサン')
  await expect(page.getByLabel('Name (English)')).toHaveValue('Nissan')
})

test('Make/Model paired-language fields render together in one form, with no locale-switcher interaction required (spec 003, US1 Scenario 1)', async ({ page }) => {
  // Regression guard for specs/003-remove-payload-localization: both languages must be visible
  // and independently editable in a single form render, without ever touching the admin-wide
  // locale switcher (still present in the nav — Payload's `localization` config isn't removed
  // until Phase 5/#20, gated on issue #19's Vehicles migration and the Vehicles.gallery[].caption
  // scope gap — see this feature's tasks.md T029).
  await page.goto('/admin/collections/makes/create')
  await page.waitForLoadState('networkidle')
  await expect(page.getByLabel('Name (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Name (English)')).toBeVisible()

  await page.goto('/admin/collections/models/create')
  await page.waitForLoadState('networkidle')
  await expect(page.getByLabel('Name (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Name (English)')).toBeVisible()
})

test('a Model saves successfully with only the Japanese name filled in (spec 003, US1 Scenario 2)', async ({ page }) => {
  const makeName = `Mazda E2E ${Date.now()}`
  await createMake(page, makeName, `mazda-e2e-${Date.now()}`)

  await page.goto('/admin/collections/models/create')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Name (Japanese)').fill('ロードスター')
  await page.getByLabel('Slug').fill(`roadster-e2e-${Date.now()}`)
  // Payload's relationship field is a react-select combobox, not a native <select> — it has no
  // accessible <label>, so target its combobox role instead of getByLabel. The visible
  // "Select a value" placeholder text sits behind an overlapping input-container div that
  // intercepts pointer events, so click the combobox itself rather than the placeholder text.
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: makeName }).click()
  await page.getByRole('button', { name: /save/i }).click()

  await expect(page).toHaveURL(/\/admin\/collections\/models\/\d+/)
  await expect(page.getByLabel('Name (Japanese)')).toHaveValue('ロードスター')
})

test('rejects a Make with both Name (Japanese) and Name (English) left blank, per spec FR-013', async ({ page }) => {
  await page.goto('/admin/collections/makes/create')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Slug').fill(`blank-name-e2e-${Date.now()}`)
  await page.getByRole('button', { name: /save/i }).click()

  // Save is rejected — still on the create form, not redirected to the new doc's edit URL.
  await expect(page).not.toHaveURL(/\/admin\/collections\/makes\/\d+/)
  await expect(page.getByText(/at least one of name \(japanese\) or name \(english\)/i)).toBeVisible()
})

test('rejects a Model with both Name (Japanese) and Name (English) left blank, per spec FR-013', async ({ page }) => {
  const makeName = `Subaru E2E ${Date.now()}`
  await createMake(page, makeName, `subaru-e2e-${Date.now()}`)

  await page.goto('/admin/collections/models/create')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Slug').fill(`blank-model-name-e2e-${Date.now()}`)
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: makeName }).click()
  await page.getByRole('button', { name: /save/i }).click()

  // Save is rejected — still on the create form, not redirected to the new doc's edit URL.
  await expect(page).not.toHaveURL(/\/admin\/collections\/models\/\d+/)
  await expect(page.getByText(/at least one of name \(japanese\) or name \(english\)/i)).toBeVisible()
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

test('Vehicles list view renders a real title via displayTitle after the legacy title/price fields were removed', async ({ page }) => {
  const makeId = await createMake(page, 'List View', `lv-${Date.now()}`)
  const modelId = await createModel(page, 'List Model', `lvm-${Date.now()}`, makeId)
  const titleText = `List View Vehicle ${Date.now()}`

  const res = await page.request.post('/api/vehicles', {
    data: { titleEn: titleText, slug: `list-view-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2015 },
  })
  const { doc } = await res.json()
  expect(doc.displayTitle).toBe(titleText)

  await page.goto('/admin/collections/vehicles')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(titleText)).toBeVisible()
})

test('vehicle create form shows all key fields', async ({ page }) => {
  await page.goto('/admin/collections/vehicles/create')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Creating.*Vehicle/)

  await expect(page.getByLabel('Title (Japanese)', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Slug*')).toBeVisible()
  await expect(page.getByLabel('Year*')).toBeVisible()
  // Use number input specifically to avoid the checkbox collision
  await expect(page.getByRole('spinbutton', { name: 'Price (JPY)' })).toBeVisible()
  await expect(page.getByLabel('Mileage (km)')).toBeVisible()
})

test('vehicle create form shows both Japanese and English inputs for every paired content field, with no locale switch needed', async ({ page }) => {
  await page.goto('/admin/collections/vehicles/create')
  await page.waitForLoadState('networkidle')

  for (const [ja, en] of [
    ['Title (Japanese)', 'Title (English)'],
    ['Exterior Color (Japanese)', 'Exterior Color (English)'],
    ['Summary (Japanese)', 'Summary (English)'],
    ['SEO Title (Japanese)', 'SEO Title (English)'],
    ['SEO Description (Japanese)', 'SEO Description (English)'],
  ]) {
    await expect(page.getByLabel(ja, { exact: true })).toBeVisible()
    await expect(page.getByLabel(en, { exact: true })).toBeVisible()
  }

  // Description (Japanese)/(English) are richText editors, not plain labeled inputs —
  // assert by their rendered field-label text instead of getByLabel.
  await expect(page.getByText('Description (Japanese)', { exact: true })).toBeVisible()
  await expect(page.getByText('Description (English)', { exact: true })).toBeVisible()

  // Add a highlight row and a spec row — each should expose both-language inputs too.
  await page.getByRole('button', { name: /add highlight/i }).click()
  await expect(page.getByLabel('Text (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Text (English)')).toBeVisible()

  await page.getByRole('button', { name: /^add spec$/i }).click()
  await expect(page.getByLabel('Label (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Label (English)')).toBeVisible()
  await expect(page.getByLabel('Value (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Value (English)')).toBeVisible()
})

test('can save a vehicle with only the Japanese half of every pair filled in, as a draft', async ({ page }) => {
  const makeId = await createMake(page, 'US1 Draft', `us1-${Date.now()}`)
  const modelId = await createModel(page, 'US1 Model', `us1m-${Date.now()}`, makeId)

  const res = await page.request.post('/api/vehicles', {
    data: {
      titleJa: '日本語のみタイトル',
      exteriorColorJa: '青',
      summaryJa: '日本語の概要',
      seoTitleJa: '日本語のSEOタイトル',
      seoDescriptionJa: '日本語のSEO概要',
      slug: `ja-only-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 2017,
      highlights: [{ textJa: '一番目のポイント' }],
      specs: [{ labelJa: 'エンジン', valueJa: '直6' }],
    },
  })
  const data = await res.json()
  expect(res.status(), `Vehicle create failed: ${JSON.stringify(data.errors ?? data)}`).toBe(201)
  expect(data.doc.status).toBe('draft')
  expect(data.doc.titleJa).toBe('日本語のみタイトル')
  expect(data.doc.titleEn).toBeFalsy()
})

test('can save a vehicle with only priceJpy set, with no priceUsd required or auto-populated', async ({ page }) => {
  const makeId = await createMake(page, 'US2 Price', `us2-${Date.now()}`)
  const modelId = await createModel(page, 'US2 Model', `us2m-${Date.now()}`, makeId)

  const res = await page.request.post('/api/vehicles', {
    data: {
      titleJa: 'JPY価格のみテスト',
      slug: `jpy-only-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 2018,
      priceJpy: 4500000,
    },
  })
  const data = await res.json()
  expect(res.status(), `Vehicle create failed: ${JSON.stringify(data.errors ?? data)}`).toBe(201)
  expect(data.doc.priceJpy).toBe(4500000)
  expect(data.doc.priceUsd).toBeFalsy()
})

test('can create a draft vehicle via API', async ({ page }) => {
  const makeId = await createMake(page, 'Mazda', `mazda-${Date.now()}`)
  const modelId = await createModel(page, 'RX-7', `rx7-${Date.now()}`, makeId)

  const res = await page.request.post('/api/vehicles', {
    data: {
      titleEn: '1995 Mazda RX-7 FD3S',
      slug: `rx7-e2e-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 1995,
      priceJpy: 4500000,
    },
  })
  const data = await res.json()
  expect(res.status(), `Vehicle create failed: ${JSON.stringify(data.errors ?? data)}`).toBe(201)
  expect(data.doc.status).toBe('draft')
  expect(data.doc.titleEn).toBe('1995 Mazda RX-7 FD3S')
})

test('blocks publishing a vehicle without a hero image', async ({ page }) => {
  const makeId = await createMake(page, 'Subaru', `subaru-${Date.now()}`)
  const modelId = await createModel(page, 'Impreza', `impreza-${Date.now()}`, makeId)

  const createRes = await page.request.post('/api/vehicles', {
    data: { titleEn: 'Test STI', slug: `sti-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2004 },
  })
  const createData = await createRes.json()
  expect(createRes.status(), JSON.stringify(createData.errors ?? createData)).toBe(201)

  // Try to publish — blocked by beforeChange hook (no heroImage)
  const updateRes = await page.request.patch(`/api/vehicles/${createData.doc.id}`, {
    data: { status: 'available' },
  })
  // Hook throws → Payload returns 500 (generic server error for hook exceptions)
  expect(updateRes.status()).toBe(500)

  // A generic 500 alone doesn't prove the hero-image check specifically fired —
  // confirm the update was actually rejected and the vehicle is still a draft.
  const verifyRes = await page.request.get(`/api/vehicles/${createData.doc.id}`)
  const verifyData = await verifyRes.json()
  expect(verifyData.status).toBe('draft')
})

test('blocks publishing a vehicle with a hero image but no title/price in either language', async ({ page }) => {
  const makeId = await createMake(page, 'Publish Gate', `pg-${Date.now()}`)
  const modelId = await createModel(page, 'Gate Model', `pgm-${Date.now()}`, makeId)
  const mediaId = await uploadMedia(page)

  const createRes = await page.request.post('/api/vehicles', {
    data: { slug: `gate-notitle-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2012, heroImage: mediaId },
  })
  const { doc } = await createRes.json()

  const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, { data: { status: 'available' } })
  expect(patchRes.status()).toBe(500)

  const verifyRes = await page.request.get(`/api/vehicles/${doc.id}`)
  expect((await verifyRes.json()).status).toBe('draft')
})

test('allows publishing with only one language title and priceOnRequest set, no price fields', async ({ page }) => {
  const makeId = await createMake(page, 'Gate Pass', `gp-${Date.now()}`)
  const modelId = await createModel(page, 'Pass Model', `gpm-${Date.now()}`, makeId)
  const mediaId = await uploadMedia(page)

  const createRes = await page.request.post('/api/vehicles', {
    data: {
      titleJa: 'ゲート合格テスト',
      slug: `gate-pass-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 2013,
      heroImage: mediaId,
      priceOnRequest: true,
    },
  })
  const { doc } = await createRes.json()

  const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, { data: { status: 'available' } })
  expect(patchRes.status(), JSON.stringify(await patchRes.json())).toBe(200)
})

test('publish gate evaluates effective state — status-only PATCH succeeds when title/price were saved earlier', async ({ page }) => {
  const makeId = await createMake(page, 'Effective State', `es-${Date.now()}`)
  const modelId = await createModel(page, 'Effective Model', `esm-${Date.now()}`, makeId)
  const mediaId = await uploadMedia(page)

  // Title/price/heroImage set on create — a separate request from the publish attempt below.
  const createRes = await page.request.post('/api/vehicles', {
    data: {
      titleJa: '実効状態テスト',
      priceJpy: 0, // exactly 0 must count as present, not missing
      slug: `effective-state-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 2014,
      heroImage: mediaId,
    },
  })
  const { doc } = await createRes.json()

  // This request sends only the status change — no title/price fields — yet must succeed
  // because they're already persisted (effective-state merge, not just this request's body).
  const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, { data: { status: 'available' } })
  expect(patchRes.status(), JSON.stringify(await patchRes.json())).toBe(200)
})

test('publish gate still applies on a field-only PATCH to an already-available vehicle', async ({ page }) => {
  const makeId = await createMake(page, 'Field Only Gate', `fog-${Date.now()}`)
  const modelId = await createModel(page, 'Field Only Model', `fogm-${Date.now()}`, makeId)
  const mediaId = await uploadMedia(page)

  const createRes = await page.request.post('/api/vehicles', {
    data: {
      titleEn: 'Field Only Gate Test',
      priceJpy: 3000000,
      slug: `field-only-gate-${Date.now()}`,
      status: 'available',
      make: makeId,
      model: modelId,
      year: 2015,
      heroImage: mediaId,
    },
  })
  const { doc } = await createRes.json()
  expect(doc.status).toBe('available')

  // No status field in this request — status stays 'available' via originalDoc, so the gate
  // must still evaluate against the effective (post-merge) state and reject removing heroImage.
  const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, { data: { heroImage: null } })
  expect(patchRes.status()).toBe(500)

  const verifyRes = await page.request.get(`/api/vehicles/${doc.id}`)
  const verifyData = await verifyRes.json()
  expect(verifyData.status).toBe('available')
  expect(verifyData.heroImage).toBeTruthy()
})

test('publish gate treats a title string of "0" as present, not missing', async ({ page }) => {
  const makeId = await createMake(page, 'Zero Title', `zt-${Date.now()}`)
  const modelId = await createModel(page, 'Zero Model', `ztm-${Date.now()}`, makeId)
  const mediaId = await uploadMedia(page)

  const createRes = await page.request.post('/api/vehicles', {
    data: {
      titleEn: '0',
      priceOnRequest: true,
      slug: `zero-title-${Date.now()}`,
      status: 'draft',
      make: makeId,
      model: modelId,
      year: 2016,
      heroImage: mediaId,
    },
  })
  const { doc } = await createRes.json()

  const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, { data: { status: 'available' } })
  expect(patchRes.status(), JSON.stringify(await patchRes.json())).toBe(200)
})

// ── Inquiries ──────────────────────────────────────────────────────────────

test('Inquiries inbox loads', async ({ page }) => {
  await page.goto('/admin/collections/inquiries')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Inquiries/)
})

test('public inquiry API submission appears in admin inbox', async ({ page, baseURL }) => {
  const makeId = await createMake(page, 'Mitsubishi', `mits-${Date.now()}`)
  const modelId = await createModel(page, 'Lancer', `lancer-${Date.now()}`, makeId)
  const vehicleRes = await page.request.post('/api/vehicles', {
    data: { titleEn: 'Lancer Evo E2E', slug: `evo-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2005 },
  })
  const vehicleData = await vehicleRes.json()
  expect(vehicleRes.status(), JSON.stringify(vehicleData.errors ?? vehicleData)).toBe(201)

  // Submit inquiry as unauthenticated public user
  const publicCtx = await page.context().browser()!.newContext({ baseURL })
  try {
    const publicPage = await publicCtx.newPage()
    const inquiryRes = await publicPage.request.post('/api/inquiries', {
      data: {
        vehicle: vehicleData.doc.id,
        name: 'E2E Test Buyer',
        email: `buyer-${Date.now()}@test.com`,
        message: 'Is this available for export?',
        locale: 'en',
      },
    })
    expect(inquiryRes.status()).toBe(201)
  } finally {
    await publicCtx.close()
  }

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
  await expect(page.getByLabel('Shop Name (Japanese)')).toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel('Shop Name (English)')).toBeVisible()
  await expect(page.getByLabel(/contact email/i)).toBeVisible()
  await expect(page.getByLabel(/show sold vehicles/i)).toBeVisible()
})

test('Site Settings — Address, SEO Title, and SEO Description paired-language fields render together (spec 003, US1 Scenario 3)', async ({ page }) => {
  await page.goto('/admin/globals/site-settings')
  await page.waitForLoadState('networkidle')
  await expect(page.getByLabel('Address (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Address (English)')).toBeVisible()
  await expect(page.getByLabel('SEO Title (Japanese)')).toBeVisible()
  await expect(page.getByLabel('SEO Title (English)')).toBeVisible()
  await expect(page.getByLabel('SEO Description (Japanese)')).toBeVisible()
  await expect(page.getByLabel('SEO Description (English)')).toBeVisible()
})

test('rejects Site Settings with both Shop Name (Japanese) and Shop Name (English) left blank, per spec FR-013', async ({ page }) => {
  await page.goto('/admin/globals/site-settings')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('Shop Name (Japanese)').fill('')
  await page.getByLabel('Shop Name (English)').fill('')
  await page.getByRole('button', { name: /save/i }).click()
  await expect(page.getByText(/at least one of shop name \(japanese\) or shop name \(english\)/i)).toBeVisible()
})

test('Homepage global loads with expected fields', async ({ page }) => {
  await page.goto('/admin/globals/homepage')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Homepage/)
  await expect(page.getByLabel('Hero Heading (Japanese)')).toBeVisible({ timeout: 10000 })
  await expect(page.getByLabel('Hero Heading (English)')).toBeVisible()
  await expect(page.getByLabel('Hero Subheading (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Hero Subheading (English)')).toBeVisible()
})

test('Homepage — Why Us paired-language fields render together, with an at-least-one-language guard on Heading (spec 003, US1 Scenario 3 / FR-013)', async ({ page }) => {
  await page.goto('/admin/globals/homepage')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /add why us/i }).click()
  await expect(page.getByLabel('Heading (Japanese)').first()).toBeVisible()
  await expect(page.getByLabel('Heading (English)').first()).toBeVisible()
  await expect(page.getByLabel('Body (Japanese)').first()).toBeVisible()
  await expect(page.getByLabel('Body (English)').first()).toBeVisible()
})

test('rejects a Homepage Why Us item with both Heading (Japanese) and Heading (English) left blank, per spec FR-013', async ({ page }) => {
  await page.goto('/admin/globals/homepage')
  await page.waitForLoadState('networkidle')
  const rowCountBefore = await page.getByLabel('Body (Japanese)').count()
  await page.getByRole('button', { name: /add why us/i }).click()
  // The new row mounts asynchronously — without waiting for it, `.last()` can
  // resolve against the still-existing previous row before React finishes
  // adding the new one, filling the wrong item's Body field.
  await expect(page.getByLabel('Body (Japanese)')).toHaveCount(rowCountBefore + 1)
  await page.getByLabel('Body (Japanese)').last().fill('テスト本文')
  await page.getByRole('button', { name: /save/i }).click()
  await expect(page.getByText(/at least one of heading \(japanese\) or heading \(english\)/i)).toBeVisible()
})

// ── Media ──────────────────────────────────────────────────────────────────

test('Media library loads', async ({ page }) => {
  await page.goto('/admin/collections/media')
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveTitle(/Media/)
  await expect(page.getByRole('link', { name: /create new/i }).first()).toBeVisible()
})

test('Media create form shows Alt Text (Japanese)/(English) paired fields (spec 003, US1 Scenario 3)', async ({ page }) => {
  await page.goto('/admin/collections/media/create')
  await page.waitForLoadState('networkidle')
  await expect(page.getByLabel('Alt Text (Japanese)')).toBeVisible()
  await expect(page.getByLabel('Alt Text (English)')).toBeVisible()
})
