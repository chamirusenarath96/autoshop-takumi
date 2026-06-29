'use client'

import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './LocaleSwitcher'

type Props = { locale: string }

const INSTAGRAM_URL = 'https://www.instagram.com/autoshop_takumi/'

export function Header({ locale }: Props) {
  const t = useTranslations('nav')

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[hsl(var(--border))]">
      {/* Top bar — Instagram + locale */}
      <div className="bg-[hsl(var(--secondary))] text-white text-xs">
        <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[hsl(var(--primary))] transition"
          >
            {/* Instagram icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
            <span className="font-medium tracking-widest uppercase">Instagram</span>
          </a>
          <LocaleSwitcher locale={locale} dark />
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href={`/${locale}`} className="flex items-center">
          <img
            src="/logo.jpg"
            alt="Autoshop Takumi"
            className="h-10 w-auto object-contain"
          />
        </a>
        <nav className="flex items-center gap-8">
          <a href={`/${locale}`} className="text-sm font-medium hover:text-[hsl(var(--primary))] transition">
            {t('home')}
          </a>
          <a href={`/${locale}/vehicles`} className="text-sm font-medium hover:text-[hsl(var(--primary))] transition">
            {t('vehicles')}
          </a>
          <a href={`/${locale}/about`} className="text-sm font-medium hover:text-[hsl(var(--primary))] transition">
            {t('about')}
          </a>
        </nav>
      </div>
    </header>
  )
}
