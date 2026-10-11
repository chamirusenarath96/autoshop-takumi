import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { getPayload } from '@/lib/payload'
import { resolveLocalizedField } from '@/lib/content-locale'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, JAPAN_STORE_URL, MAP_URL } from '@/lib/shop-links'
import { HeroCarousel, type HeroSlide } from '@/components/home/HeroCarousel'
import { VehicleCard } from '@/components/vehicles/VehicleCard'
import { VehicleScroller } from '@/components/home/VehicleScroller'
import { InstagramIcon } from '@/components/layout/InstagramIcon'
import { Link } from '@/components/layout/Link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  params: Promise<{ locale: string }>
}

// Landing copy lives in src/messages/{ja,en}.json. Only the hero/shop photos (Homepage
// global) and the vehicles come from the CMS; the page re-renders at most once a minute.
export const revalidate = 60

type MediaDoc = { url?: string | null; altJa?: string | null; altEn?: string | null }

function toSlide(row: any, locale: 'ja' | 'en', fallbackAlt: string): HeroSlide | null {
  const media = row?.image as MediaDoc | null
  if (!media?.url) return null
  return { url: media.url, alt: resolveLocalizedField(media.altJa, media.altEn, locale) || fallbackAlt }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const activeLocale = locale as 'ja' | 'en'
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tLanding = await getTranslations({ locale, namespace: 'landing' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })
  const tVehicle = await getTranslations({ locale, namespace: 'vehicle' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })

  // A CMS read failure (e.g. the DB not yet migrated) must degrade to a photo-less page,
  // not a 500 — the copy and links above don't depend on it.
  let heroSlides: HeroSlide[] = []
  let shopPhotos: HeroSlide[] = []
  let vehicles: any[] = []
  try {
    const payload = await getPayload()
    const [homepage, latest] = await Promise.all([
      payload.findGlobal({ slug: 'homepage', locale: activeLocale }),
      payload.find({
        collection: 'vehicles',
        where: { status: { equals: 'available' } },
        sort: '-createdAt',
        limit: 8,
        locale: activeLocale,
      }),
    ])
    heroSlides = ((homepage.heroSlides as any[]) ?? []).map((r) => toSlide(r, activeLocale, tShop('name'))).filter((s): s is HeroSlide => !!s)
    shopPhotos = ((homepage.shopPhotos as any[]) ?? []).map((r) => toSlide(r, activeLocale, tShop('name'))).filter((s): s is HeroSlide => !!s)
    vehicles = latest.docs
  } catch (error) {
    console.error('Landing page CMS read failed:', error)
  }

  return (
    <div>
      <HeroCarousel slides={heroSlides}>
        <div className="flex max-w-xl flex-col items-start gap-4 text-white">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('heading')}</h1>
          <p className="text-lg text-white/80">{t('subheading')}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90" asChild>
              <Link href={`/${locale}/vehicles`}>{t('ctaPrimary')}</Link>
            </Button>
            {JAPAN_STORE_URL && (
              <Button size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
                <a href={JAPAN_STORE_URL} target="_blank" rel="noopener noreferrer">
                  {tNav('japanStore')}
                  <ExternalLink />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" className="border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white" asChild>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                {tNav('instagram')}
              </a>
            </Button>
          </div>
        </div>
      </HeroCarousel>

      {vehicles.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">{tLanding('latestHeading')}</h2>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/vehicles`}>{tLanding('viewAll')}</Link>
            </Button>
          </div>
          <VehicleScroller label={tLanding('latestHeading')}>
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} locale={locale} priceOnRequestLabel={tVehicle('priceOnRequest')} compact />
            ))}
          </VehicleScroller>
        </section>
      )}

      {shopPhotos.length > 0 && (
        <section className="container mx-auto px-4 pt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">{tLanding('shopHeading')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {shopPhotos.map((photo) => (
              <div key={photo.url} className="aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                <img src={photo.url} alt={photo.alt} loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12 bg-hero-overlay py-10 text-white">
        <div className="container mx-auto flex flex-col items-start gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{tLanding('instagramHeading')}</h2>
            <p className="text-white/70">
              {INSTAGRAM_HANDLE} — {tLanding('instagramBody')}
            </p>
          </div>
          <Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90" asChild>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <InstagramIcon />
              {tLanding('instagramButton')}
            </a>
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-12">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{tLanding('contactHeading')}</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Mail className="size-4" />
                {tLanding('emailLabel')}
              </CardDescription>
              <CardTitle className="text-base break-all">{tShop('email')}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Phone className="size-4" />
                {tLanding('phoneLabel')}
              </CardDescription>
              <CardTitle className="text-base">{tShop('phone')}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="size-4" />
                {tLanding('visitLabel')}
              </CardDescription>
              <CardTitle className="text-base font-medium leading-snug">{tShop('address')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
              <p>{tShop('hours')}</p>
              {MAP_URL && (
                <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-4">
                  {tLanding('viewMap')}
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
