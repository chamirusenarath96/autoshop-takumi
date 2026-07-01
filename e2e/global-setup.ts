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
  let loginRes = await apiCtx.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })

  if (loginRes.ok()) {
    // Already have a user — save the API context cookies
    await apiCtx.storageState({ path: AUTH_STATE_PATH })
    await apiCtx.dispose()
  } else {
    // Fresh DB — create first user via browser UI
    // Payload auto-logs in on first-user creation, so we grab cookies from the browser
    await apiCtx.dispose()

    console.log('Fresh DB — creating first admin user via browser...')
    const browser = await chromium.launch()
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

    // Payload auto-logs in after first-user creation — grab those cookies
    await bCtx.storageState({ path: AUTH_STATE_PATH })
    await bCtx.close()
    await browser.close()
  }

  const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf8'))
  console.log(`✓ Auth state saved (${saved.cookies?.length ?? 0} cookie(s))`)
}
