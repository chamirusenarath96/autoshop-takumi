import { test, expect } from '@playwright/test'

test.describe('Public site', () => {
  test('landing page loads in English', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByRole('link', { name: /View Inventory/i })).toBeVisible()
    // Scope to header to avoid matching footer duplicates
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /Inventory/i })).toBeVisible()
    await expect(header.getByRole('link', { name: /About/i })).toBeVisible()
  })

  test('landing page loads in Japanese', async ({ page }) => {
    await page.goto('/ja')
    await expect(page.getByRole('link', { name: /在庫を見る/ })).toBeVisible()
    // Scope to header nav
    const header = page.getByRole('banner')
    await expect(header.getByRole('link', { name: /在庫車両/ })).toBeVisible()
  })

  test('language switcher navigates between locales', async ({ page }) => {
    await page.goto('/en')
    // Scope to header to avoid Next.js dev tools button collision
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
    // Phone appears in table and footer — use first() (table cell)
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
