import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Clock, ExternalLink, Mail, MapPin, Phone } from 'lucide-react'
import { getPayload } from '@/lib/payload'
import { getGalleryPhotos } from '@/lib/gallery'
import { resolveLocalizedField } from '@/lib/content-locale'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, JAPAN_STORE_URL, MAP_URL } from '@/lib/shop-links'
import { HeroCarousel, type HeroSlide } from '@/components/home/HeroCarousel'
import { InstagramIcon } from '@/components/layout/InstagramIcon'
import { Link } from '@/components/layout/Link'
import { Button } from '@/components/ui/button'

type Props = {
  params: Promise<{ locale: string }>
}

// Landing copy lives in src/messages/{ja,en}.json. Only the hero photos (Homepage global)
// and the gallery photos (Gallery global) come from the CMS; the page re-renders at most
// once a minute.
export const revalidate = 60

type MediaDoc = { url?: string | null; altJa?: string | null; altEn?: string | null }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const activeLocale = locale as 'ja' | 'en'
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tLanding = await getTranslations({ locale, namespace: 'landing' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const services = tLanding.raw('services') as { title: string; body: string }[]

  // A CMS read failure (e.g. the DB not yet migrated) must degrade to a photo-less page,
  // not a 500 — the copy and links don't depend on it.
  let heroSlides: HeroSlide[] = []
  try {
    const payload = await getPayload()
    const homepage = await payload.findGlobal({ slug: 'homepage', locale: activeLocale })
    heroSlides = ((homepage.heroSlides as any[]) ?? [])
      .map((row) => {
        const media = row?.image as MediaDoc | null
        if (!media?.url) return null
        return { url: media.url, alt: resolveLocalizedField(media.altJa, media.altEn, activeLocale) || tShop('name') }
      })
      .filter((s): s is HeroSlide => !!s)
  } catch (error) {
    console.error('Landing page CMS read failed:', error)
  }
  const proofPhotos = (await getGalleryPhotos(activeLocale)).slice(0, 5)

  const directionsUrl = MAP_URL || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tShop('address'))}`
  const onBrand = 'border-brand-foreground/40 bg-transparent text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground'

  return (
    <div>
      <HeroCarousel slides={heroSlides}>
        <div className="flex flex-col items-start gap-4 bg-brand p-6 text-brand-foreground md:max-w-xl md:p-10">
          <h1 className="text-3xl leading-[1.1] font-extrabold tracking-tight uppercase sm:text-4xl md:text-5xl">{t('heading')}</h1>
          <p className="text-lg font-medium">{t('subheading')}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" className="bg-hero-overlay text-white hover:bg-hero-overlay/90" asChild>
              <Link href={`/${locale}/gallery`}>{t('ctaPrimary')}</Link>
            </Button>
            <Button size="lg" variant="outline" className={onBrand} asChild>
              <a href="#find-us">{t('ctaSecondary')}</a>
            </Button>
            {JAPAN_STORE_URL && (
              <Button size="lg" variant="outline" className={onBrand} asChild>
                <a href={JAPAN_STORE_URL} target="_blank" rel="noopener noreferrer">
                  {tNav('japanStore')}
                  <ExternalLink />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" className={onBrand} asChild>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                <InstagramIcon />
                {tNav('instagram')}
              </a>
            </Button>
          </div>
        </div>
      </HeroCarousel>

      <section className="container mx-auto px-4 pt-14">
        <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted-foreground uppercase">{tLanding('servicesHeading')}</h2>
        <ol>
          {services.map((service, i) => (
            <li key={service.title} className="flex flex-col gap-1 border-b py-5 first:border-t md:flex-row md:items-baseline md:gap-8">
              <span className="text-3xl font-extrabold text-brand tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="text-xl font-semibold md:w-72">{service.title}</h3>
              <p className="text-muted-foreground md:flex-1">{service.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {proofPhotos.length > 0 && (
        <section className="container mx-auto px-4 pt-14">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight uppercase">{tLanding('proofHeading')}</h2>
            <Link href={`/${locale}/gallery`} className="text-sm font-medium underline underline-offset-4">
              {tLanding('proofLink')} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            {proofPhotos.map((photo, i) => (
              <Link
                key={photo.id}
                href={`/${locale}/gallery`}
                className={`block overflow-hidden rounded-lg bg-muted ${i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] md:aspect-auto' : 'aspect-[4/3]'}`}
              >
                <img src={photo.thumb} alt={photo.alt} loading="lazy" className="h-full w-full object-cover transition hover:scale-[1.03]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="find-us" className="mt-14 scroll-mt-16 bg-hero-overlay py-12 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[1fr_1.4fr] md:items-center">
          <div>
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight uppercase md:text-4xl">{tLanding('findHeading')}</h2>
            <Button size="lg" className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90" asChild>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                <MapPin />
                {tLanding('directions')}
              </a>
            </Button>
          </div>
          <dl className="grid gap-4 text-white/90 sm:grid-cols-2">
            <div className="flex gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <dt className="text-sm text-white/60">{tLanding('addressLabel')}</dt>
                <dd>{tShop('address')}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <dt className="text-sm text-white/60">{tLanding('hoursLabel')}</dt>
                <dd>{tShop('hours')}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <dt className="text-sm text-white/60">{tLanding('phoneLabel')}</dt>
                <dd>{tShop('phone')}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <Mail className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <dt className="text-sm text-white/60">{tLanding('emailLabel')}</dt>
                <dd className="break-all">{tShop('email')}</dd>
              </div>
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <InstagramIcon className="mt-1 size-4 shrink-0 text-brand" />
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {INSTAGRAM_HANDLE}
              </a>
            </div>
          </dl>
        </div>
      </section>
    </div>
  )
}
