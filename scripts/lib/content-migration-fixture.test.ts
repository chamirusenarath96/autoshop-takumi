import { describe, it, expect } from 'vitest'
import {
  mapLegacyNamedFields,
  mapLegacyMediaFields,
  mapLegacySiteSettingsFields,
  mapLegacyHomepageFields,
} from './content-field-mapping'
import {
  NAMED_MIGRATION_FIXTURE,
  MEDIA_MIGRATION_FIXTURE,
  SITE_SETTINGS_MIGRATION_FIXTURE,
  HOMEPAGE_MIGRATION_FIXTURE,
} from './content-migration-fixture'

/**
 * Validates the content-field-mapping.ts functions against the fixtures above — the closest
 * equivalent to quickstart.md Scenario 2's pre/post comparison achievable in this environment.
 * Running scripts/migrate-content-locale-fields.ts itself (a thin Local API wrapper around these
 * same functions) requires the `payload` CLI/tsx path, which hits the same pre-existing
 * tsx/@next/env ESM-CJS interop failure documented in README Known Issues for `npm run seed` —
 * confirmed to reproduce identically for `payload generate:types` in this feature (see commit
 * history). The pure mapping logic exercised here is what the script runs per-document/global;
 * only the Local API read/write plumbing around it is untestable in this sandbox — matching the
 * identical precedent already established in scripts/lib/vehicle-migration-fixture.test.ts.
 */
describe('content migration mapping — fixture validation (quickstart.md Scenario 2)', () => {
  it('migrates every Named (Makes/Models) fixture entry without dropping a populated legacy value', () => {
    for (const entry of NAMED_MIGRATION_FIXTURE) {
      const update = mapLegacyNamedFields(entry.legacy, entry.current)
      const effective = { ...entry.current, ...update }
      if (entry.legacy.ja?.name) expect(effective.nameJa, entry.description).toBe(entry.legacy.ja.name)
      if (entry.legacy.en?.name) expect(effective.nameEn, entry.description).toBe(entry.legacy.en.name)
    }
  })

  it('never fabricates an English value for a Make that only ever had a Japanese name', () => {
    const entry = NAMED_MIGRATION_FIXTURE.find((e) => e.description.includes('only the Japanese name'))!
    const update = mapLegacyNamedFields(entry.legacy, entry.current)
    expect(update.nameJa).toBe('ニッサン')
    expect(update.nameEn).toBeUndefined()
  })

  it('resumes a partially-migrated Model without overwriting the already-migrated field', () => {
    const entry = NAMED_MIGRATION_FIXTURE.find((e) => e.description.includes('partially-migrated'))!
    const update = mapLegacyNamedFields(entry.legacy, entry.current)
    expect(update.nameJa).toBeUndefined() // already migrated — left untouched
    expect(update.nameEn).toBe('Supra') // still blank — now filled
  })

  it('is a true no-op on a second run against its own output (idempotent)', () => {
    for (const entry of NAMED_MIGRATION_FIXTURE) {
      const firstRun = mapLegacyNamedFields(entry.legacy, entry.current)
      const fullyMigrated = { ...entry.current, ...firstRun }
      const secondRun = mapLegacyNamedFields(entry.legacy, fullyMigrated)
      expect(secondRun, `${entry.description}: re-running after migration was not a no-op`).toEqual({})
    }
  })

  it('migrates Media alt text, leaving both blank for an item that never had any', () => {
    const populated = MEDIA_MIGRATION_FIXTURE.find((e) => e.description.includes('both languages'))!
    expect(mapLegacyMediaFields(populated.legacy, populated.current)).toEqual({
      altJa: '車両の正面写真',
      altEn: 'Front view of the vehicle',
    })

    const gap = MEDIA_MIGRATION_FIXTURE.find((e) => e.description.includes('never given alt text'))!
    expect(mapLegacyMediaFields(gap.legacy, gap.current)).toEqual({})
  })

  it('migrates SiteSettings shopName/address without touching the blank SEO fields', () => {
    const { legacy, current } = SITE_SETTINGS_MIGRATION_FIXTURE
    const update = mapLegacySiteSettingsFields(legacy, current)
    expect(update).toEqual({
      shopNameJa: 'テスト自動車',
      shopNameEn: 'Test Motors',
      addressJa: '〒000-0000 テスト県テスト市テスト町1-2-3',
      addressEn: '1-2-3 Test-cho, Test City, Test 000-0000, Japan',
    })
    expect(update.defaultSeoTitleJa).toBeUndefined()
  })

  it('SiteSettings migration is idempotent on a second run', () => {
    const { legacy, current } = SITE_SETTINGS_MIGRATION_FIXTURE
    const firstRun = mapLegacySiteSettingsFields(legacy, current)
    const secondRun = mapLegacySiteSettingsFields(legacy, { ...current, ...firstRun })
    expect(secondRun).toEqual({})
  })

  it('migrates Homepage hero copy and whyUsPoints[], including an entry with only one language populated', () => {
    const { legacy, current } = HOMEPAGE_MIGRATION_FIXTURE
    const update = mapLegacyHomepageFields(legacy, current)
    expect(update.heroHeadingJa).toBe('厳選されたJDMクラシックス')
    expect(update.heroHeadingEn).toBe('Handpicked JDM Classics')
    expect(update.whyUsPoints).toEqual([
      { headingJa: '徹底検査済み', headingEn: 'Thoroughly Inspected', bodyJa: 'すべての車両は検査済みです。', bodyEn: 'Every vehicle is inspected.' },
      { headingJa: '輸出対応', headingEn: undefined, bodyJa: undefined, bodyEn: undefined },
    ])
  })

  it('Homepage migration is idempotent on a second run', () => {
    const { legacy, current } = HOMEPAGE_MIGRATION_FIXTURE
    const firstRun = mapLegacyHomepageFields(legacy, current)
    const secondRun = mapLegacyHomepageFields(legacy, { ...current, ...firstRun })
    expect(secondRun).toEqual({})
  })
})
