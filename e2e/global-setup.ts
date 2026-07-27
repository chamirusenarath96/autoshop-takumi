import { request, chromium } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_STATE_PATH } from './helpers'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), 'e2e', '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  const apiCtx = await request.newContext({ baseURL: BASE_URL, timeout: 60_000 })

  // Try login first (works on existing DB)
  const loginRes = await apiCtx.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })

  if (!loginRes.ok()) {
    // Fresh DB — create the first user via the browser UI (there's no REST
    // equivalent of the create-first-user flow), then log back in below via
    // the same request-context POST already proven to work above. Reading
    // storageState off of a *browser* context and replaying it in a request
    // context worked inconsistently in practice, so we don't rely on that.
    await apiCtx.dispose()

    console.log('Fresh DB — creating first admin user via browser...')
    const browser = await chromium.launch()
    try {
      const bCtx = await browser.newContext({ baseURL: BASE_URL })
      const page = await bCtx.newPage()

      await page.goto('/admin/create-first-user', { waitUntil: 'networkidle', timeout: 60_000 })
      await page.waitForSelector('input[name="password"]', { timeout: 15_000 })

      // Type into each field (triggers React synthetic events properly)
      await page.locator('#field-email').fill(ADMIN_EMAIL)
      await page.locator('#field-password').fill(ADMIN_PASSWORD)
      await page.locator('#field-confirm-password').fill(ADMIN_PASSWORD)
      await page.locator('#field-name').fill('Admin')
      await page.waitForTimeout(500)

      await page.getByRole('button', { name: /create/i }).click()
      await page.waitForURL('**/admin', { timeout: 30_000 })
      console.log('✓ First user created — now on admin dashboard')
      await bCtx.close()
    } finally {
      await browser.close()
    }

    return globalSetup()
  }

  await apiCtx.storageState({ path: AUTH_STATE_PATH })

  const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf8'))
  console.log(`✓ Auth state saved (${saved.cookies?.length ?? 0} cookie(s))`)

  // Seed SiteSettings once so pages that now source contact info / social
  // links from the CMS (Header, Footer, About) have something to render.
  const seedRes = await apiCtx.post('/api/globals/site-settings', {
    data: {
      shopName: 'Autoshop Takumi',
      contactEmail: 'takumitradings@gmail.com',
      contactPhone: '022-342-2285',
      address: '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013, Japan',
      socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/autoshop_takumi/' }],
    },
  })
  await apiCtx.dispose()

  if (!seedRes.ok()) {
    throw new Error(`Site settings seed failed (${seedRes.status()}): ${await seedRes.text()}`)
  }
  console.log('✓ Site settings seeded')
}
