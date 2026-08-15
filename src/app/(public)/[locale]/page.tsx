import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { ServiceCard } from '@/components/homepage/ServiceCard'
import { StepItem } from '@/components/homepage/StepItem'
import { Link } from '@/components/layout/Link'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('hero')
  const tHome = await getTranslations('homepage')
  const payload = await getPayload()

  const homepage = await payload.findGlobal({
    slug: 'homepage',
    locale: locale as 'ja' | 'en',
  })

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

  const heroStats = (homepage.heroStats as any[]) ?? []
  const services = (homepage.services as any[]) ?? []
  const steps = (homepage.steps as any[]) ?? []
  const shopSection = (homepage.shopSection as any) ?? {}
  const ctaBanner = (homepage.ctaBanner as any) ?? {}

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-black text-white min-h-[70vh] flex items-center">
        {homepage.heroImage && (
          <img
            src={(homepage.heroImage as any).url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 w-full">
          <p className="takumi-eyebrow text-primary mb-4">Autoshop Takumi</p>
          <h1 className="takumi-display text-5xl sm:text-6xl mb-4">{homepage.heroHeading}</h1>
          <p className="text-lg sm:text-xl mb-8 text-white/70 max-w-2xl">{homepage.heroSubheading}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/${locale}/vehicles`}
              className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-none bg-primary text-primary-foreground font-medium hover:opacity-90 transition uppercase tracking-wide text-sm"
            >
              {t('ctaPrimary')}
            </Link>
            <Link
              href={`/${locale}/vehicles`}
              className="inline-flex items-center justify-center min-h-11 px-6 py-2.5 rounded-none border border-white/30 text-white font-medium hover:bg-white/10 transition uppercase tracking-wide text-sm"
            >
              {t('ctaSecondary')}
            </Link>
          </div>

          {heroStats.length > 0 && (
            <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/15">
              {heroStats.map((stat: any, i: number) => (
                <div key={i}>
                  <p className="takumi-display text-4xl text-primary">{stat.value}</p>
                  <p className="text-sm text-white/60 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="takumi-eyebrow text-primary mb-2">{tHome('servicesHeading')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {services.map((service: any, i: number) => (
              <ServiceCard key={i} icon={service.icon} name={service.name} description={service.description} priceFrom={service.priceFrom} />
            ))}
          </div>
        </section>
      )}

      {/* Featured vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="takumi-eyebrow text-primary">{tHome('featuredHeading')}</h2>
            <Link href={`/${locale}/vehicles`} className="text-sm font-medium text-primary hover:underline">
              {tHome('viewAllVehicles')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.map((vehicle: any) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Three steps */}
      {steps.length > 0 && (
        <section className="bg-muted py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="takumi-eyebrow text-primary mb-8">{tHome('stepsHeading')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {steps.map((step: any, i: number) => (
                <StepItem key={i} index={i + 1} title={step.title} description={step.description} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shop teaser */}
      {(shopSection.heading || shopSection.image) && (
        <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden order-2 lg:order-1">
            {shopSection.image && (
              <img src={(shopSection.image as any).url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="order-1 lg:order-2">
            <h2 className="takumi-display text-3xl mb-4">{shopSection.heading}</h2>
            <p className="text-muted-foreground mb-6">{shopSection.body}</p>
            {shopSection.linkText && (
              <Link href={`/${locale}/about`} className="text-primary font-medium hover:underline">
                {shopSection.linkText} →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* CTA banner */}
      {ctaBanner.heading && (
        <section className="bg-black text-white py-16 text-center">
          <div className="max-w-2xl mx-auto px-6">
            <h2 className="takumi-display text-3xl sm:text-4xl mb-3">{ctaBanner.heading}</h2>
            <p className="text-white/70 mb-8">{ctaBanner.body}</p>
            <Link
              href={`/${locale}/vehicles`}
              className="inline-flex items-center justify-center min-h-11 px-8 py-2.5 rounded-none bg-primary text-primary-foreground font-medium hover:opacity-90 transition uppercase tracking-wide text-sm"
            >
              {ctaBanner.buttonText}
            </Link>
          </div>
        </section>
      )}

      {/* Why us */}
      {homepage.whyUsPoints && (homepage.whyUsPoints as any[]).length > 0 && (
        <section className="bg-muted py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10 text-center">
              {locale === 'ja' ? '選ばれる理由' : 'Why Choose Us'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(homepage.whyUsPoints as any[]).map((point: any, i: number) => (
                <div key={i} className="text-center">
                  <h3 className="text-xl font-semibold mb-2">{point.heading}</h3>
                  <p className="text-muted-foreground">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
