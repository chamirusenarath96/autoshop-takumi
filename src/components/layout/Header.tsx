'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
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
      className="flex items-center gap-1.5 text-sm text-[hsl(var(--nav-fg))] hover:text-[hsl(var(--primary))] transition"
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
        backgroundColor: 'hsl(var(--nav-bg))',
        borderColor: 'hsl(var(--nav-border))',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-18 flex items-center gap-6"
        style={{ height: '72px' }}
      >
        {/* Logo */}
        <a href={`/${locale}`} className="shrink-0 flex items-center">
          <img
            src="/logo.png"
            alt="Autoshop Takumi"
            className="h-9 w-auto object-contain"
          />
        </a>

        {/* Desktop nav links + right side (unchanged at lg+) */}
        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                  isActive
                    ? 'text-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                    : 'text-[hsl(var(--nav-fg))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                {link.label}
              </a>
            )
          })}
        </nav>

        <div className="flex-1" />

        <div className="hidden lg:flex items-center gap-3">
          <InstagramLink siteSettings={siteSettings} label={t('followUs')} />
          <div className="w-px h-4 bg-[hsl(var(--border))]" />
          <LocaleSwitcher locale={locale} />
          <div className="w-px h-4 bg-[hsl(var(--border))]" />
          <ThemeToggle />
        </div>

        {/* Mobile/tablet: hamburger toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t('closeMenu') : t('menu')}
          aria-expanded={menuOpen}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded hover:bg-[hsl(var(--muted))] transition text-[hsl(var(--nav-fg))]"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile/tablet: collapsible panel */}
      {menuOpen && (
        <div
          data-testid="mobile-nav-panel"
          className="lg:hidden border-t px-6 py-4 space-y-4"
          style={{ backgroundColor: 'hsl(var(--nav-bg))', borderColor: 'hsl(var(--nav-border))' }}
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-3 py-2.5 rounded text-sm font-medium transition ${
                    isActive
                      ? 'text-[hsl(var(--primary))] bg-[hsl(var(--muted))]'
                      : 'text-[hsl(var(--nav-fg))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
          </nav>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'hsl(var(--nav-border))' }}>
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
