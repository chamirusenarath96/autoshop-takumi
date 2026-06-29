'use client'

import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from './LocaleSwitcher'

type Props = { locale: string }

export function Header({ locale }: Props) {
  const t = useTranslations('nav')

  return (
    <header className="border-b border-[hsl(var(--border))] bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <a href={`/${locale}`} className="flex items-center">
          <img
            src="/logo.jpg"
            alt="Autoshop Takumi"
            className="h-10 w-auto object-contain"
          />
        </a>
        <nav className="flex items-center gap-6">
          <a href={`/${locale}`} className="text-sm hover:text-[hsl(var(--primary))] transition">
            {t('home')}
          </a>
          <a href={`/${locale}/vehicles`} className="text-sm hover:text-[hsl(var(--primary))] transition">
            {t('vehicles')}
          </a>
          <LocaleSwitcher locale={locale} />
        </nav>
      </div>
    </header>
  )
}
