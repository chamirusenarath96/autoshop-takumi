'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

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
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(var(--muted))] transition text-[hsl(var(--nav-fg))]"
    >
      {theme === 'light' ? (
        /* Moon icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
        </svg>
      ) : (
        /* Sun icon */
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
        </svg>
      )}
    </button>
  )
}
