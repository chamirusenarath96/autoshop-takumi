'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'
import type { SiteSettingsData } from '@/lib/site-settings'

type Props = { locale: string; siteSettings: SiteSettingsData }

function InstagramLink({ siteSettings, label }: { siteSettings: SiteSettingsData; label: string }) {
  if (!siteSettings.instagramUrl) return null

  return (
    <a
      href={siteSettings.instagramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex items-center gap-1.5 text-sm transition hover:text-primary"
      style={{ color: 'var(--nav-fg)' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
      <span className="hidden sm:inline font-medium">{siteSettings.instagramHandle}</span>
    </a>
  )
}

export function Header({ locale, siteSettings }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: `/${locale}`, label: t('home') },
    { href: `/${locale}/vehicles`, label: t('vehicles') },
    { href: `/${locale}/about`, label: t('about') },
  ]

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'var(--nav-bg)',
        borderColor: 'var(--nav-border)',
      }}
    >
      <div className="h-1" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center gap-6" style={{ height: '72px' }}>
        {/* Logo */}
        <a href={`/${locale}`} className="shrink-0 flex items-center">
          <img src="/logo.png" alt="Autoshop Takumi" className="h-9 w-auto object-contain" />
        </a>

        {/* Desktop nav links + right side (unchanged at lg+) */}
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className="takumi-eyebrow px-3 py-1.5 rounded text-xs transition hover:text-primary"
                style={{ color: isActive ? 'var(--primary)' : 'var(--nav-fg)' }}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-3">
          <InstagramLink siteSettings={siteSettings} label={t('followUs')} />
          <div className="w-px h-4" style={{ backgroundColor: 'var(--nav-border)' }} />
          <LocaleSwitcher locale={locale} />
          <div className="w-px h-4" style={{ backgroundColor: 'var(--nav-border)' }} />
          <ThemeToggle />
        </div>

        {/* Mobile/tablet: hamburger toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t('closeMenu') : t('menu')}
          aria-expanded={menuOpen}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded transition hover:bg-white/10"
          style={{ color: 'var(--nav-fg)' }}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile/tablet: collapsible panel */}
      {menuOpen && (
        <div
          data-testid="mobile-nav-panel"
          className="lg:hidden border-t px-6 py-4 space-y-4"
          style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded text-sm font-medium transition hover:text-primary"
                  style={{ color: isActive ? 'var(--primary)' : 'var(--nav-fg)' }}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--nav-border)' }}>
            <InstagramLink siteSettings={siteSettings} label={t('followUs')} />
            <div className="flex items-center gap-3">
              <LocaleSwitcher locale={locale} />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
