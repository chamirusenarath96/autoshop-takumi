'use client'

import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')
  return (
    <footer className="border-t border-[hsl(var(--border))] mt-20 py-8">
      <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
        © {new Date().getFullYear()} Autoshop Takumi. {t('rights')}
      </div>
    </footer>
  )
}
