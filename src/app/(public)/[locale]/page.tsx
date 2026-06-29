import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { Link } from '@/components/layout/Link'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('hero')
  const payload = await getPayload()

  // Fetch homepage global
  const homepage = await payload.findGlobal({
    slug: 'homepage',
    locale: locale as 'ja' | 'en',
  })

  // Fetch featured vehicles (manual picks or newest 6)
  let featuredVehicles: any[] = []
  if (homepage.featuredVehicles && (homepage.featuredVehicles as any[]).length > 0) {
    featuredVehicles = homepage.featuredVehicles as any[]
  } else {
    const result = await payload.find({
      collection: 'vehicles',
      where: { status: { equals: 'available' } },
      sort: '-createdAt',
      limit: 6,
      locale: locale as 'ja' | 'en',
    })
    featuredVehicles = result.docs
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[hsl(var(--secondary))] text-white min-h-[60vh] flex items-center">
        {homepage.heroImage && (
          <img
            src={(homepage.heroImage as any).url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-4">{homepage.heroHeading}</h1>
          <p className="text-xl mb-8 text-gray-200">{homepage.heroSubheading}</p>
          <Link
            href={`/${locale}/vehicles`}
            className="inline-block bg-[hsl(var(--primary))] text-white px-8 py-3 rounded font-semibold hover:opacity-90 transition"
          >
            {t('cta')}
          </Link>
        </div>
      </section>

      {/* Featured vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-8">
            {locale === 'ja' ? 'おすすめ車両' : 'Featured Vehicles'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle: any) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
      {homepage.whyUsPoints && (homepage.whyUsPoints as any[]).length > 0 && (
        <section className="bg-[hsl(var(--muted))] py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10 text-center">
              {locale === 'ja' ? '選ばれる理由' : 'Why Choose Us'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(homepage.whyUsPoints as any[]).map((point: any, i: number) => (
                <div key={i} className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{point.heading}</h3>
                  <p className="text-[hsl(var(--muted-foreground))]">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
