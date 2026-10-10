import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { themeInitScript } from '@/lib/theme'
import { getSiteSettings } from '@/lib/site-settings'
import { resolveMetadataBase } from '@/lib/utils'
import '../../globals.css'

// Lets child routes' generateMetadata() (e.g. About, vehicle detail) return relative
// alternates.languages/OG URLs and have Next.js resolve them to absolute ones.
export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(process.env.NEXT_PUBLIC_SITE_URL),
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Header/Footer read SiteSettings from Payload on every render. Without this,
// generateStaticParams above makes Next.js treat the locale segment as
// static — getSiteSettings() would run once (e.g. on first build/request)
// and its result would be cached indefinitely, so admin edits in the CMS
// (and this repo's own e2e seed, which runs after the server's first
// request) would never show up.
export const dynamic = 'force-dynamic'

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ja' | 'en')) {
    notFound()
  }

  const messages = await getMessages()
  const siteSettings = await getSiteSettings(locale as 'ja' | 'en')

  return (
    <html lang={locale} data-public suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning on <body> silences browser-extension attribute injections
          (e.g. Grammarly adds data-gr-ext-installed) which are outside our control. */}
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} siteSettings={siteSettings} />
          <main>{children}</main>
          <Footer locale={locale} siteSettings={siteSettings} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
