'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const t = useTranslations('theme')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Reflect the already-stored or inferred theme without writing to localStorage —
    // an inferred (never-chosen) theme shouldn't be persisted, or the user stops
    // following OS theme changes on their next visit.
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null
    const preferred = stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', preferred)
    setTheme(preferred)
  }, [])

  function apply(next: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    setTheme(next)
  }

  return (
    <button
      onClick={() => apply(theme === 'light' ? 'dark' : 'light')}
      aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
      className="w-8 h-8 flex items-center justify-center rounded transition hover:bg-white/10"
      style={{ color: 'var(--nav-fg)' }}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
