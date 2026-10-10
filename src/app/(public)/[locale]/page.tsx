import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { getSiteSettings } from '@/lib/site-settings'
import { resolveLocalizedField } from '@/lib/content-locale'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { Link } from '@/components/layout/Link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  const activeLocale = locale as 'ja' | 'en'
  const t = await getTranslations('hero')
  const tHome = await getTranslations('homepage')
  const tVehicle = await getTranslations('vehicle')
  const payload = await getPayload()

  // `locale` is still passed to findGlobal — required for heroStats/services/steps/
  // ctaBanner, which remain localized: true. It has no effect on heroHeadingJa/En,
  // heroSubheadingJa/En, or whyUsPoints[].headingJa/En/bodyJa/En below.
  const [homepage, siteSettings] = await Promise.all([
    payload.findGlobal({ slug: 'homepage', locale: activeLocale }),
    getSiteSettings(activeLocale),
  ])

  const heroHeading = resolveLocalizedField(homepage.heroHeadingJa as string, homepage.heroHeadingEn as string, activeLocale)
  const heroSubheading = resolveLocalizedField(
    homepage.heroSubheadingJa as string,
    homepage.heroSubheadingEn as string,
    activeLocale,
  )

  let featuredVehicles: any[] = []
  if (homepage.featuredVehicles && (homepage.featuredVehicles as any[]).length > 0) {
    featuredVehicles = homepage.featuredVehicles as any[]
  } else {
    const result = await payload.find({
      collection: 'vehicles',
      where: { status: { equals: 'available' } },
      sort: '-createdAt',
      limit: 6,
      locale: activeLocale,
    })
    featuredVehicles = result.docs
  }

  const heroImageUrl = (homepage.heroImage as any)?.url as string | undefined
  const heroStats = (homepage.heroStats as any[]) ?? []
  const whyUsPoints = (homepage.whyUsPoints as any[]) ?? []
  const services = (homepage.services as any[]) ?? []
  const steps = (homepage.steps as any[]) ?? []
  const ctaBanner = (homepage.ctaBanner as any) ?? {}

  return (
    <div>
      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto grid items-center gap-8 px-4 py-12 md:py-20 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-4">
            {siteSettings.shopName && <Badge variant="secondary">{siteSettings.shopName}</Badge>}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{heroHeading || t('cta')}</h1>
            {heroSubheading && <p className="text-lg text-muted-foreground">{heroSubheading}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="lg" asChild>
                <Link href={`/${locale}/vehicles`}>{t('ctaPrimary')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#contact">{t('ctaSecondary')}</a>
              </Button>
            </div>
          </div>
          {heroImageUrl && (
            <div className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
              <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      {/* Stats */}
      {heroStats.length > 0 && (
        <section className="container mx-auto grid grid-cols-2 gap-4 px-4 pt-12 md:grid-cols-4">
          {heroStats.map((stat: any, i: number) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
                <CardDescription>{stat.label}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>
      )}

      {/* Featured vehicles */}
      {featuredVehicles.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">{tHome('featuredHeading')}</h2>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/vehicles`}>{tHome('viewAllVehicles')}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredVehicles.map((vehicle: any) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                locale={locale}
                priceOnRequestLabel={tVehicle('priceOnRequest')}
              />
            ))}
          </div>
        </section>
      )}

      {/* Why us */}
      {whyUsPoints.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{tHome('whyUsHeading')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {whyUsPoints.map((point: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{resolveLocalizedField(point.headingJa, point.headingEn, activeLocale)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {resolveLocalizedField(point.bodyJa, point.bodyEn, activeLocale)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{tHome('servicesHeading')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  {service.description && <CardDescription>{service.description}</CardDescription>}
                </CardHeader>
                {service.priceFrom && (
                  <CardContent>
                    <Badge variant="outline">{service.priceFrom}</Badge>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      {steps.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{tHome('stepsHeading')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {steps.map((step: any, i: number) => (
              <Card key={i}>
                <CardHeader>
                  <Badge className="mb-2">{i + 1}</Badge>
                  <CardTitle>{step.title}</CardTitle>
                  {step.description && <CardDescription>{step.description}</CardDescription>}
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Call to action */}
      {ctaBanner.heading && (
        <section className="container mx-auto px-4 pt-12">
          <Card>
            <CardHeader className="items-center text-center">
              <CardTitle className="text-2xl">{ctaBanner.heading}</CardTitle>
              {ctaBanner.body && <CardDescription>{ctaBanner.body}</CardDescription>}
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" asChild>
                <Link href={`/${locale}/vehicles`}>{ctaBanner.buttonText || t('ctaPrimary')}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}
