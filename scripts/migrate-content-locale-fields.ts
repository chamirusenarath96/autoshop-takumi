import { getPayload } from '../src/lib/payload'
import {
  mapLegacyNamedFields,
  mapLegacyMediaFields,
  mapLegacySiteSettingsFields,
  mapLegacyHomepageFields,
} from './lib/content-field-mapping'

const PAGE_SIZE = 100

/**
 * One-time migration: copies Makes/Models/Media/SiteSettings/Homepage's legacy `localized: true`
 * field values into their new paired (`*Ja`/`*En`) fields, per
 * specs/003-remove-payload-localization/data-model.md. Every legacy read passes
 * `fallbackLocale: false` — payload.config.ts sets `fallback: true`, so omitting this would let a
 * genuinely-blank `en` value silently resolve to the `ja` value, fabricating content (spec FR-014).
 * Idempotent per target field (data-model.md) — safe to re-run.
 */

async function migrateNamedCollection(collection: 'makes' | 'models') {
  const payload = await getPayload()
  let page = 1
  let migratedCount = 0
  let totalDocs = 0

  while (true) {
    const result = await payload.find({
      collection,
      locale: 'ja',
      fallbackLocale: false,
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })
    totalDocs = result.totalDocs

    for (const docJa of result.docs as any[]) {
      const docEn = await payload.findByID({
        collection,
        id: docJa.id,
        locale: 'en',
        fallbackLocale: false,
        depth: 0,
        overrideAccess: true,
      })

      const update = mapLegacyNamedFields(
        { ja: { name: docJa.name }, en: { name: docEn.name } },
        { nameJa: docJa.nameJa, nameEn: docJa.nameEn },
      )
      if (Object.keys(update).length > 0) {
        await payload.update({ collection, id: docJa.id, data: update, overrideAccess: true })
        migratedCount++
      }
    }

    if (!result.hasNextPage) break
    page++
  }

  console.log(`✓ ${collection}: ${migratedCount} of ${totalDocs} document(s) updated.`)
}

async function migrateMedia() {
  const payload = await getPayload()
  let page = 1
  let migratedCount = 0
  let totalDocs = 0

  while (true) {
    const result = await payload.find({
      collection: 'media',
      locale: 'ja',
      fallbackLocale: false,
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })
    totalDocs = result.totalDocs

    for (const docJa of result.docs as any[]) {
      const docEn = await payload.findByID({
        collection: 'media',
        id: docJa.id,
        locale: 'en',
        fallbackLocale: false,
        depth: 0,
        overrideAccess: true,
      })

      const update = mapLegacyMediaFields(
        { ja: { alt: docJa.alt }, en: { alt: docEn.alt } },
        { altJa: docJa.altJa, altEn: docJa.altEn },
      )
      if (Object.keys(update).length > 0) {
        await payload.update({ collection: 'media', id: docJa.id, data: update, overrideAccess: true })
        migratedCount++
      }
    }

    if (!result.hasNextPage) break
    page++
  }

  console.log(`✓ media: ${migratedCount} of ${totalDocs} document(s) updated.`)
}

async function migrateSiteSettings() {
  const payload = await getPayload()
  const ja = await payload.findGlobal({ slug: 'site-settings', locale: 'ja', fallbackLocale: false, depth: 0, overrideAccess: true })
  const en = await payload.findGlobal({ slug: 'site-settings', locale: 'en', fallbackLocale: false, depth: 0, overrideAccess: true })

  const update = mapLegacySiteSettingsFields(
    {
      ja: {
        shopName: (ja as any).shopName,
        address: (ja as any).address,
        defaultSeoTitle: (ja as any).defaultSeoTitle,
        defaultSeoDescription: (ja as any).defaultSeoDescription,
      },
      en: {
        shopName: (en as any).shopName,
        address: (en as any).address,
        defaultSeoTitle: (en as any).defaultSeoTitle,
        defaultSeoDescription: (en as any).defaultSeoDescription,
      },
    },
    {
      shopNameJa: (ja as any).shopNameJa,
      shopNameEn: (ja as any).shopNameEn,
      addressJa: (ja as any).addressJa,
      addressEn: (ja as any).addressEn,
      defaultSeoTitleJa: (ja as any).defaultSeoTitleJa,
      defaultSeoTitleEn: (ja as any).defaultSeoTitleEn,
      defaultSeoDescriptionJa: (ja as any).defaultSeoDescriptionJa,
      defaultSeoDescriptionEn: (ja as any).defaultSeoDescriptionEn,
    },
  )

  if (Object.keys(update).length > 0) {
    await payload.updateGlobal({ slug: 'site-settings', data: update, overrideAccess: true })
    console.log(`✓ site-settings: updated (${Object.keys(update).join(', ')}).`)
  } else {
    console.log('✓ site-settings: already fully migrated, no changes.')
  }
}

async function migrateHomepage() {
  const payload = await getPayload()
  const ja = await payload.findGlobal({ slug: 'homepage', locale: 'ja', fallbackLocale: false, depth: 0, overrideAccess: true })
  const en = await payload.findGlobal({ slug: 'homepage', locale: 'en', fallbackLocale: false, depth: 0, overrideAccess: true })

  const update = mapLegacyHomepageFields(
    {
      ja: {
        heroHeading: (ja as any).heroHeading,
        heroSubheading: (ja as any).heroSubheading,
        aboutBlurb: (ja as any).aboutBlurb,
        whyUsPoints: (ja as any).whyUsPoints,
        contactSummary: (ja as any).contactSummary,
      },
      en: {
        heroHeading: (en as any).heroHeading,
        heroSubheading: (en as any).heroSubheading,
        aboutBlurb: (en as any).aboutBlurb,
        whyUsPoints: (en as any).whyUsPoints,
        contactSummary: (en as any).contactSummary,
      },
    },
    {
      heroHeadingJa: (ja as any).heroHeadingJa,
      heroHeadingEn: (ja as any).heroHeadingEn,
      heroSubheadingJa: (ja as any).heroSubheadingJa,
      heroSubheadingEn: (ja as any).heroSubheadingEn,
      aboutBlurbJa: (ja as any).aboutBlurbJa,
      aboutBlurbEn: (ja as any).aboutBlurbEn,
      whyUsPoints: (ja as any).whyUsPoints,
      contactSummaryJa: (ja as any).contactSummaryJa,
      contactSummaryEn: (ja as any).contactSummaryEn,
    },
  )

  if (Object.keys(update).length > 0) {
    await payload.updateGlobal({ slug: 'homepage', data: update, overrideAccess: true })
    console.log(`✓ homepage: updated (${Object.keys(update).join(', ')}).`)
  } else {
    console.log('✓ homepage: already fully migrated, no changes.')
  }
}

async function migrate() {
  await migrateNamedCollection('makes')
  await migrateNamedCollection('models')
  await migrateMedia()
  await migrateSiteSettings()
  await migrateHomepage()
  console.log('✓ Migration complete.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
