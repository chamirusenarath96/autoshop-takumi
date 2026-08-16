/**
 * REST API e2e tests — pure HTTP, no browser UI.
 * Uses page.request (shares the auth cookie) for admin calls,
 * and playwright.request.newContext() for unauthenticated calls.
 */
import { test, expect } from '@playwright/test'
import { AUTH_STATE_PATH, ADMIN_EMAIL, ADMIN_PASSWORD, createMake, createModel } from './helpers'

test.use({ storageState: AUTH_STATE_PATH })

// ── Auth ───────────────────────────────────────────────────────────────────

test.describe('Auth API', () => {
  test('POST /api/users/login — valid credentials return token + user', async ({ playwright, baseURL }) => {
    const ctx = await playwright.request.newContext({ baseURL })
    const res = await ctx.post('/api/users/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('token')
    expect(body.user.email).toBe(ADMIN_EMAIL)
    await ctx.dispose()
  })

  test('POST /api/users/login — wrong password returns 401', async ({ playwright, baseURL }) => {
    const ctx = await playwright.request.newContext({ baseURL })
    const res = await ctx.post('/api/users/login', {
      data: { email: ADMIN_EMAIL, password: 'wrong-password' },
    })
    expect(res.status()).toBe(401)
    await ctx.dispose()
  })

  test('GET /api/users/me — returns current user when authenticated', async ({ page }) => {
    const res = await page.request.get('/api/users/me')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe(ADMIN_EMAIL)
  })

  test('GET /api/users/me — returns no user when unauthenticated', async ({ baseURL }) => {
    // Plain Node fetch — not a Playwright request/browser context, so there's
    // no admin session cookie to inherit (playwright.request.newContext()
    // was tried here first, but it round-tripped the authenticated session
    // regardless of options, which isn't true unauthenticated isolation).
    const res = await fetch(`${baseURL}/api/users/me`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toBeFalsy()
  })
})

// ── Makes ──────────────────────────────────────────────────────────────────

test.describe('Makes API', () => {
  test('POST /api/makes — creates a make', async ({ page }) => {
    const res = await page.request.post('/api/makes', {
      data: { name: 'Toyota API Test', slug: `toyota-api-${Date.now()}` },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.doc.name).toBe('Toyota API Test')
    expect(body.doc.id).toBeDefined()
  })

  test('GET /api/makes — returns paginated list', async ({ page }) => {
    const res = await page.request.get('/api/makes')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('docs')
    expect(body).toHaveProperty('totalDocs')
    expect(Array.isArray(body.docs)).toBe(true)
  })

  test('PATCH /api/makes/:id — updates a make', async ({ page }) => {
    const id = await createMake(page, 'Honda Patch', `honda-patch-${Date.now()}`)
    const res = await page.request.patch(`/api/makes/${id}`, {
      data: { name: 'Honda Updated' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.doc.name).toBe('Honda Updated')
  })

  test('DELETE /api/makes/:id — deletes a make', async ({ page }) => {
    const id = await createMake(page, 'Delete Me', `delete-me-${Date.now()}`)
    const delRes = await page.request.delete(`/api/makes/${id}`)
    expect(delRes.status()).toBe(200)

    const getRes = await page.request.get(`/api/makes/${id}`)
    expect(getRes.status()).toBe(404)
  })

  test('POST /api/makes — rejects missing slug (required field)', async ({ page }) => {
    const res = await page.request.post('/api/makes', {
      data: { name: 'No Slug Make' },
    })
    expect(res.status()).toBe(400)
  })

  test('GET /api/makes?limit=2 — respects pagination limit', async ({ page }) => {
    const res = await page.request.get('/api/makes?limit=2')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs.length).toBeLessThanOrEqual(2)
    expect(body).toHaveProperty('hasNextPage')
    expect(body).toHaveProperty('nextPage')
  })
})

// ── Models ─────────────────────────────────────────────────────────────────

test.describe('Models API', () => {
  test('POST /api/models — creates a model linked to a make', async ({ page }) => {
    const makeId = await createMake(page, 'Suzuki API', `suzuki-api-${Date.now()}`)
    const res = await page.request.post('/api/models', {
      data: { name: 'Swift', slug: `swift-${Date.now()}`, make: makeId },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.doc.name).toBe('Swift')
    // make may be returned as ID or object depending on depth
    expect(body.doc.make === makeId || body.doc.make?.id === makeId).toBe(true)
  })

  test('GET /api/models?where[make][equals]=:id — filters by make', async ({ page }) => {
    const makeId = await createMake(page, 'Daihatsu Filter', `daihatsu-filter-${Date.now()}`)
    await page.request.post('/api/models', {
      data: { name: 'Copen', slug: `copen-filter-${Date.now()}`, make: makeId },
    })
    const res = await page.request.get(`/api/models?where[make][equals]=${makeId}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs.length).toBeGreaterThan(0)
    expect(body.docs.every((m: any) => m.make === makeId || m.make?.id === makeId)).toBe(true)
  })
})

// ── Vehicles ───────────────────────────────────────────────────────────────

test.describe('Vehicles API', () => {
  test('POST /api/vehicles — creates a draft vehicle', async ({ page }) => {
    const makeId = await createMake(page, 'Lexus API', `lexus-api-${Date.now()}`)
    const modelId = await createModel(page, 'IS300', `is300-${Date.now()}`, makeId)
    const res = await page.request.post('/api/vehicles', {
      data: {
        titleJa: '2003年式 レクサス IS300',
        titleEn: '2003 Lexus IS300',
        slug: `lexus-is300-${Date.now()}`,
        status: 'draft',
        make: makeId,
        model: modelId,
        year: 2003,
        priceJpy: 1800000,
        mileageKm: 95000,
        transmission: 'MT',
        bodyType: 'sedan',
      },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.doc.titleEn).toBe('2003 Lexus IS300')
    expect(body.doc.status).toBe('draft')
    expect(body.doc.year).toBe(2003)
    expect(body.doc.priceJpy).toBe(1800000)
  })

  test('GET /api/vehicles — access control: admin sees drafts, public query filters to published only', async ({ page, baseURL }) => {
    const makeId = await createMake(page, 'AC Test Make', `actm-${Date.now()}`)
    const modelId = await createModel(page, 'AC Model', `acm-${Date.now()}`, makeId)
    const slug = `ac-draft-${Date.now()}`
    await page.request.post('/api/vehicles', {
      data: { titleEn: 'AC Draft', slug, status: 'draft', make: makeId, model: modelId, year: 2020 },
    })

    // Admin (authenticated) can see the draft
    const adminRes = await page.request.get(`/api/vehicles?where[slug][equals]=${slug}`)
    const adminBody = await adminRes.json()
    expect(adminBody.docs).toHaveLength(1)
    expect(adminBody.docs[0].status).toBe('draft')

    // Anonymous visitor — plain fetch, no Playwright request context involved,
    // so there's no admin session cookie to inherit.
    const publicRes = await fetch(`${baseURL}/api/vehicles?where[slug][equals]=${slug}`)
    expect(publicRes.status).toBe(200)
    const publicBody = await publicRes.json()
    expect(publicBody.docs).toHaveLength(0)
  })

  test('GET /api/vehicles — admin can see draft vehicles', async ({ page }) => {
    const makeId = await createMake(page, 'Admin See', `adminsee-${Date.now()}`)
    const modelId = await createModel(page, 'Admin Model', `adminm-${Date.now()}`, makeId)
    const slug = `admin-draft-${Date.now()}`
    await page.request.post('/api/vehicles', {
      data: { titleEn: 'Admin Draft Vehicle', slug, status: 'draft', make: makeId, model: modelId, year: 2021 },
    })

    const res = await page.request.get(`/api/vehicles?where[slug][equals]=${slug}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.docs).toHaveLength(1)
    expect(body.docs[0].status).toBe('draft')
  })

  test('PATCH /api/vehicles/:id — blocks setting status:available without heroImage', async ({ page }) => {
    const makeId = await createMake(page, 'Block Test', `block-${Date.now()}`)
    const modelId = await createModel(page, 'Block Model', `bm-${Date.now()}`, makeId)
    const createRes = await page.request.post('/api/vehicles', {
      data: { titleEn: 'Block Test Car', slug: `block-car-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2010 },
    })
    const { doc } = await createRes.json()

    const patchRes = await page.request.patch(`/api/vehicles/${doc.id}`, {
      data: { status: 'available' },
    })
    expect(patchRes.status()).toBe(500) // beforeChange hook throws
  })

  test('GET /api/vehicles?locale=en — returns 200 with docs array', async ({ page }) => {
    const res = await page.request.get('/api/vehicles?locale=en&limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('docs')
    expect(Array.isArray(body.docs)).toBe(true)
  })

  test('GET /api/vehicles?sort=-createdAt — returns newest first', async ({ page }) => {
    const res = await page.request.get('/api/vehicles?sort=-createdAt&limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    const dates = body.docs.map((d: any) => new Date(d.createdAt).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
    }
  })
})

// ── Inquiries ──────────────────────────────────────────────────────────────

test.describe('Inquiries API', () => {
  test('POST /api/inquiries — public user can create inquiry', async ({ page, playwright, baseURL }) => {
    const makeId = await createMake(page, 'Inq Make', `inq-make-${Date.now()}`)
    const modelId = await createModel(page, 'Inq Model', `inq-mod-${Date.now()}`, makeId)
    const vRes = await page.request.post('/api/vehicles', {
      data: { titleEn: 'Inq Vehicle', slug: `inq-v-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2018 },
    })
    const { doc: vehicle } = await vRes.json()

    const publicCtx = await playwright.request.newContext({ baseURL })
    const res = await publicCtx.post('/api/inquiries', {
      data: { vehicle: vehicle.id, name: 'API Buyer', email: `api-${Date.now()}@test.com`, message: 'Interested.', locale: 'en' },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.doc.name).toBe('API Buyer')
    expect(body.doc.status).toBe('new')
    await publicCtx.dispose()
  })

  test('POST /api/inquiries — rejects missing required fields', async ({ playwright, baseURL }) => {
    const publicCtx = await playwright.request.newContext({ baseURL })
    const res = await publicCtx.post('/api/inquiries', {
      data: { name: 'Incomplete' }, // missing vehicle, email, message
    })
    expect(res.status()).toBe(400)
    await publicCtx.dispose()
  })

  test('GET /api/inquiries — admin can list inquiries', async ({ page }) => {
    const res = await page.request.get('/api/inquiries?limit=5')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('docs')
    expect(body).toHaveProperty('totalDocs')
  })

  test('GET /api/inquiries — admin can list, unauthenticated is blocked', async ({ page, baseURL }) => {
    const res = await page.request.get('/api/inquiries')
    expect(res.status()).toBe(200)

    // read access control is ({ req }) => !!req.user — a boolean `false` for an
    // anonymous request, which Payload rejects outright rather than filtering.
    // Plain fetch, not a Playwright request context, so no session cookie leaks in.
    const publicRes = await fetch(`${baseURL}/api/inquiries`)
    expect(publicRes.status).toBe(403)
  })

  test('PATCH /api/inquiries/:id — admin can update status to contacted', async ({ page, playwright, baseURL }) => {
    const makeId = await createMake(page, 'Status Make', `stmk-${Date.now()}`)
    const modelId = await createModel(page, 'Status Mod', `stmd-${Date.now()}`, makeId)
    const vRes = await page.request.post('/api/vehicles', {
      data: { titleEn: 'Status Car', slug: `stcar-${Date.now()}`, status: 'draft', make: makeId, model: modelId, year: 2015 },
    })
    const { doc: vehicle } = await vRes.json()

    const publicCtx = await playwright.request.newContext({ baseURL })
    const iRes = await publicCtx.post('/api/inquiries', {
      data: { vehicle: vehicle.id, name: 'Status Buyer', email: `st-${Date.now()}@test.com`, message: 'test', locale: 'en' },
    })
    const { doc: inquiry } = await iRes.json()
    await publicCtx.dispose()

    const patchRes = await page.request.patch(`/api/inquiries/${inquiry.id}`, {
      data: { status: 'contacted' },
    })
    expect(patchRes.status()).toBe(200)
    const patchBody = await patchRes.json()
    expect(patchBody.doc.status).toBe('contacted')
  })
})

// ── Globals ────────────────────────────────────────────────────────────────

test.describe('Globals API', () => {
  test('GET /api/globals/site-settings — admin can read config', async ({ page }) => {
    const res = await page.request.get('/api/globals/site-settings')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('showSoldVehicles')
  })

  test('GET /api/globals/site-settings — unauthenticated requests are rejected', async ({ baseURL }) => {
    // SiteSettings has no `access` block, so it falls back to Payload's
    // default (Boolean(user)) — auth required for every operation. The
    // public site never hits this REST endpoint directly: Header/Footer/About
    // read it server-side via the Local API, which defaults to
    // overrideAccess: true and bypasses this check entirely.
    // Plain fetch — not a Playwright request context — so there's no
    // session cookie to (incorrectly) inherit.
    const res = await fetch(`${baseURL}/api/globals/site-settings`)
    expect(res.status).toBe(403)
  })

  test('POST /api/globals/site-settings — admin can update shop name', async ({ page }) => {
    // SiteSettings is a shared global that other tests (and the public site
    // itself, via global-setup's seed) depend on — restore it afterward so
    // this test doesn't leak state into whatever runs next.
    const before = await page.request.get('/api/globals/site-settings')
    const originalShopName = (await before.json()).shopName

    try {
      const res = await page.request.post('/api/globals/site-settings', {
        data: { shopName: 'Autoshop Takumi E2E Test' },
      })
      expect(res.status()).toBe(200)
      // Payload globals return { message, result } not { doc }
      const body = await res.json()
      expect(body.result?.shopName ?? body.shopName).toBe('Autoshop Takumi E2E Test')
    } finally {
      await page.request.post('/api/globals/site-settings', {
        data: { shopName: originalShopName },
      })
    }
  })

  test('GET /api/globals/homepage — returns homepage config', async ({ page }) => {
    const res = await page.request.get('/api/globals/homepage')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toBeDefined()
  })
})

// ── Media ──────────────────────────────────────────────────────────────────

test.describe('Media API', () => {
  test('GET /api/media — returns media list', async ({ page }) => {
    const res = await page.request.get('/api/media')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('docs')
    expect(Array.isArray(body.docs)).toBe(true)
  })

  test('GET /api/media — unauthenticated requests are rejected', async ({ baseURL }) => {
    // Media has no `access` block either, so it's also auth-required by
    // Payload's default. Vehicle photos still render publicly because the
    // <img> src is the direct static file URL under /media, not a call to
    // this REST endpoint.
    const res = await fetch(`${baseURL}/api/media`)
    expect(res.status).toBe(403)
  })
})
