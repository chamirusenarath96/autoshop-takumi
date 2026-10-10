import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { themeInitScript } from '@/lib/theme'
import { resolveMetadataBase } from '@/lib/utils'
import '../../globals.css'

// Lets child routes' generateMetadata() (e.g. the inventory page) return relative
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

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ja' | 'en')) {
    notFound()
  }

  // Opt this segment into static rendering: nothing in the shell reads the CMS or request.
  setRequestLocale(locale)
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} data-public suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      {/* suppressHydrationWarning on <body> silences browser-extension attribute injections
          (e.g. Grammarly adds data-gr-ext-installed) which are outside our control. */}
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main>{children}</main>
          <Footer locale={locale} />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
