/**
 * Seeds the e2e admin user directly via Payload Local API.
 * Called by e2e/global-setup.ts when login fails (fresh DB).
 */
import { getPayload } from '../src/lib/payload'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@autoshoptakumi.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Takumi2024!'

async function seedAdmin() {
  const payload = await getPayload()

  // Check specifically for the configured E2E admin — a reused DB may already
  // contain other users, which would otherwise cause this to skip seeding and
  // leave the E2E login flow with no matching account.
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existing.totalDocs > 0) {
    console.log('E2E admin user already exists — skipping seed')
    process.exit(0)
  }

  await payload.create({
    collection: 'users',
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'Admin',
      role: 'admin',
    },
    overrideAccess: true,
  })

  console.log(`✓ Admin user created: ${ADMIN_EMAIL}`)
  process.exit(0)
}

seedAdmin().catch((e) => {
  console.error('Seed failed:', e.message)
  process.exit(1)
})
