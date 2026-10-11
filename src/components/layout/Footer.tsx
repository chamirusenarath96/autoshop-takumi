'use client'

import { useTranslations } from 'next-intl'
import { Link } from './Link'
import { Separator } from '@/components/ui/separator'
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, JAPAN_STORE_URL } from '@/lib/shop-links'

type Props = { locale: string }

export function Footer({ locale }: Props) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const tShop = useTranslations('shop')
  const shopName = tShop('name')

  return (
    <footer id="contact" className="mt-16 border-t">
      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <p className="font-semibold">{shopName}</p>
          <p className="text-sm text-muted-foreground">{t('slogan')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t('navigationHeading')}</p>
          <nav className="flex flex-col gap-1 text-sm text-muted-foreground">
            <Link href={`/${locale}`} className="hover:text-foreground">
              {tNav('home')}
            </Link>
            <Link href={`/${locale}/vehicles`} className="hover:text-foreground">
              {tNav('vehicles')}
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p className="mb-1 text-sm font-medium text-foreground">{t('contactHeading')}</p>
          <p>{tShop('phone')}</p>
          <p>{tShop('email')}</p>
          <p className="whitespace-pre-line">{tShop('address')}</p>
          <p>{tShop('hours')}</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('followUs')}
            className="hover:text-foreground"
          >
            {INSTAGRAM_HANDLE}
          </a>
          {JAPAN_STORE_URL && (
            <a href={JAPAN_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
              {tNav('japanStore')} ↗
            </a>
          )}
        </div>
      </div>

      <Separator />
      <p className="py-4 text-center text-xs text-muted-foreground" data-testid="footer-copyright">
        © {new Date().getFullYear()} {shopName}. {t('rights')}
      </p>
    </footer>
  )
}
