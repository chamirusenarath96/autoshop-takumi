import { getPayload } from '../src/lib/payload'

async function seed() {
  const payload = await getPayload()

  console.log('Seeding makes...')
  const toyota = await payload.create({
    collection: 'makes',
    data: { name: 'Toyota', slug: 'toyota' },
    locale: 'en',
  })
  await payload.update({ collection: 'makes', id: toyota.id, data: { name: 'トヨタ' }, locale: 'ja' })

  const nissan = await payload.create({
    collection: 'makes',
    data: { name: 'Nissan', slug: 'nissan' },
    locale: 'en',
  })
  await payload.update({ collection: 'makes', id: nissan.id, data: { name: 'ニッサン' }, locale: 'ja' })

  console.log('Seeding models...')
  const supra = await payload.create({
    collection: 'models',
    data: { name: 'Supra', slug: 'supra', make: toyota.id, chassisCode: 'JZA80' },
    locale: 'en',
  })
  await payload.update({ collection: 'models', id: supra.id, data: { name: 'スープラ' }, locale: 'ja' })

  const skyline = await payload.create({
    collection: 'models',
    data: { name: 'Skyline GT-R', slug: 'skyline-gt-r', make: nissan.id, chassisCode: 'BNR34' },
    locale: 'en',
  })
  await payload.update({ collection: 'models', id: skyline.id, data: { name: 'スカイライン GT-R' }, locale: 'ja' })

  console.log('Seeding site settings...')
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      shopName: 'Autoshop Takumi',
      contactEmail: 'info@autoshoptakumi.example',
      showSoldVehicles: true,
    },
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { shopName: 'オートショップ匠' },
    locale: 'ja',
  })

  console.log('Seeding homepage...')
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroHeading: 'Handpicked JDM Classics',
      heroSubheading: 'Quality inspected vehicles. Bilingual service. Worldwide shipping.',
      whyUsPoints: [
        { heading: 'Thoroughly Inspected', body: 'Every vehicle goes through a 100-point inspection before listing.' },
        { heading: 'Bilingual Service', body: 'Full support in Japanese and English.' },
        { heading: 'Export Ready', body: 'We handle documentation for international buyers.' },
      ],
    },
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroHeading: '厳選されたJDMクラシックス',
      heroSubheading: '品質検査済み車両。バイリンガルサービス。全世界発送対応。',
    },
    locale: 'ja',
  })

  console.log('✓ Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
