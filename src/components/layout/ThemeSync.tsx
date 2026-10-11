'use client'

import { useEffect, useLayoutEffect } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/theme'

// useLayoutEffect warns during SSR; on the server there is nothing to apply anyway.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Re-applies the saved theme whenever the layout (re)mounts.
 *
 * The inline script in <head> only runs on a full page load. Switching language navigates to
 * a different `[locale]` layout, which Next.js remounts with a freshly server-rendered <html>
 * that has no `dark` class — without this, the theme silently flips back to light.
 */
export function ThemeSync() {
  useIsomorphicLayoutEffect(() => {
    try {
      document.documentElement.classList.toggle('dark', localStorage.getItem(THEME_STORAGE_KEY) === 'dark')
    } catch {
      // storage unavailable — keep whatever the page currently has
    }
  }, [])

  return null
}
