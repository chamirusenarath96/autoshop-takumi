import { describe, it, expect } from 'vitest'
import type { SerializedEditorState } from 'lexical'
import { mapLegacyVehicleFields, type VehicleCurrentFields, type VehicleLegacySource } from './vehicle-field-mapping'

const richText = (text: string) =>
  ({
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', text, detail: 0, format: 0, mode: 'normal', style: '', version: 1 }],
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
  }) as unknown as SerializedEditorState

function legacy(overrides: Partial<VehicleLegacySource> = {}): VehicleLegacySource {
  return {
    ja: {},
    en: {},
    priceSource: {},
    ...overrides,
  }
}

const blankCurrent: VehicleCurrentFields = {}

describe('mapLegacyVehicleFields', () => {
  it('maps a fully unmigrated document — all legacy values copied into blank targets', () => {
    const source = legacy({
      ja: { title: '日本語タイトル', exteriorColor: '赤', summary: '概要', seoTitle: 'SEOタイトル', seoDescription: 'SEO概要' },
      en: { title: 'English Title', exteriorColor: 'Red', summary: 'Summary', seoTitle: 'SEO Title', seoDescription: 'SEO Desc' },
      priceSource: { price: 4500000, currency: 'JPY', priceOnRequest: false },
    })
    const update = mapLegacyVehicleFields(source, blankCurrent)
    expect(update).toMatchObject({
      titleJa: '日本語タイトル',
      titleEn: 'English Title',
      exteriorColorJa: '赤',
      exteriorColorEn: 'Red',
      summaryJa: '概要',
      summaryEn: 'Summary',
      seoTitleJa: 'SEOタイトル',
      seoTitleEn: 'SEO Title',
      seoDescriptionJa: 'SEO概要',
      seoDescriptionEn: 'SEO Desc',
      priceJpy: 4500000,
      priceOnRequest: false,
    })
    expect(update.priceUsd).toBeUndefined()
  })

  it('maps a USD-currency legacy price into priceUsd, leaving priceJpy blank', () => {
    const source = legacy({ priceSource: { price: 30000, currency: 'USD' } })
    const update = mapLegacyVehicleFields(source, blankCurrent)
    expect(update.priceUsd).toBe(30000)
    expect(update.priceJpy).toBeUndefined()
  })

  it('defaults a blank/unrecognized currency to JPY rather than dropping the price', () => {
    const blankCurrency = mapLegacyVehicleFields(legacy({ priceSource: { price: 1000000, currency: null } }), blankCurrent)
    expect(blankCurrency.priceJpy).toBe(1000000)
    expect(blankCurrency.priceUsd).toBeUndefined()

    const unrecognizedCurrency = mapLegacyVehicleFields(
      legacy({ priceSource: { price: 2000000, currency: 'GBP' } }),
      blankCurrent,
    )
    expect(unrecognizedCurrency.priceJpy).toBe(2000000)
    expect(unrecognizedCurrency.priceUsd).toBeUndefined()
  })

  it('passes priceOnRequest through unchanged, including when true with no price', () => {
    const update = mapLegacyVehicleFields(legacy({ priceSource: { priceOnRequest: true } }), blankCurrent)
    expect(update.priceOnRequest).toBe(true)
    expect(update.priceJpy).toBeUndefined()
    expect(update.priceUsd).toBeUndefined()
  })

  it('is idempotent per-field on a partially-migrated document — leaves already-populated targets untouched', () => {
    const source = legacy({
      ja: { title: '日本語タイトル' },
      en: { title: 'English Title' },
      priceSource: { price: 4500000, currency: 'JPY' },
    })
    const partiallyMigrated: VehicleCurrentFields = {
      titleJa: 'Already Migrated JA',
      // titleEn still blank
      priceJpy: 9999999, // already migrated, should not be overwritten
    }
    const update = mapLegacyVehicleFields(source, partiallyMigrated)
    expect(update.titleJa).toBeUndefined()
    expect(update.titleEn).toBe('English Title')
    expect(update.priceJpy).toBeUndefined()
  })

  it('is a true no-op against a fully-migrated document, including populated highlights/specs rows', () => {
    const source = legacy({
      ja: { title: '日本語タイトル', highlights: [{ text: '一番目' }], specs: [{ label: 'エンジン', value: 'V8' }] },
      en: { title: 'English Title', highlights: [{ text: 'First' }], specs: [{ label: 'Engine', value: 'V8' }] },
      priceSource: { price: 4500000, currency: 'JPY', priceOnRequest: false },
    })
    const fullyMigrated: VehicleCurrentFields = {
      titleJa: '日本語タイトル',
      titleEn: 'English Title',
      priceJpy: 4500000,
      priceOnRequest: false,
      highlights: [{ textJa: '一番目', textEn: 'First' }],
      specs: [{ labelJa: 'エンジン', labelEn: 'Engine', valueJa: 'V8', valueEn: 'V8' }],
    }
    const update = mapLegacyVehicleFields(source, fullyMigrated)
    expect(update).toEqual({})
  })

  it('preserves both legacy locale values when both are populated, not just one', () => {
    const source = legacy({
      ja: { seoTitle: 'JAのSEO' },
      en: { seoTitle: 'EN SEO' },
    })
    const update = mapLegacyVehicleFields(source, blankCurrent)
    expect(update.seoTitleJa).toBe('JAのSEO')
    expect(update.seoTitleEn).toBe('EN SEO')
  })

  it('maps highlights per array index independently, preserving other already-migrated rows', () => {
    const source = legacy({
      ja: { highlights: [{ text: '一番目' }, { text: '二番目' }] },
      en: { highlights: [{ text: 'First' }, { text: 'Second' }] },
    })
    const current: VehicleCurrentFields = {
      highlights: [{ textJa: 'Already JA', textEn: undefined }, {}],
    }
    const update = mapLegacyVehicleFields(source, current)
    expect(update.highlights).toEqual([
      { textJa: 'Already JA', textEn: 'First' },
      { textJa: '二番目', textEn: 'Second' },
    ])
  })

  it('maps a spec row with mismatched-language legacy sources into independent label/value fallback targets', () => {
    const source = legacy({
      ja: { specs: [{ label: 'エンジン' }] },
      en: { specs: [{ value: 'Engine' }] },
    })
    const update = mapLegacyVehicleFields(source, { specs: [{}] })
    expect(update.specs).toEqual([{ labelJa: 'エンジン', labelEn: undefined, valueJa: undefined, valueEn: 'Engine' }])
  })

  it('resolves a richText description pair, treating an empty-paragraph value as blank', () => {
    const emptyParagraph = {
      root: { type: 'root', children: [{ type: 'paragraph', children: [] }], direction: null, format: '', indent: 0, version: 1 },
    } as unknown as SerializedEditorState
    const source = legacy({ ja: { description: richText('日本語の説明') }, en: { description: emptyParagraph } })
    const update = mapLegacyVehicleFields(source, blankCurrent)
    expect(update.descriptionJa).toEqual(richText('日本語の説明'))
    expect(update.descriptionEn).toBeUndefined()
  })
})
