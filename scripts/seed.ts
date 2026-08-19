import { getPayload } from '../src/lib/payload'

async function seed() {
  const payload = await getPayload()

  console.log('Seeding makes...')
  // nameJa/nameEn are plain (non-localized) fields — a single create sets both languages.
  const toyota = await payload.create({
    collection: 'makes',
    data: { nameJa: 'トヨタ', nameEn: 'Toyota', slug: 'toyota' },
  })
  const nissan = await payload.create({
    collection: 'makes',
    data: { nameJa: 'ニッサン', nameEn: 'Nissan', slug: 'nissan' },
  })

  console.log('Seeding models...')
  const supra = await payload.create({
    collection: 'models',
    data: { nameJa: 'スープラ', nameEn: 'Supra', slug: 'supra', make: toyota.id, chassisCode: 'JZA80' },
  })
  const skyline = await payload.create({
    collection: 'models',
    data: { nameJa: 'スカイライン GT-R', nameEn: 'Skyline GT-R', slug: 'skyline-gt-r', make: nissan.id, chassisCode: 'BNR34' },
  })

  console.log('Seeding site settings...')
  // shopNameJa/En and addressJa/En are plain (non-localized) fields — set once. businessHours
  // remains localized (out of scope for specs/003-remove-payload-localization), so it still
  // needs the two per-locale writes below.
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      shopNameJa: 'オートショップ匠',
      shopNameEn: 'Autoshop Takumi',
      contactEmail: 'takumitradings@gmail.com',
      contactPhone: '022-342-2285',
      addressJa: '〒983-0013 宮城県仙台市宮城野区中野字神明148-1',
      addressEn: '148-1 Nakanonazamyojin, Miyaginoku, Sendai, Miyagi 983-0013, Japan',
      socialLinks: [{ platform: 'instagram', url: 'https://www.instagram.com/autoshop_takumi/' }],
      showSoldVehicles: true,
      businessHours: 'Mon–Sat 9:00–18:00, closed Sundays',
    },
    locale: 'en',
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      businessHours: '月〜土 9:00〜18:00（日曜定休）',
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
      heroStats: [
        { value: '22', label: '年の実績' },
        { value: '4', label: 'リフト完備' },
        { value: '600+', label: '販売実績台数' },
      ],
      services: [
        { icon: 'Wrench', name: '車検・整備', description: '国土交通省認証工場での車検・法定点検。', priceFrom: '¥8,000〜' },
        { icon: 'Search', name: '購入前点検', description: '第三者機関による100項目の購入前検査。', priceFrom: '¥15,000〜' },
        { icon: 'Ship', name: '輸出手配', description: '海外発送に必要な書類・通関手続きを代行。', priceFrom: 'お見積り' },
        { icon: 'Palette', name: '板金・塗装', description: '自社工場での板金・塗装・カスタム対応。', priceFrom: 'お見積り' },
      ],
      steps: [
        { title: '車両を選ぶ', description: '在庫一覧から気になる一台を見つけてください。' },
        { title: 'お問い合わせ', description: 'フォームからお気軽にご質問・ご相談ください。' },
        { title: 'ご成約・納車', description: '国内納車、または海外発送の手続きを進めます。' },
      ],
      shopSection: {
        heading: '4基のリフトで、見えない部分まで。',
        body: '整備からカスタムまで自社工場で一貫対応。妥協のない仕上がりをお約束します。',
        linkText: '工場を見る',
      },
      ctaBanner: {
        heading: '次の一台をお探しですか？',
        body: '在庫にない車両も、お探しいたします。まずはお気軽にご相談ください。',
        buttonText: 'お問い合わせ',
      },
    },
    locale: 'ja',
  })
  await payload.updateGlobal({
    slug: 'homepage',
    data: {
      // heroHeadingJa/En, heroSubheadingJa/En, and whyUsPoints[].headingJa/En/bodyJa/En are
      // plain, non-localized fields (see specs/003-remove-payload-localization) — set once here
      // rather than split across the ja/en calls like the still-localized fields below.
      heroHeadingJa: '厳選されたJDMクラシックス',
      heroHeadingEn: 'Handpicked JDM Classics',
      heroSubheadingJa: '品質検査済み車両。バイリンガルサービス。全世界発送対応。',
      heroSubheadingEn: 'Quality inspected vehicles. Bilingual service. Worldwide shipping.',
      whyUsPoints: [
        { headingJa: '徹底検査済み', headingEn: 'Thoroughly Inspected', bodyJa: 'すべての車両は出品前に100項目の検査を受けています。', bodyEn: 'Every vehicle goes through a 100-point inspection before listing.' },
        { headingJa: 'バイリンガル対応', headingEn: 'Bilingual Service', bodyJa: '日本語と英語で完全サポート。', bodyEn: 'Full support in Japanese and English.' },
        { headingJa: '輸出対応', headingEn: 'Export Ready', bodyJa: '海外のお客様向けの書類手続きも承ります。', bodyEn: 'We handle documentation for international buyers.' },
      ],
      heroStats: [
        { value: '22', label: 'years in business' },
        { value: '4', label: 'lifts on the floor' },
        { value: '600+', label: 'cars sold' },
      ],
      services: [
        { icon: 'Wrench', name: 'Shaken & servicing', description: 'Certified inspection and legal maintenance.', priceFrom: 'From ¥8,000' },
        { icon: 'Search', name: 'Pre-purchase inspection', description: 'Independent 100-point pre-purchase check.', priceFrom: 'From ¥15,000' },
        { icon: 'Ship', name: 'Export arrangement', description: 'We handle documentation and customs for overseas shipping.', priceFrom: 'Quote' },
        { icon: 'Palette', name: 'Bodywork & paint', description: 'In-house bodywork, paint, and custom finishing.', priceFrom: 'Quote' },
      ],
      steps: [
        { title: 'Browse the lot', description: 'Find a car you like from our current inventory.' },
        { title: 'Get in touch', description: 'Send us a question or a booking through the form.' },
        { title: 'Buy or ship', description: 'We arrange local delivery or international export.' },
      ],
      shopSection: {
        heading: 'Four bays, no guesswork.',
        body: 'Servicing and custom work all happen in-house, so nothing gets missed.',
        linkText: 'See the shop',
      },
      ctaBanner: {
        heading: 'Looking for your next car?',
        body: "Don't see it in stock? Tell us what you're after and we'll help you find it.",
        buttonText: 'Get in touch',
      },
    },
    locale: 'en',
  })

  console.log('Seeding about page...')
  // Same JA-first ordering constraint as homepage.whyUsPoints — team.name is
  // required but NOT localized, so it only needs to be set once (on the
  // default-locale create); role/specialty are localized and repeated below.
  await payload.updateGlobal({
    slug: 'about',
    data: {
      heroHeading: '職人の手による、確かな一台。',
      heroSubheading: '2003年創業。仙台でJDMクラシックを扱う小さな工房です。',
      storyHeading: '私たちについて',
      storyParagraphs: [
        { text: 'オートショップ匠は2003年、仙台の小さなガレージから始まりました。' },
        { text: '以来、状態の良いJDMクラシックだけを厳選して仕入れ、自社工場で整備してからお届けしています。' },
      ],
      values: [
        { icon: 'ShieldCheck', title: '誠実な検査', description: '状態を偽らず、良い点も悪い点も正直にお伝えします。' },
        { icon: 'Handshake', title: 'お客様第一', description: '一台一台、納得いただけるまでご説明します。' },
      ],
      team: [
        { name: '匠 一郎', role: '代表 / 整備士', years: '22年', specialty: 'エンジン・駆動系' },
        { name: '匠 次郎', role: '板金・塗装', years: '15年', specialty: 'ボディワーク' },
      ],
      facility: [
        { caption: '整備リフト4基' },
        { caption: '板金・塗装ブース' },
      ],
    },
    locale: 'ja',
  })
  await payload.updateGlobal({
    slug: 'about',
    data: {
      heroHeading: 'Built by hand, done right.',
      heroSubheading: 'Since 2003. A small Sendai workshop specializing in JDM classics.',
      storyHeading: 'Our story',
      storyParagraphs: [
        { text: 'Autoshop Takumi started in 2003 out of a small garage in Sendai.' },
        { text: "We've kept it small on purpose — every car we sell is sourced, inspected, and serviced in-house." },
      ],
      values: [
        { icon: 'ShieldCheck', title: 'Honest inspections', description: "We tell you what's good and what isn't, every time." },
        { icon: 'Handshake', title: 'Customer first', description: "We don't move on until you're confident in the car." },
      ],
      team: [
        { name: 'Ichiro Takumi', role: 'Owner / Mechanic', years: '22 years', specialty: 'Engine & drivetrain' },
        { name: 'Jiro Takumi', role: 'Bodywork & paint', years: '15 years', specialty: 'Bodywork' },
      ],
      facility: [
        { caption: 'Four service bays' },
        { caption: 'Bodywork & paint booth' },
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
