import type {
  NamedLegacySource,
  MediaLegacySource,
  SiteSettingsLegacySource,
  HomepageLegacySource,
} from './content-field-mapping'

/**
 * Fixed, legacy-shaped fixtures representing pre-migration Makes/Models/Media/SiteSettings/
 * Homepage content — decoupled from scripts/seed.ts (which no longer produces this shape once
 * T037 lands), matching the precedent already established by
 * scripts/lib/vehicle-migration-fixture.ts for issue #19's Vehicles migration. Each entry pairs
 * legacy per-locale source values (as if read via two Local API calls, one per locale, each with
 * fallbackLocale: false) with the document's already-persisted new-field state, covering the
 * edge cases from spec.md/data-model.md — including at least one entry with only one language
 * populated (quickstart.md Scenario 2/3).
 */

export const NAMED_MIGRATION_FIXTURE: Array<{
  description: string
  legacy: NamedLegacySource
  current: Record<string, unknown>
}> = [
  {
    description: 'a fully unmigrated Make with both languages set',
    legacy: { ja: { name: 'トヨタ' }, en: { name: 'Toyota' } },
    current: {},
  },
  {
    description: 'a Make with only the Japanese name ever set (pre-existing data gap)',
    legacy: { ja: { name: 'ニッサン' }, en: {} },
    current: {},
  },
  {
    description: 'an already-partially-migrated Model — nameJa set, nameEn still blank',
    legacy: { ja: { name: 'スープラ' }, en: { name: 'Supra' } },
    current: { nameJa: 'スープラ' },
  },
]

export const MEDIA_MIGRATION_FIXTURE: Array<{
  description: string
  legacy: MediaLegacySource
  current: Record<string, unknown>
}> = [
  {
    description: 'a Media item with alt text in both languages',
    legacy: { ja: { alt: '車両の正面写真' }, en: { alt: 'Front view of the vehicle' } },
    current: {},
  },
  {
    description: 'a Media item that was never given alt text in either language',
    legacy: { ja: {}, en: {} },
    current: {},
  },
]

export const SITE_SETTINGS_MIGRATION_FIXTURE: {
  description: string
  legacy: SiteSettingsLegacySource
  current: Record<string, unknown>
} = {
  description: 'SiteSettings with shopName/address set in both languages, SEO fields blank',
  legacy: {
    ja: { shopName: 'テスト自動車', address: '〒000-0000 テスト県テスト市テスト町1-2-3' },
    en: { shopName: 'Test Motors', address: '1-2-3 Test-cho, Test City, Test 000-0000, Japan' },
  },
  current: {},
}

export const HOMEPAGE_MIGRATION_FIXTURE: {
  description: string
  legacy: HomepageLegacySource
  current: Record<string, unknown>
} = {
  description: 'Homepage with hero copy and whyUsPoints in both languages, one point Japanese-only',
  legacy: {
    ja: {
      heroHeading: '厳選されたJDMクラシックス',
      heroSubheading: '品質検査済み車両。バイリンガルサービス。',
      whyUsPoints: [
        { heading: '徹底検査済み', body: 'すべての車両は検査済みです。' },
        { heading: '輸出対応', body: undefined },
      ],
    },
    en: {
      heroHeading: 'Handpicked JDM Classics',
      heroSubheading: 'Quality inspected vehicles. Bilingual service.',
      whyUsPoints: [{ heading: 'Thoroughly Inspected', body: 'Every vehicle is inspected.' }],
    },
  },
  current: {},
}
