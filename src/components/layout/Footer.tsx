'use client'

import { useTranslations } from 'next-intl'
import { Link } from './Link'
import { Separator } from '@/components/ui/separator'
import type { SiteSettingsData } from '@/lib/site-settings'

type Props = { locale: string; siteSettings: SiteSettingsData }

export function Footer({ locale, siteSettings }: Props) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const shopName = siteSettings.shopName || 'Autoshop Takumi'

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
          {siteSettings.contactPhone && <p>{siteSettings.contactPhone}</p>}
          {siteSettings.contactEmail && <p>{siteSettings.contactEmail}</p>}
          {siteSettings.address && <p className="whitespace-pre-line">{siteSettings.address}</p>}
          {siteSettings.businessHours && <p>{siteSettings.businessHours}</p>}
          {siteSettings.instagramUrl && (
            <a
              href={siteSettings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('followUs')}
              className="hover:text-foreground"
            >
              {siteSettings.instagramHandle}
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
