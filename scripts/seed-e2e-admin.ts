/**
 * Seeds the e2e admin user directly via Payload Local API.
 * Called by e2e/global-setup.ts when login fails (fresh DB).
 */
import { getPayload } from '../src/lib/payload'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@autoshoptakumi.com'
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'Takumi2024!'

async function seedAdmin() {
  const payload = await getPayload()

  // Check if user already exists
  const existing = await payload.find({ collection: 'users', limit: 1 })
  if (existing.totalDocs > 0) {
    console.log('Admin user already exists — skipping seed')
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
