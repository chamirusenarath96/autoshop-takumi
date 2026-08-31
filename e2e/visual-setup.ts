/**
 * Setup script for the visual-e2e CI job — NOT a Playwright globalSetup hook (see
 * playwright.visual.config.ts's comment on why it deliberately has none). Run as its
 * own step between the `visual-first-run` and `visual` Playwright invocations
 * (.github/workflows/ci.yml): creates the admin user, seeds SiteSettings/Homepage/About
 * so pages have real content to render, and creates one deterministic Make/Model/Vehicle
 * fixture for the `visual` project's page snapshots to read.
 *
 * Runs unconditionally (no upsert/idempotency) — the visual-e2e job's database is always
 * freshly created for that job run, so there is nothing pre-existing to collide with.
 */
import { chromium, request } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_STATE_PATH, createMake, createModel, uploadMedia } from './helpers'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const FIXTURE_PATH = 'e2e/.visual-fixture.json'

async function main() {
  const authDir = path.join(process.cwd(), 'e2e', '.auth')
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true })

  // Same login/create-first-user branching logic as e2e/global-setup.ts, duplicated
  // rather than shared: this runs as a plain CI-step script against a genuinely fresh
  // database, so it always takes the create-first-user branch, unlike global-setup.ts
  // which also has to handle re-runs against an already-initialized database.
  console.log('Creating first admin user via browser...')
  const browser = await chromium.launch()
  const bCtx = await browser.newContext({ baseURL: BASE_URL })
  const setupPage = await bCtx.newPage()

  await setupPage.goto('/admin/create-first-user', { waitUntil: 'networkidle', timeout: 60_000 })
  await setupPage.waitForSelector('input[name="password"]', { timeout: 15_000 })

  await setupPage.locator('#field-email').fill(ADMIN_EMAIL)
  await setupPage.locator('#field-password').fill(ADMIN_PASSWORD)
  await setupPage.locator('#field-confirm-password').fill(ADMIN_PASSWORD)
  await setupPage.locator('#field-name').fill('Admin')
  await setupPage.waitForTimeout(500)

  await setupPage.getByRole('button', { name: /create/i }).click()
  await setupPage.waitForURL('**/admin', { timeout: 30_000 })
  console.log('✓ First user created')

  await bCtx.storageState({ path: AUTH_STATE_PATH })
  await bCtx.close()
  await browser.close()

  // Use a request context (with the saved auth state) for the rest of the seeding —
  // matches e2e/global-setup.ts's pattern of preferring the REST API over the browser
  // once a session exists.
  const apiCtx = await request.newContext({ baseURL: BASE_URL, storageState: AUTH_STATE_PATH, timeout: 60_000 })

  const siteSettingsRes = await apiCtx.post('/api/globals/site-settings', {
    data: {
      shopName: 'Autoshop Takumi',
      contactEmail: 'takumitradings@gmail.com',
      contactPhone: '022-342-2285',
      address: '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013, Japan',
      socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/autoshop_takumi/' }],
    },
  })
  if (!siteSettingsRes.ok()) {
    throw new Error(`Site settings seed failed (${siteSettingsRes.status()}): ${await siteSettingsRes.text()}`)
  }
  console.log('✓ Site settings seeded')

  const homepageJaRes = await apiCtx.post('/api/globals/homepage?locale=ja', {
    data: {
      services: [{ name: '車検・整備' }],
      steps: [{ title: '車両を選ぶ' }],
    },
  })
  if (!homepageJaRes.ok()) {
    throw new Error(`Homepage ja seed failed (${homepageJaRes.status()}): ${await homepageJaRes.text()}`)
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
    throw new Error(`Homepage seed failed (${homepageRes.status()}): ${await homepageRes.text()}`)
  }

  const aboutJaRes = await apiCtx.post('/api/globals/about?locale=ja', {
    data: {
      heroHeading: '職人の手による、確かな一台。',
      storyParagraphs: [{ text: 'オートショップ匠は2003年に創業しました。' }],
    },
  })
  if (!aboutJaRes.ok()) {
    throw new Error(`About ja seed failed (${aboutJaRes.status()}): ${await aboutJaRes.text()}`)
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
    throw new Error(`About seed failed (${aboutRes.status()}): ${await aboutRes.text()}`)
  }
  console.log('✓ Homepage + About seeded')

  // One deterministic, fixed-slug/name fixture — see research.md's fixture decision. No
  // idempotency needed: this job's database is always freshly created. createMake/
  // createModel/uploadMedia take a Playwright `Page` (they issue requests via
  // `page.request`, reusing the page's own authenticated context) — open one browser
  // context with the saved auth state for this step, fixed names/slugs throughout
  // (not createPublishedVehicle's timestamp-suffixed ones) so the filter test (T016)
  // can rely on a known Make name without reading it back from the fixture file.
  const fixtureBrowser = await chromium.launch()
  const fixtureCtx = await fixtureBrowser.newContext({ baseURL: BASE_URL, storageState: AUTH_STATE_PATH })
  const fixturePage = await fixtureCtx.newPage()

  const makeId = await createMake(fixturePage, 'Toyota', 'toyota')
  const modelId = await createModel(fixturePage, 'Supra', 'supra', makeId)
  const heroImageId = await uploadMedia(fixturePage)

  const vehicleRes = await fixturePage.request.post('/api/vehicles', {
    data: {
      titleJa: 'ビジュアルテスト車両',
      titleEn: 'Visual Test Vehicle',
      slug: 'visual-test-vehicle',
      status: 'available',
      make: makeId,
      model: modelId,
      year: 1998,
      priceJpy: 3200000,
      mileageKm: 45000,
      heroImage: heroImageId,
      bodyType: 'coupe',
      transmission: 'MT',
    },
  })
  const vehicleData = await vehicleRes.json()
  if (vehicleRes.status() !== 201) {
    throw new Error(`Fixture vehicle create failed: ${JSON.stringify(vehicleData.errors ?? vehicleData)}`)
  }

  await fixtureCtx.close()
  await fixtureBrowser.close()
  await apiCtx.dispose()

  const fixture = {
    makeId,
    modelId,
    makeName: 'Toyota',
    vehicleId: vehicleData.doc.id as number,
    vehicleSlug: vehicleData.doc.slug as string,
  }
  fs.writeFileSync(FIXTURE_PATH, JSON.stringify(fixture, null, 2))
  console.log(`✓ Visual fixture created: ${JSON.stringify(fixture)}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
