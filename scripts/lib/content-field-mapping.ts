import { isRichTextPresent, isTextPresent } from '@/lib/content-locale'
import type { SerializedEditorState } from 'lexical'

type RichTextValue = SerializedEditorState | null | undefined

/**
 * Per-locale legacy field values, read via Payload's Local API with `fallbackLocale: false`
 * (payload.config.ts sets `fallback: true`, so omitting this would let a blank `en` value
 * silently resolve to the `ja` value — see data-model.md's Migration mapping section).
 */
export type LegacyLocaleValues = {
  ja: Record<string, unknown>
  en: Record<string, unknown>
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

// ── Makes / Models (identical shape — a single legacy `name` field) ────────

export type NamedLegacySource = { ja: { name?: string | null }; en: { name?: string | null } }
export type NamedCurrentFields = { nameJa?: string | null; nameEn?: string | null }

/** Shared mapping for Makes and Models — both migrate a single legacy `name` field. */
export function mapLegacyNamedFields(
  legacy: NamedLegacySource,
  current: NamedCurrentFields,
): Partial<NamedCurrentFields> {
  const update: Partial<NamedCurrentFields> = {}
  const name = mapTextField(current.nameJa, current.nameEn, legacy.ja.name, legacy.en.name)
  if (name.ja !== undefined) update.nameJa = name.ja
  if (name.en !== undefined) update.nameEn = name.en
  return update
}

// ── Media ────────────────────────────────────────────────────────────────

export type MediaLegacySource = { ja: { alt?: string | null }; en: { alt?: string | null } }
export type MediaCurrentFields = { altJa?: string | null; altEn?: string | null }

export function mapLegacyMediaFields(
  legacy: MediaLegacySource,
  current: MediaCurrentFields,
): Partial<MediaCurrentFields> {
  const update: Partial<MediaCurrentFields> = {}
  const alt = mapTextField(current.altJa, current.altEn, legacy.ja.alt, legacy.en.alt)
  if (alt.ja !== undefined) update.altJa = alt.ja
  if (alt.en !== undefined) update.altEn = alt.en
  return update
}

// ── SiteSettings ─────────────────────────────────────────────────────────

export type SiteSettingsLegacyLocaleValues = {
  shopName?: string | null
  address?: string | null
  defaultSeoTitle?: string | null
  defaultSeoDescription?: string | null
}
export type SiteSettingsLegacySource = { ja: SiteSettingsLegacyLocaleValues; en: SiteSettingsLegacyLocaleValues }
export type SiteSettingsCurrentFields = {
  shopNameJa?: string | null
  shopNameEn?: string | null
  addressJa?: string | null
  addressEn?: string | null
  defaultSeoTitleJa?: string | null
  defaultSeoTitleEn?: string | null
  defaultSeoDescriptionJa?: string | null
  defaultSeoDescriptionEn?: string | null
}

export function mapLegacySiteSettingsFields(
  legacy: SiteSettingsLegacySource,
  current: SiteSettingsCurrentFields,
): Partial<SiteSettingsCurrentFields> {
  const update: Partial<SiteSettingsCurrentFields> = {}

  const shopName = mapTextField(current.shopNameJa, current.shopNameEn, legacy.ja.shopName, legacy.en.shopName)
  if (shopName.ja !== undefined) update.shopNameJa = shopName.ja
  if (shopName.en !== undefined) update.shopNameEn = shopName.en

  const address = mapTextField(current.addressJa, current.addressEn, legacy.ja.address, legacy.en.address)
  if (address.ja !== undefined) update.addressJa = address.ja
  if (address.en !== undefined) update.addressEn = address.en

  const seoTitle = mapTextField(
    current.defaultSeoTitleJa,
    current.defaultSeoTitleEn,
    legacy.ja.defaultSeoTitle,
    legacy.en.defaultSeoTitle,
  )
  if (seoTitle.ja !== undefined) update.defaultSeoTitleJa = seoTitle.ja
  if (seoTitle.en !== undefined) update.defaultSeoTitleEn = seoTitle.en

  const seoDescription = mapTextField(
    current.defaultSeoDescriptionJa,
    current.defaultSeoDescriptionEn,
    legacy.ja.defaultSeoDescription,
    legacy.en.defaultSeoDescription,
  )
  if (seoDescription.ja !== undefined) update.defaultSeoDescriptionJa = seoDescription.ja
  if (seoDescription.en !== undefined) update.defaultSeoDescriptionEn = seoDescription.en

  return update
}

// ── Homepage ─────────────────────────────────────────────────────────────

export type HomepageLegacyLocaleValues = {
  heroHeading?: string | null
  heroSubheading?: string | null
  aboutBlurb?: RichTextValue
  whyUsPoints?: Array<{ heading?: string | null; body?: string | null }>
  contactSummary?: RichTextValue
}
export type HomepageLegacySource = { ja: HomepageLegacyLocaleValues; en: HomepageLegacyLocaleValues }
export type HomepageCurrentFields = {
  heroHeadingJa?: string | null
  heroHeadingEn?: string | null
  heroSubheadingJa?: string | null
  heroSubheadingEn?: string | null
  aboutBlurbJa?: RichTextValue
  aboutBlurbEn?: RichTextValue
  whyUsPoints?: Array<{ headingJa?: string | null; headingEn?: string | null; bodyJa?: string | null; bodyEn?: string | null }>
  contactSummaryJa?: RichTextValue
  contactSummaryEn?: RichTextValue
}

export function mapLegacyHomepageFields(
  legacy: HomepageLegacySource,
  current: HomepageCurrentFields,
): Partial<HomepageCurrentFields> {
  const update: Partial<HomepageCurrentFields> = {}

  const heroHeading = mapTextField(
    current.heroHeadingJa,
    current.heroHeadingEn,
    legacy.ja.heroHeading,
    legacy.en.heroHeading,
  )
  if (heroHeading.ja !== undefined) update.heroHeadingJa = heroHeading.ja
  if (heroHeading.en !== undefined) update.heroHeadingEn = heroHeading.en

  const heroSubheading = mapTextField(
    current.heroSubheadingJa,
    current.heroSubheadingEn,
    legacy.ja.heroSubheading,
    legacy.en.heroSubheading,
  )
  if (heroSubheading.ja !== undefined) update.heroSubheadingJa = heroSubheading.ja
  if (heroSubheading.en !== undefined) update.heroSubheadingEn = heroSubheading.en

  const aboutBlurb = mapRichTextField(
    current.aboutBlurbJa,
    current.aboutBlurbEn,
    legacy.ja.aboutBlurb,
    legacy.en.aboutBlurb,
  )
  if (aboutBlurb.ja !== undefined) update.aboutBlurbJa = aboutBlurb.ja
  if (aboutBlurb.en !== undefined) update.aboutBlurbEn = aboutBlurb.en

  const contactSummary = mapRichTextField(
    current.contactSummaryJa,
    current.contactSummaryEn,
    legacy.ja.contactSummary,
    legacy.en.contactSummary,
  )
  if (contactSummary.ja !== undefined) update.contactSummaryJa = contactSummary.ja
  if (contactSummary.en !== undefined) update.contactSummaryEn = contactSummary.en

  const rowCount = Math.max(
    current.whyUsPoints?.length ?? 0,
    legacy.ja.whyUsPoints?.length ?? 0,
    legacy.en.whyUsPoints?.length ?? 0,
  )
  if (rowCount > 0) {
    let whyUsPointsChanged = current.whyUsPoints?.length !== rowCount
    const whyUsPoints = Array.from({ length: rowCount }, (_, i) => {
      const currentRow = current.whyUsPoints?.[i] ?? {}
      const heading = mapTextField(
        currentRow.headingJa,
        currentRow.headingEn,
        legacy.ja.whyUsPoints?.[i]?.heading,
        legacy.en.whyUsPoints?.[i]?.heading,
      )
      const body = mapTextField(
        currentRow.bodyJa,
        currentRow.bodyEn,
        legacy.ja.whyUsPoints?.[i]?.body,
        legacy.en.whyUsPoints?.[i]?.body,
      )
      if (heading.ja !== undefined || heading.en !== undefined || body.ja !== undefined || body.en !== undefined) {
        whyUsPointsChanged = true
      }
      return {
        headingJa: heading.ja !== undefined ? heading.ja : currentRow.headingJa,
        headingEn: heading.en !== undefined ? heading.en : currentRow.headingEn,
        bodyJa: body.ja !== undefined ? body.ja : currentRow.bodyJa,
        bodyEn: body.en !== undefined ? body.en : currentRow.bodyEn,
      }
    })
    if (whyUsPointsChanged) update.whyUsPoints = whyUsPoints
  }

  return update
}
