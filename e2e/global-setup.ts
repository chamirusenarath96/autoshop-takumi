import { request, chromium } from '@playwright/test'
import { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_STATE_PATH } from './helpers'
import fs from 'fs'
import path from 'path'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default async function globalSetup() {
  const authDir = path.join(process.cwd(), 'e2e', '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  // Use a persistent API context so cookies from Set-Cookie headers are stored
  const apiCtx = await request.newContext({ baseURL: BASE_URL })

  let loginRes = await apiCtx.post('/api/users/login', {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  })

  if (!loginRes.ok()) {
    // No user yet — create via UI
    console.log('Creating first admin user via UI...')
    const browser = await chromium.launch()
    const bCtx = await browser.newContext({ baseURL: BASE_URL })
    const page = await bCtx.newPage()
    await page.goto('/admin/create-first-user')
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Email').fill(ADMIN_EMAIL)
    await page.getByLabel('New Password').fill(ADMIN_PASSWORD)
    await page.getByLabel('Confirm Password').fill(ADMIN_PASSWORD)
    await page.getByLabel('Name').fill('Admin')
    await page.getByRole('button', { name: /create/i }).click()
    await page.waitForURL('**/admin**')
    await bCtx.close()
    await browser.close()

    loginRes = await apiCtx.post('/api/users/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
  }

  if (!loginRes.ok()) {
    throw new Error(`Login failed: ${loginRes.status()} ${await loginRes.text()}`)
  }

  // Save the full context storage (includes cookies set by Set-Cookie headers)
  await apiCtx.storageState({ path: AUTH_STATE_PATH })
  await apiCtx.dispose()

  // Verify the file has cookies
  const saved = JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf8'))
  const cookieCount = saved.cookies?.length ?? 0
  console.log(`✓ Auth state saved (${cookieCount} cookie${cookieCount !== 1 ? 's' : ''})`)
  if (cookieCount === 0) {
    console.warn('⚠ Warning: no cookies saved — Payload may use a different auth mechanism')
  }
}
