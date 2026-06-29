import { Page, Browser, expect } from '@playwright/test'

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
  const res = await page.request.post('/api/makes', { data: { name, slug } })
  const data = await res.json()
  return data.doc.id
}

/** Create a Model via REST API (authenticated). Returns the created ID. */
export async function createModel(page: Page, name: string, slug: string, makeId: number): Promise<number> {
  const res = await page.request.post('/api/models', { data: { name, slug, make: makeId } })
  const data = await res.json()
  return data.doc.id
}
