'use client'

import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { LocaleSwitcher } from './LocaleSwitcher'
import { ThemeToggle } from './ThemeToggle'

type Props = { locale: string }

const INSTAGRAM_URL = 'https://www.instagram.com/autoshop_takumi/'

function InstagramLink() {
  return (
    <a
      href={INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Instagram"
      className="flex items-center gap-1.5 text-sm text-[hsl(var(--nav-fg))] hover:text-[hsl(var(--primary))] transition"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
      <span className="hidden sm:inline font-medium">@autoshop_takumi</span>
    </a>
  )
}

export function Header({ locale }: Props) {
  const t = useTranslations('nav')
  const pathname = usePathname()

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

        {/* Nav links */}
        <nav className="flex items-center gap-1 ml-4">
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Instagram · Locale · Theme */}
        <div className="flex items-center gap-3">
          <InstagramLink />

          <div className="w-px h-4 bg-[hsl(var(--border))]" />

          <LocaleSwitcher locale={locale} />

          <div className="w-px h-4 bg-[hsl(var(--border))]" />

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
