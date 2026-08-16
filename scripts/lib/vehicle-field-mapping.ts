import { isNumberPresent, isRichTextPresent, isTextPresent } from '@/lib/vehicle-locale'
import type { SerializedEditorState } from 'lexical'

type RichTextValue = SerializedEditorState | null | undefined

/** Per-locale values read from the old `localized: true` fields (one full read per locale). */
export type LegacyLocaleValues = {
  title?: string | null
  exteriorColor?: string | null
  summary?: string | null
  description?: RichTextValue
  seoTitle?: string | null
  seoDescription?: string | null
  highlights?: Array<{ text?: string | null }>
  specs?: Array<{ label?: string | null; value?: string | null }>
}

/** Old, non-localized price fields, read once (identical regardless of locale). */
export type LegacyPriceSource = {
  price?: number | null
  currency?: string | null
  priceOnRequest?: boolean | null
}

export type VehicleLegacySource = {
  ja: LegacyLocaleValues
  en: LegacyLocaleValues
  priceSource: LegacyPriceSource
}

/** The new paired fields' current state, as persisted (possibly partially migrated already). */
export type VehicleCurrentFields = {
  titleJa?: string | null
  titleEn?: string | null
  exteriorColorJa?: string | null
  exteriorColorEn?: string | null
  summaryJa?: string | null
  summaryEn?: string | null
  descriptionJa?: RichTextValue
  descriptionEn?: RichTextValue
  seoTitleJa?: string | null
  seoTitleEn?: string | null
  seoDescriptionJa?: string | null
  seoDescriptionEn?: string | null
  highlights?: Array<{ textJa?: string | null; textEn?: string | null }>
  specs?: Array<{ labelJa?: string | null; labelEn?: string | null; valueJa?: string | null; valueEn?: string | null }>
  priceJpy?: number | null
  priceUsd?: number | null
  priceOnRequest?: boolean | null
}

function mapTextField(
  currentJa: string | null | undefined,
  currentEn: string | null | undefined,
  legacyJa: string | null | undefined,
  legacyEn: string | null | undefined,
): { ja?: string; en?: string } {
  const update: { ja?: string; en?: string } = {}
  if (!isTextPresent(currentJa) && isTextPresent(legacyJa)) update.ja = legacyJa
  if (!isTextPresent(currentEn) && isTextPresent(legacyEn)) update.en = legacyEn
  return update
}

function mapRichTextField(
  currentJa: RichTextValue,
  currentEn: RichTextValue,
  legacyJa: RichTextValue,
  legacyEn: RichTextValue,
): { ja?: SerializedEditorState; en?: SerializedEditorState } {
  const update: { ja?: SerializedEditorState; en?: SerializedEditorState } = {}
  if (!isRichTextPresent(currentJa) && isRichTextPresent(legacyJa)) update.ja = legacyJa
  if (!isRichTextPresent(currentEn) && isRichTextPresent(legacyEn)) update.en = legacyEn
  return update
}

/**
 * Resolves the legacy price+currency into the new priceJpy/priceUsd fields.
 * A blank or unrecognized currency is treated as 'JPY', matching the old field's
 * schema default, rather than dropping the price (see spec.md Assumptions).
 */
function mapPriceFields(
  current: Pick<VehicleCurrentFields, 'priceJpy' | 'priceUsd'>,
  priceSource: LegacyPriceSource,
): Partial<Pick<VehicleCurrentFields, 'priceJpy' | 'priceUsd'>> {
  const update: Partial<Pick<VehicleCurrentFields, 'priceJpy' | 'priceUsd'>> = {}
  if (!isNumberPresent(priceSource.price)) return update

  const isUsd = priceSource.currency === 'USD'
  if (isUsd) {
    if (!isNumberPresent(current.priceUsd)) update.priceUsd = priceSource.price as number
  } else {
    if (!isNumberPresent(current.priceJpy)) update.priceJpy = priceSource.price as number
  }
  return update
}

/**
 * Pure mapping from a document's legacy (per-locale + price/currency) field values to the
 * new paired fields, writing a target field only when it's currently blank (per-field
 * idempotency — see data-model.md's Migration mapping table). Returns only the fields that
 * need updating; an empty object means the document is already fully migrated.
 */
export function mapLegacyVehicleFields(
  legacy: VehicleLegacySource,
  current: VehicleCurrentFields,
): Partial<VehicleCurrentFields> {
  const update: Partial<VehicleCurrentFields> = {}

  const title = mapTextField(current.titleJa, current.titleEn, legacy.ja.title, legacy.en.title)
  if (title.ja !== undefined) update.titleJa = title.ja
  if (title.en !== undefined) update.titleEn = title.en

  const exteriorColor = mapTextField(
    current.exteriorColorJa,
    current.exteriorColorEn,
    legacy.ja.exteriorColor,
    legacy.en.exteriorColor,
  )
  if (exteriorColor.ja !== undefined) update.exteriorColorJa = exteriorColor.ja
  if (exteriorColor.en !== undefined) update.exteriorColorEn = exteriorColor.en

  const summary = mapTextField(current.summaryJa, current.summaryEn, legacy.ja.summary, legacy.en.summary)
  if (summary.ja !== undefined) update.summaryJa = summary.ja
  if (summary.en !== undefined) update.summaryEn = summary.en

  const description = mapRichTextField(
    current.descriptionJa,
    current.descriptionEn,
    legacy.ja.description,
    legacy.en.description,
  )
  if (description.ja !== undefined) update.descriptionJa = description.ja
  if (description.en !== undefined) update.descriptionEn = description.en

  const seoTitle = mapTextField(current.seoTitleJa, current.seoTitleEn, legacy.ja.seoTitle, legacy.en.seoTitle)
  if (seoTitle.ja !== undefined) update.seoTitleJa = seoTitle.ja
  if (seoTitle.en !== undefined) update.seoTitleEn = seoTitle.en

  const seoDescription = mapTextField(
    current.seoDescriptionJa,
    current.seoDescriptionEn,
    legacy.ja.seoDescription,
    legacy.en.seoDescription,
  )
  if (seoDescription.ja !== undefined) update.seoDescriptionJa = seoDescription.ja
  if (seoDescription.en !== undefined) update.seoDescriptionEn = seoDescription.en

  const rowCount = Math.max(
    current.highlights?.length ?? 0,
    legacy.ja.highlights?.length ?? 0,
    legacy.en.highlights?.length ?? 0,
  )
  if (rowCount > 0) {
    let highlightsChanged = current.highlights?.length !== rowCount
    const highlights = Array.from({ length: rowCount }, (_, i) => {
      const currentRow = current.highlights?.[i] ?? {}
      const text = mapTextField(
        currentRow.textJa,
        currentRow.textEn,
        legacy.ja.highlights?.[i]?.text,
        legacy.en.highlights?.[i]?.text,
      )
      if (text.ja !== undefined || text.en !== undefined) highlightsChanged = true
      return {
        textJa: text.ja !== undefined ? text.ja : currentRow.textJa,
        textEn: text.en !== undefined ? text.en : currentRow.textEn,
      }
    })
    if (highlightsChanged) update.highlights = highlights
  }

  const specRowCount = Math.max(current.specs?.length ?? 0, legacy.ja.specs?.length ?? 0, legacy.en.specs?.length ?? 0)
  if (specRowCount > 0) {
    let specsChanged = current.specs?.length !== specRowCount
    const specs = Array.from({ length: specRowCount }, (_, i) => {
      const currentRow = current.specs?.[i] ?? {}
      const label = mapTextField(
        currentRow.labelJa,
        currentRow.labelEn,
        legacy.ja.specs?.[i]?.label,
        legacy.en.specs?.[i]?.label,
      )
      const value = mapTextField(
        currentRow.valueJa,
        currentRow.valueEn,
        legacy.ja.specs?.[i]?.value,
        legacy.en.specs?.[i]?.value,
      )
      if (label.ja !== undefined || label.en !== undefined || value.ja !== undefined || value.en !== undefined) {
        specsChanged = true
      }
      return {
        labelJa: label.ja !== undefined ? label.ja : currentRow.labelJa,
        labelEn: label.en !== undefined ? label.en : currentRow.labelEn,
        valueJa: value.ja !== undefined ? value.ja : currentRow.valueJa,
        valueEn: value.en !== undefined ? value.en : currentRow.valueEn,
      }
    })
    if (specsChanged) update.specs = specs
  }

  const price = mapPriceFields(current, legacy.priceSource)
  if (price.priceJpy !== undefined) update.priceJpy = price.priceJpy
  if (price.priceUsd !== undefined) update.priceUsd = price.priceUsd

  if (typeof current.priceOnRequest !== 'boolean' && typeof legacy.priceSource.priceOnRequest === 'boolean') {
    update.priceOnRequest = legacy.priceSource.priceOnRequest
  }

  return update
}
