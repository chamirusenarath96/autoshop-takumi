import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import '../../globals.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Inline script runs before paint to avoid flash of wrong theme
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();
`

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'ja' | 'en')) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Blocking theme script — runs before paint to avoid flash of wrong theme.
            suppressHydrationWarning on <html> silences the expected data-theme mismatch
            (server renders without it; script sets it client-side before React hydrates). */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* suppressHydrationWarning on <body> silences browser-extension attribute injections
          (e.g. Grammarly adds data-gr-ext-installed) which are outside our control. */}
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Header locale={locale} />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
