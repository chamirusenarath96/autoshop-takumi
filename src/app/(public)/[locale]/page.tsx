import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/components/layout/Link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  params: Promise<{ locale: string }>
}

// All landing copy lives in src/messages/{ja,en}.json — only the vehicle inventory is
// CMS-managed — so this page needs no database access and renders statically.
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'hero' })
  const tCta = await getTranslations({ locale, namespace: 'cta' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })

  return (
    <div>
      {/* Hero */}
      <section className="border-b">
        <div className="container mx-auto flex flex-col items-start gap-4 px-4 py-12 md:py-20">
          <Badge variant="secondary">{tShop('name')}</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('heading')}</h1>
          <p className="text-lg text-muted-foreground">{t('subheading')}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" asChild>
              <Link href={`/${locale}/vehicles`}>{t('ctaPrimary')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#contact">{t('ctaSecondary')}</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="container mx-auto px-4 pt-12">
        <Card>
          <CardHeader className="items-center text-center">
            <CardTitle className="text-2xl">{tCta('heading')}</CardTitle>
            <CardDescription>{tCta('body')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button size="lg" asChild>
              <Link href={`/${locale}/vehicles`}>{tCta('button')}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
