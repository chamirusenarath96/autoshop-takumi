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
      contactEmail: 'takumitradings@gmail.com',
      contactPhone: '022-342-2285',
      address: '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013, Japan',
      socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/autoshop_takumi/' }],
      showSoldVehicles: true,
    },
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      shopName: 'オートショップ匠',
      address: '〒983-0013 宮城県仙台市宮城野区中野字神明148-1',
    },
    locale: 'ja',
  })

  console.log('Seeding homepage...')
  // whyUsPoints.heading is required + localized, and the default locale is
  // 'ja' (see payload.config.ts) — on first creation Payload validates
  // required localized fields against the default locale, so it must be
  // written first and with complete data, or the create fails outright.
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      heroHeading: '厳選されたJDMクラシックス',
      heroSubheading: '品質検査済み車両。バイリンガルサービス。全世界発送対応。',
      whyUsPoints: [
        { heading: '徹底検査済み', body: 'すべての車両は出品前に100項目の検査を受けています。' },
        { heading: 'バイリンガル対応', body: '日本語と英語で完全サポート。' },
        { heading: '輸出対応', body: '海外のお客様向けの書類手続きも承ります。' },
      ],
    },
    locale: 'ja',
  })
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

  console.log('✓ Seed complete.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
