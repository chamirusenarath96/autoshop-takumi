'use client'

import { useTranslations } from 'next-intl'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THEME_STORAGE_KEY } from '@/lib/theme'

export function ThemeToggle() {
  const t = useTranslations('nav')

  function toggle() {
    const isDark = document.documentElement.classList.toggle('dark')
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      // storage unavailable (private mode) — the toggle still works for this page view
    }
  }

  // Both icons are always rendered; CSS (`dark:` variant) picks which one shows, so
  // there is no client state to mismatch against the server-rendered markup.
  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label={t('toggleTheme')}>
      <Sun className="dark:hidden" />
      <Moon className="hidden dark:block" />
    </Button>
  )
}
