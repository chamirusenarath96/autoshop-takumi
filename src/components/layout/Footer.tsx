'use client'

import { useTranslations } from 'next-intl'
import type { SiteSettingsData } from '@/lib/site-settings'

type Props = { locale: string; siteSettings: SiteSettingsData }

export function Footer({ locale, siteSettings }: Props) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')

  return (
    <footer
      className="mt-20 text-white"
      style={{ backgroundColor: 'hsl(var(--secondary))' }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">

        {/* Brand */}
        <div>
          <img src="/logo.png" alt={siteSettings.shopName || 'Autoshop Takumi'} className="h-8 w-auto object-contain mb-4" />
          <p className="text-white/60 text-sm leading-relaxed">{t('slogan')}</p>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">{t('navigationHeading')}</p>
          <nav className="space-y-2">
            {[
              { href: `/${locale}`, label: tNav('home') },
              { href: `/${locale}/vehicles`, label: tNav('vehicles') },
              { href: `/${locale}/about`, label: tNav('about') },
            ].map((l) => (
              <a key={l.href} href={l.href} className="block text-sm text-white/60 hover:text-[hsl(var(--primary))] transition">
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-white/50 mb-4">{t('contactHeading')}</p>
          <div className="space-y-1.5 text-sm text-white/60">
            {siteSettings.contactPhone && <p>{siteSettings.contactPhone}</p>}
            {siteSettings.contactEmail && <p>{siteSettings.contactEmail}</p>}
            {siteSettings.address && (
              <p className="leading-relaxed pt-1 whitespace-pre-line">{siteSettings.address}</p>
            )}
            {siteSettings.instagramUrl && (
              <a
                href={siteSettings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 pt-2 text-white/70 hover:text-[hsl(var(--primary))] transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
                {siteSettings.instagramHandle}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <p className="text-center text-xs text-white/30">
          © {new Date().getFullYear()} {siteSettings.shopName || 'Autoshop Takumi'}. {t('rights')}
        </p>
      </div>
    </footer>
  )
}
