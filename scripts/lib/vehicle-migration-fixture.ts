import type { VehicleLegacySource } from './vehicle-field-mapping'

/**
 * Fixed, legacy-shaped fixture representing pre-migration Vehicles documents — decoupled from
 * scripts/seed.ts (which no longer produces this shape once T032 lands) so this validation
 * doesn't depend on that script's current shape. Each entry pairs the legacy per-locale source
 * values (as if read via two payload.findByID() calls, one per locale) with the document's
 * already-persisted new-field state, covering the edge cases from spec.md/data-model.md.
 */
export const VEHICLE_MIGRATION_FIXTURE: Array<{
  description: string
  legacy: VehicleLegacySource
  current: Record<string, unknown>
}> = [
  {
    description: 'a fully unmigrated document with both languages and a JPY price',
    legacy: {
      ja: { title: '1999年式 トヨタ スープラ RZ', exteriorColor: '赤', summary: '概要文' },
      en: { title: '1999 Toyota Supra RZ', exteriorColor: 'Red', summary: 'Summary text' },
      priceSource: { price: 4500000, currency: 'JPY', priceOnRequest: false },
    },
    current: {},
  },
  {
    description: 'a legacy price with a blank currency — must default to JPY, not drop the price',
    legacy: {
      ja: { title: 'カレンシー未設定車両' },
      en: {},
      priceSource: { price: 1000000, currency: null },
    },
    current: {},
  },
  {
    description: 'a legacy price with an unrecognized currency value — must also default to JPY',
    legacy: {
      ja: { title: '不明カレンシー車両' },
      en: {},
      priceSource: { price: 2000000, currency: 'GBP' },
    },
    current: {},
  },
  {
    description: 'a USD-currency legacy price — must map to priceUsd, leaving priceJpy blank',
    legacy: {
      ja: { title: '米ドル車両' },
      en: { title: 'USD Vehicle' },
      priceSource: { price: 28000, currency: 'USD' },
    },
    current: {},
  },
  {
    description: 'priceOnRequest true with no legacy price — must pass through, both price fields stay blank',
    legacy: {
      ja: { title: '要問い合わせ車両' },
      en: {},
      priceSource: { priceOnRequest: true },
    },
    current: {},
  },
  {
    description: 'a pre-existing data gap — neither language ever had a title (migration must not fail)',
    legacy: {
      ja: {},
      en: {},
      priceSource: {},
    },
    current: {},
  },
  {
    description: 'an already-partially-migrated document — titleJa set, titleEn and price still blank',
    legacy: {
      ja: { title: '部分移行済み車両' },
      en: { title: 'Partially Migrated Vehicle' },
      priceSource: { price: 3000000, currency: 'JPY' },
    },
    current: { titleJa: '部分移行済み車両' },
  },
]
