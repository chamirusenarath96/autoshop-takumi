import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { VehicleFilters } from '@/components/vehicles/VehicleFilters'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function VehiclesPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const t = await getTranslations('vehicles')
  const payload = await getPayload()

  // Build filter query from search params
  const where: Record<string, any> = {
    status: { in: ['available', 'reserved', 'sold'] },
  }
  if (sp.make) where.make = { equals: sp.make }
  if (sp.model) where.model = { equals: sp.model }
  if (sp.bodyType) where.bodyType = { equals: sp.bodyType }
  if (sp.transmission) where.transmission = { equals: sp.transmission }
  if (sp.yearFrom || sp.yearTo) {
    where.year = {}
    if (sp.yearFrom) where.year.greater_than_equal = parseInt(sp.yearFrom)
    if (sp.yearTo) where.year.less_than_equal = parseInt(sp.yearTo)
  }
  if (sp.priceFrom || sp.priceTo) {
    where.price = {}
    if (sp.priceFrom) where.price.greater_than_equal = parseInt(sp.priceFrom)
    if (sp.priceTo) where.price.less_than_equal = parseInt(sp.priceTo)
  }

  const sortMap: Record<string, string> = {
    newest: '-createdAt',
    priceLow: 'price',
    priceHigh: '-price',
  }
  const sort = sortMap[sp.sort ?? 'newest'] ?? '-createdAt'

  const [vehiclesResult, makesResult, modelsResult] = await Promise.all([
    payload.find({
      collection: 'vehicles',
      where,
      sort,
      limit: 24,
      locale: locale as 'ja' | 'en',
    }),
    payload.find({ collection: 'makes', limit: 100, locale: locale as 'ja' | 'en' }),
    payload.find({ collection: 'models', limit: 200, locale: locale as 'ja' | 'en' }),
  ])

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 shrink-0">
          <VehicleFilters
            makes={makesResult.docs}
            models={modelsResult.docs}
            currentFilters={sp}
            locale={locale}
          />
        </aside>
        <div className="flex-1">
          {vehiclesResult.docs.length === 0 ? (
            <p className="text-[hsl(var(--muted-foreground))] py-12 text-center">{t('noResults')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehiclesResult.docs.map((vehicle: any) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
