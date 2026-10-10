import { getTranslations } from 'next-intl/server'
import { getPayload } from '@/lib/payload'
import { getSiteSettings } from '@/lib/site-settings'
import { resolveLocalizedField } from '@/lib/content-locale'
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
  const payload = await getPayload()

  // `locale` is still passed to findGlobal — required for ctaBanner, which remains
  // localized: true. It has no effect on heroHeadingJa/En or heroSubheadingJa/En.
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

  const heroImageUrl = (homepage.heroImage as any)?.url as string | undefined
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
