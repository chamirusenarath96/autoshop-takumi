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

  if (!seedRes.ok()) {
    const body = await seedRes.text()
    await apiCtx.dispose()
    throw new Error(`Site settings seed failed (${seedRes.status()}): ${body}`)
  }
  console.log('✓ Site settings seeded')

  // Seed Homepage + About so the redesigned public pages — which now source
  // their content entirely from these globals — have something to render
  // for public.spec.ts's copy assertions. Payload's default locale is 'ja'
  // (see payload.config.ts), and required localized fields (services.name,
  // steps.title, storyParagraphs.text) are validated against the default
  // locale on first create — so a minimal ja write must land before the
  // real en content, or creation fails outright (same constraint documented
  // in scripts/seed.ts).
  const homepageJaRes = await apiCtx.post('/api/globals/homepage?locale=ja', {
    data: {
      services: [{ name: '車検・整備' }],
      steps: [{ title: '車両を選ぶ' }],
    },
  })
  if (!homepageJaRes.ok()) {
    const body = await homepageJaRes.text()
    await apiCtx.dispose()
    throw new Error(`Homepage ja seed failed (${homepageJaRes.status()}): ${body}`)
  }

  const homepageRes = await apiCtx.post('/api/globals/homepage?locale=en', {
    data: {
      heroHeading: 'Handpicked JDM Classics',
      heroSubheading: 'Quality inspected vehicles. Bilingual service. Worldwide shipping.',
      heroStats: [{ value: '22', label: 'years in business' }],
      services: [{ icon: 'Wrench', name: 'Shaken & servicing', description: 'Certified inspection and legal maintenance.', priceFrom: 'From ¥8,000' }],
      steps: [{ title: 'Browse the lot', description: 'Find a car you like from our current inventory.' }],
      shopSection: { heading: 'Four bays, no guesswork.', body: 'Servicing and custom work all happen in-house.', linkText: 'See the shop' },
      ctaBanner: { heading: 'Looking for your next car?', body: "Tell us what you're after.", buttonText: 'Get in touch' },
    },
  })
  if (!homepageRes.ok()) {
    const body = await homepageRes.text()
    await apiCtx.dispose()
    throw new Error(`Homepage seed failed (${homepageRes.status()}): ${body}`)
  }

  const aboutJaRes = await apiCtx.post('/api/globals/about?locale=ja', {
    data: {
      heroHeading: '職人の手による、確かな一台。',
      storyParagraphs: [{ text: 'オートショップ匠は2003年に創業しました。' }],
    },
  })
  if (!aboutJaRes.ok()) {
    const body = await aboutJaRes.text()
    await apiCtx.dispose()
    throw new Error(`About ja seed failed (${aboutJaRes.status()}): ${body}`)
  }

  const aboutRes = await apiCtx.post('/api/globals/about?locale=en', {
    data: {
      heroHeading: 'Built by hand, done right.',
      heroSubheading: 'Since 2003. A small Sendai workshop specializing in JDM classics.',
      storyHeading: 'Our story',
      storyParagraphs: [{ text: 'Autoshop Takumi started in 2003 out of a small garage in Sendai.' }],
      values: [{ title: 'Honest inspections', description: "We tell you what's good and what isn't, every time." }],
      team: [{ name: 'Ichiro Takumi', role: 'Owner / Mechanic', specialty: 'Engine & drivetrain' }],
      facility: [{ caption: 'Four service bays' }],
    },
  })
  if (!aboutRes.ok()) {
    const body = await aboutRes.text()
    await apiCtx.dispose()
    throw new Error(`About seed failed (${aboutRes.status()}): ${body}`)
  }
  await apiCtx.dispose()
  console.log('✓ Homepage + About seeded')
}
