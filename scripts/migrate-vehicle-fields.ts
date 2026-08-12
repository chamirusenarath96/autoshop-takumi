import { getPayload } from '../src/lib/payload'
import { mapLegacyVehicleFields, type VehicleCurrentFields, type VehicleLegacySource } from './lib/vehicle-field-mapping'

const PAGE_SIZE = 100

async function migrate() {
  const payload = await getPayload()

  let page = 1
  let migratedCount = 0
  let totalDocs = 0

  // Paginate through the full collection — payload.find() defaults to 10 results per page.
  while (true) {
    const result = await payload.find({
      collection: 'vehicles',
      locale: 'ja',
      limit: PAGE_SIZE,
      page,
      depth: 0,
      overrideAccess: true,
    })
    totalDocs = result.totalDocs

    for (const docJa of result.docs as any[]) {
      const docEn = await payload.findByID({
        collection: 'vehicles',
        id: docJa.id,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
      })

      const legacy: VehicleLegacySource = {
        ja: {
          title: docJa.title,
          exteriorColor: docJa.exteriorColor,
          summary: docJa.summary,
          description: docJa.description,
          seoTitle: docJa.seoTitle,
          seoDescription: docJa.seoDescription,
          highlights: docJa.highlights,
          specs: docJa.specs,
        },
        en: {
          title: docEn.title,
          exteriorColor: docEn.exteriorColor,
          summary: docEn.summary,
          description: docEn.description,
          seoTitle: docEn.seoTitle,
          seoDescription: docEn.seoDescription,
          highlights: docEn.highlights,
          specs: docEn.specs,
        },
        priceSource: {
          price: docJa.price,
          currency: docJa.currency,
          priceOnRequest: docJa.priceOnRequest,
        },
      }

      // New fields aren't localized, so docJa already reflects their current (possibly
      // partially-migrated) state regardless of which locale was used to read the document.
      const current: VehicleCurrentFields = {
        titleJa: docJa.titleJa,
        titleEn: docJa.titleEn,
        exteriorColorJa: docJa.exteriorColorJa,
        exteriorColorEn: docJa.exteriorColorEn,
        summaryJa: docJa.summaryJa,
        summaryEn: docJa.summaryEn,
        descriptionJa: docJa.descriptionJa,
        descriptionEn: docJa.descriptionEn,
        seoTitleJa: docJa.seoTitleJa,
        seoTitleEn: docJa.seoTitleEn,
        seoDescriptionJa: docJa.seoDescriptionJa,
        seoDescriptionEn: docJa.seoDescriptionEn,
        highlights: docJa.highlights,
        specs: docJa.specs,
        priceJpy: docJa.priceJpy,
        priceUsd: docJa.priceUsd,
        priceOnRequest: docJa.priceOnRequest,
      }

      const update = mapLegacyVehicleFields(legacy, current)
      if (Object.keys(update).length > 0) {
        await payload.update({
          collection: 'vehicles',
          id: docJa.id,
          data: update,
          overrideAccess: true,
        })
        migratedCount++
      }
    }

    if (!result.hasNextPage) break
    page++
  }

  console.log(`✓ Migration complete. ${migratedCount} of ${totalDocs} vehicle(s) updated.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error(err)
  process.exit(1)
})
