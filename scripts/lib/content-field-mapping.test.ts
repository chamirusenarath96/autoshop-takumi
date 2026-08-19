import { describe, it, expect } from 'vitest'
import type { SerializedEditorState } from 'lexical'
import {
  mapLegacyNamedFields,
  mapLegacyMediaFields,
  mapLegacySiteSettingsFields,
  mapLegacyHomepageFields,
} from './content-field-mapping'

const emptyParagraphRichText = {
  root: {
    type: 'root',
    children: [{ type: 'paragraph', children: [], direction: null, format: '', indent: 0, version: 1 }],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState

const populatedRichTextJa = {
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [{ type: 'text', text: 'こんにちは', detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
        direction: null,
        format: '',
        indent: 0,
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
} as unknown as SerializedEditorState

describe('mapLegacyNamedFields (Makes/Models)', () => {
  it('maps both legacy locale values into a fully unmigrated document', () => {
    const update = mapLegacyNamedFields({ ja: { name: 'トヨタ' }, en: { name: 'Toyota' } }, {})
    expect(update).toEqual({ nameJa: 'トヨタ', nameEn: 'Toyota' })
  })

  it('is per-field idempotent on a partially-migrated input (nameJa set, nameEn blank)', () => {
    const update = mapLegacyNamedFields(
      { ja: { name: 'トヨタ' }, en: { name: 'Toyota' } },
      { nameJa: 'トヨタ (already migrated)' },
    )
    expect(update.nameJa).toBeUndefined()
    expect(update.nameEn).toBe('Toyota')
  })

  it('produces no changes for a fully-migrated document (true no-op)', () => {
    const update = mapLegacyNamedFields(
      { ja: { name: 'トヨタ' }, en: { name: 'Toyota' } },
      { nameJa: 'トヨタ', nameEn: 'Toyota' },
    )
    expect(update).toEqual({})
  })

  it('leaves both targets blank when neither legacy language was ever populated', () => {
    const update = mapLegacyNamedFields({ ja: {}, en: {} }, {})
    expect(update).toEqual({})
  })
})

describe('mapLegacyMediaFields', () => {
  it('maps a single-language legacy alt (Japanese only) without fabricating English', () => {
    const update = mapLegacyMediaFields({ ja: { alt: '車両の写真' }, en: {} }, {})
    expect(update).toEqual({ altJa: '車両の写真' })
  })
})

describe('mapLegacySiteSettingsFields', () => {
  it('maps all four fields from a fully unmigrated global', () => {
    const update = mapLegacySiteSettingsFields(
      {
        ja: { shopName: 'オートショップ匠', address: '仙台市', defaultSeoTitle: 'タイトル', defaultSeoDescription: '説明' },
        en: { shopName: 'Autoshop Takumi', address: 'Sendai', defaultSeoTitle: 'Title', defaultSeoDescription: 'Description' },
      },
      {},
    )
    expect(update).toEqual({
      shopNameJa: 'オートショップ匠',
      shopNameEn: 'Autoshop Takumi',
      addressJa: '仙台市',
      addressEn: 'Sendai',
      defaultSeoTitleJa: 'タイトル',
      defaultSeoTitleEn: 'Title',
      defaultSeoDescriptionJa: '説明',
      defaultSeoDescriptionEn: 'Description',
    })
  })

  it('is per-target-field idempotent — only writes fields still blank', () => {
    const update = mapLegacySiteSettingsFields(
      { ja: { shopName: 'オートショップ匠' }, en: { shopName: 'Autoshop Takumi' } },
      { shopNameJa: 'オートショップ匠', shopNameEn: undefined },
    )
    expect(update).toEqual({ shopNameEn: 'Autoshop Takumi' })
  })

  it('a second run against its own output is a true no-op', () => {
    const legacy = { ja: { shopName: 'オートショップ匠', address: '仙台市' }, en: { shopName: 'Autoshop Takumi', address: 'Sendai' } }
    const firstRun = mapLegacySiteSettingsFields(legacy, {})
    const secondRun = mapLegacySiteSettingsFields(legacy, firstRun)
    expect(secondRun).toEqual({})
  })
})

describe('mapLegacyHomepageFields', () => {
  it('maps heroHeading/heroSubheading text fields', () => {
    const update = mapLegacyHomepageFields(
      { ja: { heroHeading: '見出し', heroSubheading: '副見出し' }, en: { heroHeading: 'Heading', heroSubheading: 'Subheading' } },
      {},
    )
    expect(update.heroHeadingJa).toBe('見出し')
    expect(update.heroHeadingEn).toBe('Heading')
    expect(update.heroSubheadingJa).toBe('副見出し')
    expect(update.heroSubheadingEn).toBe('Subheading')
  })

  it('maps richText aboutBlurb/contactSummary, treating an empty-paragraph structure as blank', () => {
    const update = mapLegacyHomepageFields(
      { ja: { aboutBlurb: populatedRichTextJa, contactSummary: emptyParagraphRichText }, en: {} },
      {},
    )
    expect(update.aboutBlurbJa).toEqual(populatedRichTextJa)
    expect(update.contactSummaryJa).toBeUndefined()
    expect(update.contactSummaryEn).toBeUndefined()
  })

  it('maps whyUsPoints[] by array index, with a mix of migrated/unmigrated items', () => {
    const update = mapLegacyHomepageFields(
      {
        ja: {
          whyUsPoints: [
            { heading: '徹底検査済み', body: '説明1' },
            { heading: 'バイリンガル対応', body: '説明2' },
          ],
        },
        en: {
          whyUsPoints: [
            { heading: 'Thoroughly Inspected', body: 'Desc 1' },
            { heading: 'Bilingual Service', body: 'Desc 2' },
          ],
        },
      },
      { whyUsPoints: [{ headingJa: '徹底検査済み', headingEn: 'Thoroughly Inspected', bodyJa: '説明1', bodyEn: 'Desc 1' }] },
    )
    expect(update.whyUsPoints).toEqual([
      { headingJa: '徹底検査済み', headingEn: 'Thoroughly Inspected', bodyJa: '説明1', bodyEn: 'Desc 1' },
      { headingJa: 'バイリンガル対応', headingEn: 'Bilingual Service', bodyJa: '説明2', bodyEn: 'Desc 2' },
    ])
  })

  it('is a true no-op on a second run against its own output (idempotent)', () => {
    const legacy = {
      ja: { heroHeading: '見出し', whyUsPoints: [{ heading: '徹底検査済み', body: '説明1' }] },
      en: { heroHeading: 'Heading', whyUsPoints: [{ heading: 'Thoroughly Inspected', body: 'Desc 1' }] },
    }
    const firstRun = mapLegacyHomepageFields(legacy, {})
    const fullyMigrated = { ...firstRun }
    const secondRun = mapLegacyHomepageFields(legacy, fullyMigrated)
    expect(secondRun).toEqual({})
  })

  it('never fabricates a value for a field neither language ever populated', () => {
    const update = mapLegacyHomepageFields({ ja: {}, en: {} }, {})
    expect(update).toEqual({})
  })
})
