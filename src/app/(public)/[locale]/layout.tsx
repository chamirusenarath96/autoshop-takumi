import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter, Anton } from 'next/font/google'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getSiteSettings } from '@/lib/site-settings'
import '../../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans-loaded', display: 'swap' })
const anton = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display-loaded', display: 'swap' })

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
    <html lang={locale} data-public className={`${inter.variable} ${anton.variable}`}>
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
